import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { iProduct } from '../../../interfaces/product';
import { Room } from '../../../services/room';
import { iRoom } from '../../../interfaces/room';
import { Voucher } from '../../../services/voucher';
import { iVoucher } from '../../../interfaces/voucher';
import { QRPayment } from '../qr-payment/qr-payment';
import { Order } from '../../../services/order';
import { Order_Details } from '../../../services/order_details';

interface CheckoutItem {
  product: iProduct;
  quantity: number;
}

interface CheckoutSummary {
  selectedCount: number;
  totalAmount: number;
  discountAmount: number;
  finalTotal: number;
}

interface CheckoutPayload {
  items: CheckoutItem[];
  voucherCode: string;
  appliedVoucher: iVoucher | null;
  summary: CheckoutSummary;
}

@Component({
  selector: 'app-payment-member',
  imports: [CommonModule, FormsModule, QRPayment],
  templateUrl: './payment-member.html',
  styleUrl: './payment-member.css',
})
export class PaymentMember implements OnInit {
  rooms: iRoom[] = [];
  cartItems: CheckoutItem[] = [];
  checkoutSummaryFromCart: CheckoutSummary | null = null;
  showDeleteModal: boolean = false;
  productToDelete: iProduct | null = null;
  deleteIndex: number = -1;
  showQRModal: boolean = false;
  shippingMethod: string = 'standard'; // 'standard' or 'fast'
  paymentMethod: string = 'deposit'; // 'deposit' (30%) or 'full' (100%)
  vouchers: iVoucher[] = [];
  voucherCode: string = '';
  appliedVoucher: iVoucher | null = null;
  voucherError: string = '';
  note: string = '';
  wantInvoice: boolean = false;
  createdOrderCode: string = '';

  constructor(
    private roomService: Room,
    private voucherService: Voucher,
    private orderService: Order,
    private orderDetailsService: Order_Details,
  ) { }

  ngOnInit(): void {
    // Load rooms first
    this.roomService.getRoomData().subscribe({
      next: (roomData) => {
        this.rooms = roomData;
      },
      error: (err) => {
        console.error('Error loading rooms:', err);
      }
    });

    // Load vouchers
    this.voucherService.getVoucherData().subscribe({
      next: (voucherData) => {
        this.vouchers = voucherData;
      },
      error: (err) => {
        console.error('Error loading vouchers:', err);
      }
    });

    this.loadCheckoutItems();
  }

  private loadCheckoutItems(): void {
    const rawCheckoutItems = localStorage.getItem('checkoutItems');
    if (!rawCheckoutItems) {
      this.cartItems = [];
      this.checkoutSummaryFromCart = null;
      return;
    }

    try {
      const parsedData = JSON.parse(rawCheckoutItems) as CheckoutItem[] | CheckoutPayload;

      if (Array.isArray(parsedData)) {
        // Backward compatible: old format lưu trực tiếp mảng items.
        this.cartItems = parsedData.filter(item =>
          !!item && !!item.product && typeof item.quantity === 'number' && item.quantity > 0
        );
        this.checkoutSummaryFromCart = null;
        return;
      }

      const items = Array.isArray(parsedData.items) ? parsedData.items : [];
      this.cartItems = items.filter(item =>
        !!item && !!item.product && typeof item.quantity === 'number' && item.quantity > 0
      );

      this.voucherCode = parsedData.voucherCode || '';
      this.appliedVoucher = parsedData.appliedVoucher || null;
      this.checkoutSummaryFromCart = parsedData.summary || null;
    } catch (error) {
      console.error('Invalid checkoutItems data:', error);
      this.cartItems = [];
      this.checkoutSummaryFromCart = null;
    }
  }

  getRoomName(ma_loai_phong: string): string {
    const room = this.rooms.find(r => r.Ma_loai_phong === ma_loai_phong);
    return room ? room.Ten_loai_phong : '';
  }

