const express = require('express');
const router = express.Router();

//Conect to DB
const db = require('../config/db');
db.connect();

//Import Order model
const Order = require('../models/Order');

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
    'Hủy đơn': 'Đã hủy',
    'Bị hủy': 'Đã hủy',
    'Trả hàng': 'Đã hủy',
};

const ALLOWED_STATUS_TRANSITIONS = {
    'Chờ duyệt': ['Chờ giao hàng', 'Bị từ chối'],
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
    }catch (err) {
        res.json({er: err.message});
    }
});

//get order by ID
router.get("/orders/:id", async (req, res) => {
    try {
        await applyOrderStatusMaintenance();
        let  order = await Order.findOne({ Ma_don_mua: req.params.id });
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
    try {
        const payload = req.body || {};

        const maDonMua = payload.Ma_don_mua || await generateNextOrderCode();
        const tongTien = Number(payload.Tong_tien || 0);
        const phiVanChuyen = Number(payload.Phi_van_chuyen || 0);

        const normalizedStatus = normalizeStatus(payload.Trang_thai || 'Chờ duyệt');
        if (!isValidStatus(normalizedStatus)) {
            return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
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
            Ma_khuyen_mai: payload.Ma_khuyen_mai || undefined,
            Phi_van_chuyen: phiVanChuyen,
            Xuat_hoa_don: Boolean(payload.Xuat_hoa_don),
            Ghi_chu: payload.Ghi_chu || '',
            Ngay_dat: payload.Ngay_dat || new Date(),
            Ma_quan_tri_vien_duyet: payload.Ma_quan_tri_vien_duyet || undefined,
            updatedAt: new Date(),
        });

        res.status(201).json({ message: 'Tạo đơn hàng thành công', order: newOrder });
    } catch (err) {
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

        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;