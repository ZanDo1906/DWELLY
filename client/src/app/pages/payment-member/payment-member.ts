import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../services/product';
import { iProduct } from '../../interfaces/product';
import { Room } from '../../services/room';
import { iRoom } from '../../interfaces/room';
import { Voucher } from '../../services/voucher';
import { iVoucher } from '../../interfaces/voucher';
import { QRPayment } from '../qr-payment/qr-payment';

@Component({
  selector: 'app-payment-member',
  imports: [CommonModule, FormsModule, QRPayment],
  templateUrl: './payment-member.html',
  styleUrl: './payment-member.css',
})
export class PaymentMember implements OnInit {
  products: iProduct[] = [];
  rooms: iRoom[] = [];
  cartItems: any[] = [];
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

  constructor(
    private productService: Product,
    private roomService: Room,
    private voucherService: Voucher
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

    // Load products
    this.productService.getProductData().subscribe({
      next: (data) => {
        this.products = data;
        // Load 3 different sample products from 3 different rooms
        this.cartItems = [
          {
            product: this.products[0], // Giường bọc nệm Seraph - Phòng ngủ
            quantity: 1
          },
          {
            product: this.products[16], // Bàn ăn gỗ sồi Terra - Phòng ăn
            quantity: 1
          },
          {
            product: this.products[17], // Tủ TV Seraph - Phòng khách
            quantity: 1
          }
        ];
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
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

  openQRPayment(): void {
    this.showQRModal = true;
  }

  closeQRPayment(): void {
    this.showQRModal = false;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }
}
