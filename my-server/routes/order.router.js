const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Order model
const Order = require('../models/Order');
const Voucher = require('../models/Voucher');
const Client = require('../models/Client');
const Ranking = require('../models/Ranking');
const Notification = require('../models/Notification');
const Product = require('../models/Product');
const Order_Detail = require('../models/Order_Detail');

async function updateClientTier(clientId) {
    if (!clientId) return;
    try {
        const client = await Client.findOne({ Ma_khach_hang: clientId }).lean();
        if (!client) return;

        const rankings = await Ranking.find({}).sort({ Diem_toi_thieu: -1 }).lean();
        const qualifiedRanking = rankings.find(r => client.Tong_diem >= r.Diem_toi_thieu);

        if (qualifiedRanking && client.Ma_phan_hang !== qualifiedRanking.Ma_phan_hang) {
            await Client.findOneAndUpdate(
                { Ma_khach_hang: clientId },
                { $set: { Ma_phan_hang: qualifiedRanking.Ma_phan_hang, updatedAt: new Date() } }
            );
        }
    } catch (error) {
        console.error('Update client tier failed:', error.message);
    }
}

const ORDER_STATUSES = new Set([
    'Chờ duyệt',
    'Chờ giao hàng',
    'Đang giao',
    'Đã giao',
    'Hoàn thành',
    'Bị từ chối',
    'Đã hủy',
]);

const LEGACY_STATUS_MAP = {
    'Đã duyệt': 'Chờ giao hàng',
    'Đã giao hàng': 'Đã giao',
    'Hủy đơn': 'Đã hủy',
    'Bị hủy': 'Đã hủy',
    'Trả hàng': 'Đã hủy',
};

const ALLOWED_STATUS_TRANSITIONS = {
    'Chờ duyệt': ['Chờ giao hàng', 'Bị từ chối', 'Đã hủy'],
    'Chờ giao hàng': ['Đang giao', 'Đã hủy'],
    'Đang giao': ['Đã giao'],
    'Đã giao': ['Hoàn thành'],
};

function normalizeStatus(status) {
    if (!status || typeof status !== 'string') {
        return status;
    }
    return LEGACY_STATUS_MAP[status] || status;
}

function isValidStatus(status) {
    return ORDER_STATUSES.has(status);
}

function canTransitionStatus(fromStatus, toStatus) {
    if (fromStatus === toStatus) {
        return true;
    }
    const allowed = ALLOWED_STATUS_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
}

async function syncLegacyStatuses() {
    const updates = Object.entries(LEGACY_STATUS_MAP).map(([legacyStatus, mappedStatus]) =>
        Order.updateMany({ Trang_thai: legacyStatus }, { $set: { Trang_thai: mappedStatus } })
    );
    await Promise.all(updates);
}

async function autoCompleteDeliveredOrders() {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Order.updateMany(
        {
            Trang_thai: 'Đã giao',
            $or: [
                { Thoi_gian_da_giao: { $lte: threshold } },
                { Thoi_gian_da_giao: { $exists: false }, updatedAt: { $lte: threshold } },
            ],
        },
        {
            $set: {
                Trang_thai: 'Hoàn thành',
                updatedAt: new Date(),
            },
        }
    );
}

async function applyOrderStatusMaintenance() {
    await syncLegacyStatuses();
    await autoCompleteDeliveredOrders();
}

async function generateNextOrderCode() {
    const lastOrder = await Order.findOne({ Ma_don_mua: /^ORD\d+$/ })
        .sort({ Ma_don_mua: -1 })
        .lean();

    const currentNumber = Number(String(lastOrder?.Ma_don_mua || '').replace('ORD', '')) || 0;
    const nextNumber = currentNumber + 1;
    return `ORD${String(nextNumber).padStart(3, '0')}`;
}

//Define API
router.get("/", (req, res) => {
    res.send("Ok");
});

//get all orders (2) -> using async await
router.get("/orders", async (req, res) => {
    try {
        await applyOrderStatusMaintenance();
        let orders = await Order.find({});
        res.json(orders);
    } catch (err) {
        res.json({ er: err.message });
    }
});