  getTotalAmount(): number {
    return this.cartItems.reduce((total, item) =>
      total + (item.product.Gia_ban * item.quantity), 0
    );
  }

  getShippingFee(): number {
    return this.shippingMethod === 'fast' ? 100000 : 0;
  }

  getFinalTotal(): number {
    return this.getTotalAmount() + this.getShippingFee() - this.getDiscountAmount();
  }

  getPaymentAmount(): number {
    const finalTotal = this.getFinalTotal();
    return this.paymentMethod === 'deposit' ? finalTotal * 0.3 : finalTotal;
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod = method;
  }

  setShippingMethod(method: string): void {
    this.shippingMethod = method;
  }

  applyVoucher(): void {
    this.voucherError = '';

    if (!this.voucherCode.trim()) {
      this.voucherError = 'Vui lòng nhập mã khuyến mãi';
      return;
    }

    const voucher = this.vouchers.find(v =>
      v.Ma_so.toUpperCase() === this.voucherCode.toUpperCase() && v.Trang_thai === true
    );

    if (voucher) {
      // Check if voucher is valid (date range)
      const today = new Date();
      const startDate = new Date(voucher.Ngay_bat_dau);
      const endDate = new Date(voucher.Ngay_het_han);

      if (today < startDate || today > endDate) {
        this.voucherError = 'Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực';
        this.appliedVoucher = null;
        return;
      }

      if (voucher.So_luong_con_lai <= 0) {
        this.voucherError = 'Mã khuyến mãi đã hết lượt sử dụng';
        this.appliedVoucher = null;
        return;
      }

      this.appliedVoucher = voucher;
      this.voucherError = '';
    } else {
      this.voucherError = 'Mã khuyến mãi không hợp lệ';
      this.appliedVoucher = null;
    }
  }

  getDiscountAmount(): number {
    if (!this.appliedVoucher) return 0;
    return (this.getTotalAmount() * this.appliedVoucher.Phan_tram_giam) / 100;
  }

  increaseQuantity(index: number): void {
    this.cartItems[index].quantity++;
  }

  decreaseQuantity(index: number): void {
    if (this.cartItems[index].quantity === 1) {
      // Show confirmation modal
      this.productToDelete = this.cartItems[index].product;
      this.deleteIndex = index;
      this.showDeleteModal = true;
    } else {
      this.cartItems[index].quantity--;
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.productToDelete = null;
    this.deleteIndex = -1;
  }

  confirmDelete(): void {
    if (this.deleteIndex !== -1) {
      this.cartItems.splice(this.deleteIndex, 1);
    }
    this.closeDeleteModal();
  }

  async openQRPayment(): Promise<void> {
    try {
      const userId = localStorage.getItem('userId') || undefined;

      const created = await firstValueFrom(this.orderService.createOrder({
        Ma_khach_hang: userId,
        Tong_tien: this.getFinalTotal(),
        Hinh_thuc_thanh_toan: this.paymentMethod === 'deposit' ? 'Thanh toán cọc' : 'Thanh toán toàn bộ',
        Phi_van_chuyen: this.getShippingFee(),
        Ghi_chu: this.note,
        Xuat_hoa_don: this.wantInvoice,
      }));

      const orderCode = created?.order?.Ma_don_mua;
      if (!orderCode) {
        alert('Không thể tạo đơn hàng. Vui lòng thử lại.');
        return;
      }

      await firstValueFrom(this.orderDetailsService.createOrderDetailsBulk({
        Ma_don_mua: orderCode,
        details: this.cartItems.map((item) => ({
          Ma_san_pham: item.product.Ma_san_pham,
          Don_gia: item.product.Gia_ban,
          So_luong: item.quantity,
        })),
      }));

      this.createdOrderCode = orderCode;
      this.showQRModal = true;
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
  }

  closeQRPayment(): void {
    this.showQRModal = false;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }
}
