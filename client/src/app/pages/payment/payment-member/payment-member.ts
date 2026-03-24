import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Product } from '../../../services/product';
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
  imports: [CommonModule, FormsModule, QRPayment, Modal, VoucherPopup, RouterLink],
  templateUrl: './payment-member.html',
  styleUrl: './payment-member.css',
})
export class PaymentMember implements OnInit {

  products: iProduct[] = [];
  rooms: iRoom[] = [];
  cartItems: CheckoutItem[] = [];
  checkoutSummaryFromCart: CheckoutSummary | null = null;
  showDeleteModal: boolean = false;
  productToDelete: iProduct | null = null;
  deleteIndex: number = -1;
  showQRModal: boolean = false;
  stockErrorMessage: string = '';
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
  currentUserRankCode: string = '';

  private readonly conceptDiscountPercent = 10;

  private readonly rankOrder: Record<string, number> = {
    DONG: 1,
    PH01: 1,
    BAC: 2,
    PH02: 2,
    VANG: 3,
    PH03: 3,
    KIMCUONG: 4,
    PH04: 4,
  };

  constructor(
    private productService: Product,
    private roomService: Room,
    private voucherService: Voucher,
    private orderService: Order,
    private orderDetailsService: Order_Details,
    private clientService: Client
  ) { }