//get order by ID
router.get("/orders/:id", async (req, res) => {
    try {
        await applyOrderStatusMaintenance();
        let order = await Order.findOne({ Ma_don_mua: req.params.id });
        if (!order) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/orders/user/:id', async (req, res) => {
    try {
        await applyOrderStatusMaintenance();
        const userId = req.params.id;

        const orders = await Order.aggregate([
            { $match: { Ma_khach_hang: userId } },
            {
                $lookup: {
                    from: 'order_details',
                    localField: 'Ma_don_mua',
                    foreignField: 'Ma_don_mua',
                    as: 'details'
                }
            }
        ]);

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/orders', async (req, res) => {
    let appliedVoucherCode;
    let voucherConsumed = false;

    try {
        const payload = req.body || {};

        const maDonMua = payload.Ma_don_mua || await generateNextOrderCode();
        const tongTien = Number(payload.Tong_tien || 0);
        const phiVanChuyen = Number(payload.Phi_van_chuyen || 0);

        const normalizedStatus = normalizeStatus(payload.Trang_thai || 'Chờ duyệt');
        if (!isValidStatus(normalizedStatus)) {
            return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
        }

        const incomingVoucherIdentifier =
            (typeof payload.Ma_khuyen_mai === 'string' && payload.Ma_khuyen_mai.trim())
            || (typeof payload.Ma_so === 'string' && payload.Ma_so.trim())
            || (typeof payload.voucherCode === 'string' && payload.voucherCode.trim())
            || '';

        if (incomingVoucherIdentifier) {
            const now = new Date();
            const matchedVoucher = await Voucher.findOne(
                {
                    $or: [
                        { Ma_khuyen_mai: incomingVoucherIdentifier },
                        { Ma_so: incomingVoucherIdentifier },
                    ],
                    Trang_thai: true,
                }
            ).lean();

            if (!matchedVoucher) {
                return res.status(400).json({
                    message: 'Mã khuyến mãi không hợp lệ hoặc không hoạt động',
                });
            }

            if (Number(matchedVoucher.So_luong_con_lai || 0) <= 0) {
                return res.status(400).json({
                    message: 'Mã khuyến mãi đã hết lượt sử dụng',
                });
            }

            const startDate = new Date(matchedVoucher.Ngay_bat_dau);
            const endDate = new Date(matchedVoucher.Ngay_het_han);
            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || now < startDate || now > endDate) {
                return res.status(400).json({
                    message: 'Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực',
                });
            }

            const consumedVoucher = await Voucher.findOneAndUpdate(
                {
                    Ma_khuyen_mai: matchedVoucher.Ma_khuyen_mai,
                    So_luong_con_lai: { $gt: 0 },
                },
                { $inc: { So_luong_con_lai: -1 } },
                { new: true }
            );

            if (!consumedVoucher) {
                return res.status(400).json({
                    message: 'Mã khuyến mãi đã hết lượt sử dụng',
                });
            }

            if (consumedVoucher.So_luong_con_lai === 0) {
                 consumedVoucher.Trang_thai = false;
                 await consumedVoucher.save();
            }

            appliedVoucherCode = consumedVoucher.Ma_khuyen_mai;
            voucherConsumed = true;
        }

        // Inventory Pre-check
        if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
            for (const item of payload.items) {
                const product = await Product.findOne({ Ma_san_pham: item.Ma_san_pham }).lean();
                if (!product || product.So_luong_ton_kho < item.So_luong) {
                    if (voucherConsumed && appliedVoucherCode) {
                        try {
                            const rbVoucher = await Voucher.findOneAndUpdate(
                                { Ma_khuyen_mai: appliedVoucherCode },
                                { $inc: { So_luong_con_lai: 1 } },
                                { new: true }
                            );
                            if (rbVoucher && rbVoucher.So_luong_con_lai > 0 && !rbVoucher.Trang_thai) {
                                rbVoucher.Trang_thai = true;
                                await rbVoucher.save();
                            }
                        } catch (rollbackError) {}
                    }
                    return res.status(400).json({ 
                        errorType: 'INSUFFICIENT_STOCK',
                        message: `Sản phẩm "${product ? product.Ten_san_pham : item.Ma_san_pham}" chỉ còn ${product ? product.So_luong_ton_kho : 0} cái, không đủ số lượng để đặt.`
                    });
                }
            }
        }

        const newOrder = await Order.create({
            Ma_don_mua: maDonMua,
            Ma_khach_hang: payload.Ma_khach_hang || undefined,
            Thong_tin_giao_hang: payload.Thong_tin_giao_hang || undefined,
            Thong_tin_khach_vang_lai: payload.Thong_tin_khach_vang_lai || undefined,
            Tong_tien: tongTien,
            Hinh_thuc_thanh_toan: payload.Hinh_thuc_thanh_toan || 'Thanh toán toàn bộ',
            Trang_thai: normalizedStatus,
            Thoi_gian_da_giao: normalizedStatus === 'Đã giao' ? new Date() : undefined,
            Ma_khuyen_mai: appliedVoucherCode,
            Phi_van_chuyen: phiVanChuyen,
            Xuat_hoa_don: Boolean(payload.Xuat_hoa_don),
            Ghi_chu: payload.Ghi_chu || '',
            Ngay_dat: payload.Ngay_dat || new Date(),
            Ma_quan_tri_vien_duyet: payload.Ma_quan_tri_vien_duyet || undefined,
            updatedAt: new Date(),
        });

        // Logged-in customers earn points: 0.1% of order value.
        if (payload.Ma_khach_hang) {
            try {
                await Notification.create({
                    Ma_khach_hang: payload.Ma_khach_hang,
                    Tieu_de: 'Đặt hàng thành công',
                    Noi_dung: `Đơn hàng #${maDonMua} của bạn đã được tiếp nhận và đang chờ duyệt.`,
                    Loai: 'orders',
                    Lien_ket: `/user-layout/order-detail/${maDonMua}`
                });
            } catch (notifyErr) {
                console.error('Create notification failed:', notifyErr.message);
            }

            const earnedPoints = Number(tongTien) * 0.001;

            if (earnedPoints > 0) {
                try {
                    await Client.findOneAndUpdate(
                        { Ma_khach_hang: payload.Ma_khach_hang },
                        { $inc: { Tong_diem: earnedPoints }, $set: { updatedAt: new Date() } }
                    );
                    await updateClientTier(payload.Ma_khach_hang);
                } catch (pointsError) {
                    console.error('Update loyalty points failed:', pointsError.message);
                }
            }
        }

        // Deduct inventory
        if (payload.items && Array.isArray(payload.items)) {
            for (const item of payload.items) {
                await Product.findOneAndUpdate(
                    { Ma_san_pham: item.Ma_san_pham },
                    { $inc: { So_luong_ton_kho: -item.So_luong } }
                );
            }
        }

        res.status(201).json({ message: 'Tạo đơn hàng thành công', order: newOrder });
    } catch (err) {
        if (voucherConsumed && appliedVoucherCode) {
            try {
                const rbVoucher = await Voucher.findOneAndUpdate(
                    { Ma_khuyen_mai: appliedVoucherCode },
                    { $inc: { So_luong_con_lai: 1 } },
                    { new: true }
                );
                if (rbVoucher && rbVoucher.So_luong_con_lai > 0 && !rbVoucher.Trang_thai) {
                    rbVoucher.Trang_thai = true;
                    await rbVoucher.save();
                }
            } catch (rollbackError) {
                console.error('Rollback voucher failed:', rollbackError.message);
            }
        }
        res.status(500).json({ message: err.message });
    }
});

