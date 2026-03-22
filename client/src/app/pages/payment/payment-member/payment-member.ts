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
import { Client } from '../../../services/client';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Modal } from '../../../components/modal/modal';
import { VoucherPopup } from '../../cart/voucher-popup/voucher-popup';

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

interface CheckoutAddress {
  sourceIndex: number;
  fullName: string;
  phone: string;
  address: string;
  isDefault: boolean;
  city?: string;
  district?: string;
  ward?: string;
  detailAddress?: string;
}

@Component({
  selector: 'app-payment-member',
  imports: [CommonModule, FormsModule, QRPayment, Modal, VoucherPopup],
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
  userId: string = '';
  defaultAddress: CheckoutAddress | null = null;
  addressOptions: CheckoutAddress[] = [];
  selectedAddressIndex: number = -1;
  tempSelectedAddressIndex: number = -1;
  isLoadingAddress: boolean = false;

  constructor(
    private roomService: Room,
    private voucherService: Voucher,
    private orderService: Order,
    private orderDetailsService: Order_Details,
    private clientService: Client
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
    this.loadCustomerAddresses();
  }

  private loadCustomerAddresses(): void {
    const currentUser = this.clientService.getCurrentUser();
    const fallbackName = currentUser?.Ho_va_ten || 'Khách hàng';
    const fallbackPhone = currentUser?.So_dien_thoai || '';

    this.userId = localStorage.getItem('userId') || currentUser?.Ma_khach_hang || '';

    if (!this.userId) {
      this.buildAddressSections(currentUser?.Dia_chi || [], fallbackName, fallbackPhone);
      return;
    }

    this.isLoadingAddress = true;

    forkJoin({
      client: this.clientService.getClientById(this.userId).pipe(catchError(() => of(null))),
      addresses: this.clientService.getClientAddress(this.userId).pipe(catchError(() => of({ address: [] as any[] }))),
    }).subscribe({
      next: ({ client, addresses }) => {
        const customerName = client?.Ho_va_ten || fallbackName;
        const customerPhone = client?.So_dien_thoai || fallbackPhone;
        const rawAddresses = Array.isArray(addresses?.address) && addresses.address.length > 0
          ? addresses.address
          : (currentUser?.Dia_chi || []);

        this.buildAddressSections(rawAddresses, customerName, customerPhone);
        this.isLoadingAddress = false;
      },
      error: () => {
        this.buildAddressSections(currentUser?.Dia_chi || [], fallbackName, fallbackPhone);
        this.isLoadingAddress = false;
      }
    });
  }

  private buildAddressSections(rawAddresses: any[], customerName: string, customerPhone: string): void {
    const mappedAddresses = (rawAddresses || [])
      .map((item, index) => this.mapAddressItem(item, index, customerName, customerPhone))
      .filter((item): item is CheckoutAddress => item !== null);

    this.addressOptions = mappedAddresses;

    if (mappedAddresses.length === 0) {
      this.defaultAddress = null;
      this.selectedAddressIndex = -1;
      this.tempSelectedAddressIndex = -1;
      return;
    }

    const defaultIndex = mappedAddresses.findIndex(item => item.isDefault);
    this.selectedAddressIndex = defaultIndex >= 0 ? defaultIndex : 0;
    this.tempSelectedAddressIndex = this.selectedAddressIndex;
    this.defaultAddress = mappedAddresses[this.selectedAddressIndex];
  }

  private mapAddressItem(
    item: any,
    index: number,
    customerName: string,
    customerPhone: string
  ): CheckoutAddress | null {
    if (typeof item === 'string') {
      const addressText = item.trim();
      if (!addressText) return null;

      return {
        sourceIndex: index,
        fullName: customerName,
        phone: customerPhone,
        address: addressText,
        isDefault: index === 0,
        detailAddress: addressText,
      };
    }

    if (item && typeof item === 'object') {
      const fullName = item.FullName || item.fullName || item.name || item.ten_nguoi_nhan || customerName;
      const phone = item.Phone || item.phone || item.so_dien_thoai || item.soDienThoai || customerPhone;
      const address = item.address
        || item.dia_chi
        || item.fullAddress
        || [item.DetailAddress, item.Ward, item.District, item.Province].filter(Boolean).join(', ')
        || '';

      if (!String(address).trim()) return null;

      return {
        sourceIndex: index,
        fullName: String(fullName).trim(),
        phone: String(phone).trim(),
        address: String(address).trim(),
        isDefault: Boolean(item.IsDefault),
        city: item.Province || item.tinh_thanh || item.city || '',
        district: item.District || item.quan_huyen || item.district || '',
        ward: item.Ward || item.phuong_xa || item.ward || '',
        detailAddress: item.DetailAddress || item.dia_chi_cu_the || item.detailAddress || String(address).trim(),
      };
    }

    return null;
  }

  openAddressModal(): void {
    this.tempSelectedAddressIndex = this.selectedAddressIndex;

    setTimeout(() => {
      const modalEl = document.getElementById('addressSelectionModal');
      if (modalEl) {
        const modal = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    }, 0);
  }

  closeAddressModal(): void {
    const modalEl = document.getElementById('addressSelectionModal');
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }

  closeVoucherPopup(): void {
    const modalEl = document.getElementById('voucherModal');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }

  handleVoucherSelected(voucher: iVoucher): void {
    // Chỉ điền mã vào input, chưa áp dụng.
    this.voucherCode = voucher.Ma_so;
    this.voucherError = '';
    // Reset appliedVoucher để user phải bấm "Áp dụng".
    this.appliedVoucher = null;
  }

  clearVoucher(): void {
    this.voucherCode = '';
    this.appliedVoucher = null;
    this.voucherError = '';
  }

  confirmSelectedAddress(): void {
    if (this.tempSelectedAddressIndex >= 0 && this.tempSelectedAddressIndex < this.addressOptions.length) {
      this.selectedAddressIndex = this.tempSelectedAddressIndex;
      this.defaultAddress = this.addressOptions[this.selectedAddressIndex];
    }

    this.closeAddressModal();
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
      const selectedAddress = this.defaultAddress;

      if (!selectedAddress) {
        alert('Bạn chưa có địa chỉ nhận hàng. Vui lòng thêm/chọn địa chỉ trước khi đặt hàng.');
        return;
      }

      const created = await firstValueFrom(this.orderService.createOrder({
        Ma_khach_hang: userId,
        Thong_tin_giao_hang: {
          Ho_ten_nguoi_nhan: selectedAddress.fullName,
          So_dien_thoai_nguoi_nhan: selectedAddress.phone,
          Tinh_thanh: selectedAddress.city || '',
          Quan_huyen: selectedAddress.district || '',
          Phuong_xa: selectedAddress.ward || '',
          Dia_chi_cu_the: selectedAddress.detailAddress || selectedAddress.address,
        },
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

  getPurchasedProductIds(): string[] {
    return this.cartItems
      .map(item => item?.product?.Ma_san_pham)
      .filter((productId): productId is string => typeof productId === 'string' && productId.trim().length > 0);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }
}