  ngOnInit(): void {
    this.currentUserRankCode = this.getCurrentUserRankCode();

    this.productService.getProductData().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });

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
        this.currentUserRankCode = client?.Ma_phan_hang || this.currentUserRankCode;

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
    // Chọn từ popup chỉ điền mã; cần bấm "Áp dụng" để kích hoạt giảm giá.
    this.voucherCode = voucher.Ma_so;
    this.voucherError = '';
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

  getProductImage(product: iProduct): string {
    const firstImage = product.Hinh_anh?.[0] || '';
    return this.productService.getImgUrl(firstImage);
  }

  getFinalPrice(product: iProduct): number {
    if (!product?.Gia_ban) return 0;
    const discount = product.Phan_tram_giam_gia ?? 0;
    return product.Gia_ban * (1 - discount / 100);
  }

  getTotalAmount(): number {
    return this.cartItems.reduce((total, item) =>
      total + (this.getFinalPrice(item.product) * item.quantity), 0
    );
  }

  getTotalQuantity(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
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

      if (!this.canUseVoucherByRank(voucher)) {
        this.voucherError = 'Hạng thành viên của bạn chưa đủ điều kiện áp dụng mã này';
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
    return this.getConceptDiscountAmount() + this.getVoucherDiscountAmount();
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
        Ma_khuyen_mai: this.appliedVoucher?.Ma_khuyen_mai,
        Ghi_chu: this.note,
        Xuat_hoa_don: this.wantInvoice,
        items: this.cartItems.map(item => ({
          Ma_san_pham: item.product.Ma_san_pham,
          So_luong: item.quantity,
          Ten_san_pham: item.product.Ten_san_pham
        }))
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
          Don_gia: this.getFinalPrice(item.product),
          So_luong: item.quantity,
        })),
      }));

      // Backend đã tự động tính toán và cập nhật điểm/phân hạng khi tạo đơn hàng thành công

      this.createdOrderCode = orderCode;
      this.showQRModal = true;
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error?.error?.errorType === 'INSUFFICIENT_STOCK') {
        this.openStockErrorModal(error.error.message);
      } else {
        alert('Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
    }
  }

  openStockErrorModal(message: string): void {
    this.stockErrorMessage = message;
    const modalEl = document.getElementById('stockErrorModalPayment');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const existingModal = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);
      existingModal.show();
    }
  }

  closeStockErrorModal(): void {
    const modalEl = document.getElementById('stockErrorModalPayment');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }



  /**
   * Lấy tên hiển thị của phân hạng
   */
  private getRankLabel(rank: string): string {
    const normalized = this.normalizeRank(rank);
    if (normalized === 'DONG' || normalized === 'PH01') return 'Đồng';
    if (normalized === 'BAC' || normalized === 'PH02') return 'Bạc';
    if (normalized === 'VANG' || normalized === 'PH03') return 'Vàng';
    if (normalized === 'KIMCUONG' || normalized === 'PH04') return 'Kim cương';
    return rank;
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

  getConceptDiscountAmount(): number {
    const conceptSummary = this.getConceptSummary(this.cartItems);
    return (conceptSummary.eligibleSubtotal * this.conceptDiscountPercent) / 100;
  }

  getCompletedConceptSetCount(): number {
    return this.getConceptSummary(this.cartItems).completedSetCount;
  }

  getVoucherDiscountAmount(): number {
    if (!this.appliedVoucher) return 0;
    return (this.getTotalAmount() * this.appliedVoucher.Phan_tram_giam) / 100;
  }

  private getConceptSummary(items: CheckoutItem[]): { completedSetCount: number; eligibleSubtotal: number } {
    if (!this.products.length) {
      return { completedSetCount: 0, eligibleSubtotal: 0 };
    }

    const requiredProductsByConcept = new Map<string, Set<string>>();
    for (const product of this.products) {
      if (product.Trang_thai === false) {
        continue;
      }

      const conceptCode = product.Ma_khong_gian;
      if (!conceptCode) {
        continue;
      }

      if (!requiredProductsByConcept.has(conceptCode)) {
        requiredProductsByConcept.set(conceptCode, new Set<string>());
      }
      requiredProductsByConcept.get(conceptCode)!.add(product.Ma_san_pham);
    }

    const purchasedProductsByConcept = new Map<string, Map<string, { quantity: number; price: number }>>();
    for (const item of items) {
      if (item.quantity <= 0) {
        continue;
      }

      const conceptCode = item.product?.Ma_khong_gian;
      const productCode = item.product?.Ma_san_pham;
      if (!conceptCode || !productCode) {
        continue;
      }

      if (!purchasedProductsByConcept.has(conceptCode)) {
        purchasedProductsByConcept.set(conceptCode, new Map<string, { quantity: number; price: number }>());
      }

      const conceptItems = purchasedProductsByConcept.get(conceptCode)!;
      const current = conceptItems.get(productCode) || { quantity: 0, price: item.product.Gia_ban };
      current.quantity += item.quantity;
      current.price = item.product.Gia_ban;
      conceptItems.set(productCode, current);
    }

    let completedSetCount = 0;
    let eligibleSubtotal = 0;

    requiredProductsByConcept.forEach((requiredProducts, conceptCode) => {
      if (requiredProducts.size === 0) {
        return;
      }

      const purchasedProducts = purchasedProductsByConcept.get(conceptCode);
      if (!purchasedProducts || purchasedProducts.size < requiredProducts.size) {
        return;
      }

      let conceptSetCount = Number.MAX_SAFE_INTEGER;
      let conceptSingleSetSubtotal = 0;

      requiredProducts.forEach((productCode) => {
        const purchased = purchasedProducts.get(productCode);
        if (!purchased) {
          conceptSetCount = 0;
          return;
        }

        conceptSetCount = Math.min(conceptSetCount, purchased.quantity);
        conceptSingleSetSubtotal += purchased.price;
      });

      if (conceptSetCount > 0 && conceptSetCount !== Number.MAX_SAFE_INTEGER) {
        completedSetCount += conceptSetCount;
        eligibleSubtotal += conceptSingleSetSubtotal * conceptSetCount;
      }
    });

    return { completedSetCount, eligibleSubtotal };
  }

  private canUseVoucherByRank(voucher: iVoucher): boolean {
    const requiredRankLevel = this.getRankLevel(voucher.Ma_phan_hang_toi_thieu);
    if (requiredRankLevel === 0) {
      return true;
    }

    const userRankLevel = this.getRankLevel(this.currentUserRankCode);
    return userRankLevel >= requiredRankLevel;
  }

  private getCurrentUserRankCode(): string {
    try {
      const userRaw = localStorage.getItem('current_user');
      if (!userRaw) return '';

      const user = JSON.parse(userRaw);
      return user?.Ma_phan_hang || '';
    } catch {
      return '';
    }
  }

  private getRankLevel(rankCode: string): number {
    const normalized = this.normalizeRank(rankCode);
    return this.rankOrder[normalized] || 0;
  }

  private normalizeRank(value: string): string {
    return (value || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[\s_-]+/g, '');
  }
}