// Update order status
router.patch("/orders/:id", async (req, res) => {
    try {
        const orderId = req.params.id;
        const updateData = { ...(req.body || {}) };

        const existingOrder = await Order.findOne({ Ma_don_mua: orderId });
        if (!existingOrder) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }

        const currentStatus = normalizeStatus(existingOrder.Trang_thai);
        if (currentStatus !== existingOrder.Trang_thai && isValidStatus(currentStatus)) {
            existingOrder.Trang_thai = currentStatus;
            await existingOrder.save();
        }

        if (Object.prototype.hasOwnProperty.call(updateData, 'Trang_thai')) {
            const requestedStatus = normalizeStatus(updateData.Trang_thai);

            if (!isValidStatus(requestedStatus)) {
                return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
            }

            if (!canTransitionStatus(currentStatus, requestedStatus)) {
                return res.status(400).json({
                    message: `Không thể chuyển trạng thái từ "${currentStatus}" sang "${requestedStatus}"`,
                });
            }

            updateData.Trang_thai = requestedStatus;
            if (requestedStatus === 'Đã giao') {
                updateData.Thoi_gian_da_giao = new Date();
            } else if (requestedStatus === 'Hoàn thành' || requestedStatus === 'Đã hủy' || requestedStatus === 'Bị từ chối') {
                updateData.Thoi_gian_da_giao = existingOrder.Thoi_gian_da_giao;
            }

            // Deduct loyalty points and restore product stock if order is canceled or rejected AND it wasn't already canceled/rejected
            if (currentStatus !== requestedStatus && (requestedStatus === 'Đã hủy' || requestedStatus === 'Bị từ chối')) {
                // Restore points
                if (existingOrder.Ma_khach_hang) {
                    const deductedPoints = Number(existingOrder.Tong_tien) * 0.001;
                    if (deductedPoints > 0) {
                        try {
                            await Client.findOneAndUpdate(
                                { Ma_khach_hang: existingOrder.Ma_khach_hang },
                                { $inc: { Tong_diem: -deductedPoints }, $set: { updatedAt: new Date() } }
                            );
                            await updateClientTier(existingOrder.Ma_khach_hang);
                        } catch (pointsError) {
                            console.error('Rollback loyalty points failed:', pointsError.message);
                        }
                    }
                }

                // Restore stock
                try {
                    const orderDetails = await Order_Detail.find({ Ma_don_mua: existingOrder.Ma_don_mua }).lean();
                    for (const detail of orderDetails) {
                        await Product.findOneAndUpdate(
                            { Ma_san_pham: detail.Ma_san_pham },
                            { $inc: { So_luong_ton_kho: detail.So_luong } }
                        );
                    }
                } catch (stockError) {
                    console.error('Stock restoration failed:', stockError.message);
                }
            }
        }

        if (Object.prototype.hasOwnProperty.call(updateData, 'Xuat_hoa_don')) {
            updateData.Xuat_hoa_don = Boolean(updateData.Xuat_hoa_don);
        }

        updateData.updatedAt = new Date();

        const updatedOrder = await Order.findOneAndUpdate(
            { Ma_don_mua: orderId },
            updateData,
            { new: true, runValidators: true }
        );

        // Notify client of status change
        if (updatedOrder && updateData.Trang_thai && existingOrder.Ma_khach_hang && currentStatus !== updateData.Trang_thai) {
            try {
                let title = 'Cập nhật đơn hàng';
                let message = `Đơn hàng #${updatedOrder.Ma_don_mua} đã chuyển sang trạng thái: ${updateData.Trang_thai}.`;
                
                if (updateData.Trang_thai === 'Đang giao') {
                    title = 'Đơn hàng đang giao';
                    message = `Đơn hàng #${updatedOrder.Ma_don_mua} của bạn đang trên đường đến. Vui lòng chú ý điện thoại.`;
                } else if (updateData.Trang_thai === 'Đã giao') {
                    title = 'Giao hàng thành công';
                    message = `Đơn hàng #${updatedOrder.Ma_don_mua} đã giao thành công. Cảm ơn bạn đã tin dùng dịch vụ DWELLY!`;
                } else if (updateData.Trang_thai === 'Đã hủy') {
                    title = 'Đơn hàng đã hủy';
                    message = `Đơn hàng #${updatedOrder.Ma_don_mua} đã bị hủy.`;
                }

                await Notification.create({
                    Ma_khach_hang: existingOrder.Ma_khach_hang,
                    Tieu_de: title,
                    Noi_dung: message,
                    Loai: 'orders',
                    Lien_ket: `/user-layout/order-detail/${updatedOrder.Ma_don_mua}`
                });
            } catch (notifyErr) {
                console.error('Create notification failed:', notifyErr.message);
            }
        }

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;