import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { iProduct } from '../../../interfaces/product';
import { Product } from '../../../services/product';
import { Room } from '../../../services/room';
import { iRoom } from '../../../interfaces/room';
import { Voucher } from '../../../services/voucher';
import { iVoucher } from '../../../interfaces/voucher';
import { QRPayment } from '../qr-payment/qr-payment';
import { VoucherPopup } from '../../cart/voucher-popup/voucher-popup';
import { Modal } from '../../../components/modal/modal';
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
  selector: 'app-payment-non-member',
  imports: [CommonModule, FormsModule, QRPayment, VoucherPopup, Modal, RouterLink],
  templateUrl: './payment-non-member.html',
  styleUrl: './payment-non-member.css',
})
export class PaymentNonMember implements OnInit {
  products: iProduct[] = [];
  rooms: iRoom[] = [];
  cartItems: CheckoutItem[] = [];
  checkoutSummaryFromCart: CheckoutSummary | null = null;
  showDeleteModal: boolean = false;
  productToDelete: iProduct | null = null;
  deleteIndex: number = -1;
  showQRModal: boolean = false;
  showValidationModal: boolean = false;
  shippingMethod: string = 'standard'; // 'standard' or 'fast'
  paymentMethod: string = 'deposit'; // 'deposit' (30%) or 'full' (100%)
  vouchers: iVoucher[] = [];
  voucherCode: string = '';
  appliedVoucher: iVoucher | null = null;
  voucherError: string = '';
  note: string = '';
  wantInvoice: boolean = false;
  createdOrderCode: string = '';
  isLoggedIn: boolean = false;

  private readonly conceptDiscountPercent = 10;

  // Address form fields
  fullName: string = '';
  phone: string = '';
  otpCode: string = '';
  email: string = '';
  city: string = '';
  district: string = '';
  ward: string = '';
  specificAddress: string = '';

  // Location data for dropdowns
  provinces: any[] = [];
  districts: any[] = [];
  wards: any[] = [];
  selectedProvinceCode: string = '';
  selectedDistrictCode: string = '';
  isProvinceDropdownOpen: boolean = false;
  isDistrictDropdownOpen: boolean = false;
  isWardDropdownOpen: boolean = false;

  // OTP countdown
  otpCountdown: number = 0;
  otpTimer: any = null;
  otpSent: boolean = false;
  otpVerified: boolean = false;
  generatedOtpCode: string = '';

  // Validation tracking
  touched = {
    fullName: false,
    phone: false,
    otpCode: false,
    city: false,
    district: false,
    ward: false,
    specificAddress: false,
    email: false
  };

  phoneValidationError: string = '';
  otpValidationError: string = '';

  constructor(
    private productService: Product,
    private roomService: Room,
    private voucherService: Voucher,
    private http: HttpClient,
    private orderService: Order,
    private orderDetailsService: Order_Details,
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('userId');

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

    // Load provinces
    this.loadProvinces();

    this.loadCheckoutItems();
  }

  @HostListener('document:click')
  closeAllDropdowns(): void {
    this.isProvinceDropdownOpen = false;
    this.isDistrictDropdownOpen = false;
    this.isWardDropdownOpen = false;
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

  setShippingMethod(method: string): void {
    this.shippingMethod = method;
  }

  applyVoucher(): void {
    if (!this.isLoggedIn) {
      return;
    }

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

  getDiscountAmount(): number {
    return this.getConceptDiscountAmount() + this.getVoucherDiscountAmount();
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

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }

  // Location methods
  loadProvinces(): void {
    this.http.get<any[]>('https://provinces.open-api.vn/api/p/').subscribe({
      next: (data) => {
        this.provinces = data;
      },
      error: (err) => {
        console.error('Error loading provinces:', err);
      }
    });
  }

  onProvinceChange(): void {
    // Reset dependent fields
    this.district = '';
    this.ward = '';
    this.districts = [];
    this.wards = [];
    this.selectedDistrictCode = '';

    if (!this.selectedProvinceCode) return;

    // Load districts for selected province
    this.http.get<any>(`https://provinces.open-api.vn/api/p/${this.selectedProvinceCode}?depth=2`).subscribe({
      next: (data) => {
        this.districts = data.districts || [];
      },
      error: (err) => {
        console.error('Error loading districts:', err);
      }
    });
  }

  onProvinceSelect(): void {
    // Update city name from selected province
    const selectedProvince = this.provinces.find(p => String(p.code) === this.selectedProvinceCode);
    if (selectedProvince) {
      this.city = selectedProvince.name;
    }
    // Clear validation error for city when a province is selected
    this.touched.city = false;
    this.onProvinceChange();
  }

  onDistrictChange(): void {
    // Reset dependent fields
    this.ward = '';
    this.wards = [];

    if (!this.selectedDistrictCode) return;

    // Load wards for selected district
    this.http.get<any>(`https://provinces.open-api.vn/api/d/${this.selectedDistrictCode}?depth=2`).subscribe({
      next: (data) => {
        this.wards = data.wards || [];
      },
      error: (err) => {
        console.error('Error loading wards:', err);
      }
    });
  }

  onDistrictSelect(): void {
    // Update district name from selected district
    const selectedDistrict = this.districts.find(d => String(d.code) === this.selectedDistrictCode);
    if (selectedDistrict) {
      this.district = selectedDistrict.name;
    }
    // Clear validation error for district when a district is selected
    this.touched.district = false;
    this.onDistrictChange();
  }

  onWardSelect(): void {
    // Clear validation error for ward when a ward is selected
    if (this.ward) {
      this.touched.ward = false;
    }
  }

  toggleProvinceDropdown(event: Event): void {
    event.stopPropagation();
    this.isProvinceDropdownOpen = !this.isProvinceDropdownOpen;
    this.isDistrictDropdownOpen = false;
    this.isWardDropdownOpen = false;
  }

  toggleDistrictDropdown(event: Event): void {
    event.stopPropagation();
    if (!this.selectedProvinceCode || this.districts.length === 0) return;

    this.isDistrictDropdownOpen = !this.isDistrictDropdownOpen;
    this.isProvinceDropdownOpen = false;
    this.isWardDropdownOpen = false;
  }

  toggleWardDropdown(event: Event): void {
    event.stopPropagation();
    if (!this.selectedDistrictCode || this.wards.length === 0) return;

    this.isWardDropdownOpen = !this.isWardDropdownOpen;
    this.isProvinceDropdownOpen = false;
    this.isDistrictDropdownOpen = false;
  }

  selectProvince(province: any, event: Event): void {
    event.stopPropagation();
    this.selectedProvinceCode = String(province.code);
    this.onProvinceSelect();
    this.isProvinceDropdownOpen = false;
    this.isDistrictDropdownOpen = false;
    this.isWardDropdownOpen = false;
  }

  selectDistrict(district: any, event: Event): void {
    event.stopPropagation();
    this.selectedDistrictCode = String(district.code);
    this.onDistrictSelect();
    this.isDistrictDropdownOpen = false;
    this.isWardDropdownOpen = false;
  }

  selectWard(ward: any, event: Event): void {
    event.stopPropagation();
    this.ward = String(ward.name);
    this.onWardSelect();
    this.isWardDropdownOpen = false;
  }

  getSelectedProvinceName(): string {
    const selected = this.provinces.find(p => String(p.code) === this.selectedProvinceCode);
    return selected?.name || 'Chọn Tỉnh/ Thành phố';
  }

  getSelectedDistrictName(): string {
    const selected = this.districts.find(d => String(d.code) === this.selectedDistrictCode);
    return selected?.name || 'Chọn Quận/ Huyện';
  }

  getSelectedWardName(): string {
    return this.ward || 'Chọn Phường/ Xã';
  }

  // Form validation methods
  validateField(fieldName: keyof typeof this.touched): void {
    this.touched[fieldName] = true;
  }

  hasError(fieldName: keyof typeof this.touched): boolean {
    if (!this.touched[fieldName]) return false;

    // Email validation - chỉ check format nếu đã nhập
    if (fieldName === 'email') {
      return this.email.trim() !== '' && !this.isValidEmail(this.email);
    }

    // Phone validation - check both empty and format
    if (fieldName === 'phone') {
      return this.phone.trim() === '' || !this.validatePhoneFormat(this.phone);
    }

    if (fieldName === 'otpCode') {
      return this.otpCode.trim() === '' || !this.otpVerified;
    }

    // Check dropdown fields
    if (fieldName === 'city') {
      return !this.selectedProvinceCode || this.selectedProvinceCode === '';
    }
    if (fieldName === 'district') {
      return !this.selectedDistrictCode || this.selectedDistrictCode === '';
    }
    if (fieldName === 'ward') {
      return !this.ward || this.ward === '';
    }

    // Other text fields
    const value = this[fieldName as keyof PaymentNonMember] as string;
    return !value || value.trim() === '';
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    // Accept phone numbers with + or digits only
    const phoneRegex = /^\+?[0-9]+$/;
    return phoneRegex.test(phone.trim());
  }

  sendOTP(): void {
    this.phoneValidationError = '';
    this.otpValidationError = '';

    if (this.phone.trim() === '') {
      this.phoneValidationError = 'Vui l\u00f2ng nh\u1eadp s\u1ed1 \u0111i\u1ec7n tho\u1ea1i';
      return;
    }

    if (!this.isValidPhone(this.phone)) {
      this.phoneValidationError = 'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i kh\u00f4ng h\u1ee3p l\u1ec7';
      return;
    }

    if (this.otpCountdown === 0) {
      this.generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

      alert(`Mã OTP của bạn là: ${this.generatedOtpCode}`);

      // Mark OTP as sent
      this.otpSent = true;
      this.otpCode = '';
      this.otpVerified = false;

      // Start countdown
      this.otpCountdown = 60;
      this.otpTimer = setInterval(() => {
        this.otpCountdown--;
        if (this.otpCountdown <= 0) {
          clearInterval(this.otpTimer);
          this.otpTimer = null;
        }
      }, 1000);
    }
  }

  onPhoneChange(): void {
    // Clear validation error
    this.phoneValidationError = '';
    this.otpValidationError = '';

    // Reset countdown if phone number is changed during countdown
    if (this.otpCountdown > 0) {
      clearInterval(this.otpTimer);
      this.otpTimer = null;
      this.otpCountdown = 0;
    }
    // Reset OTP sent status
    this.otpSent = false;
    this.otpVerified = false;
    this.generatedOtpCode = '';
    this.otpCode = '';
  }

  verifyOTP(): void {
    this.otpValidationError = '';

    if (!this.otpSent || !this.generatedOtpCode) {
      this.otpValidationError = 'Vui lòng gửi OTP trước khi xác nhận';
      this.otpVerified = false;
      return;
    }

    const normalizedOtp = this.otpCode.trim();
    if (!/^\d{6}$/.test(normalizedOtp)) {
      this.otpValidationError = 'Mã OTP phải gồm đúng 6 chữ số';
      this.otpVerified = false;
      return;
    }

    if (normalizedOtp !== this.generatedOtpCode) {
      this.otpValidationError = 'Mã OTP không chính xác';
      this.otpVerified = false;
      return;
    }

    this.otpVerified = true;

    // Stop and hide countdown
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
      this.otpTimer = null;
    }
    this.otpCountdown = 0;

    alert('Xác nhận OTP thành công');
  }

  getErrorMessage(fieldName: string): string {
    if (fieldName === 'email') {
      return 'Email không hợp lệ';
    }
    if (fieldName === 'phone') {
      if (this.phone.trim() === '') {
        return 'Vui lòng nhập số điện thoại';
      }
      return 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0';
    }
    if (fieldName === 'otpCode') {
      if (this.otpCode.trim() === '') {
        return 'Vui lòng nhập mã OTP';
      }
      return 'Vui lòng xác nhận OTP hợp lệ';
    }
    const fieldLabels: { [key: string]: string } = {
      fullName: 'Họ và tên',
      otpCode: 'Mã OTP',
      city: 'Tỉnh/ Thành phố',
      district: 'Quận/ Huyện',
      ward: 'Phường/ Xã',
      specificAddress: 'Địa chỉ cụ thể'
    };
    return `Vui lòng nhập ${fieldLabels[fieldName]}`;
  }

  getPaymentAmount(): number {
    const finalTotal = this.getFinalTotal();
    return this.paymentMethod === 'deposit' ? finalTotal * 0.3 : finalTotal;
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod = method;
  }

  validateForm(): boolean {
    // Đánh dấu tất cả các trường là đã chạm vào
    this.touched.fullName = true;
    this.touched.phone = true;
    this.touched.otpCode = true;
    this.touched.city = true;
    this.touched.district = true;
    this.touched.ward = true;
    this.touched.specificAddress = true;
    this.touched.email = true;

    // Kiểm tra các trường bắt buộc
    const isFullNameValid = this.fullName.trim() !== '';
    const isPhoneValid = this.phone.trim() !== '' && this.validatePhoneFormat(this.phone);
    const isOtpValid = this.otpCode.trim() !== '' && this.otpVerified;
    const isCityValid = this.selectedProvinceCode !== '';
    const isDistrictValid = this.selectedDistrictCode !== '';
    const isWardValid = this.ward !== '';
    const isAddressValid = this.specificAddress.trim() !== '';

    // Kiểm tra email nếu người dùng đã nhập
    let isEmailValid = true;
    if (this.email.trim() !== '') {
      isEmailValid = this.isValidEmail(this.email);
    }

    // Debug log
    console.log('=== VALIDATION DETAILS ===');
    console.log('Họ và tên:', this.fullName, '→', isFullNameValid);
    console.log('Số điện thoại:', this.phone, '→', isPhoneValid, '(phải 10 số, bắt đầu bằng 0)');
    console.log('Mã OTP:', this.otpCode, '→', isOtpValid);
    console.log('Tỉnh/TP:', this.selectedProvinceCode, '→', isCityValid);
    console.log('Quận/Huyện:', this.selectedDistrictCode, '→', isDistrictValid);
    console.log('Phường/Xã:', this.ward, '→', isWardValid);
    console.log('Địa chỉ cụ thể:', this.specificAddress, '→', isAddressValid);
    console.log('Email:', this.email, '→', isEmailValid);
    console.log('=========================');

    return isFullNameValid && isPhoneValid && isOtpValid && isCityValid &&
      isDistrictValid && isWardValid && isAddressValid && isEmailValid;
  }

  validatePhoneFormat(phone: string): boolean {
    // Số điện thoại Việt Nam: 10 chữ số, bắt đầu bằng 0
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone.trim());
  }

  isPhoneValid(): boolean {
    // Check if phone is valid format for enabling OTP button
    return this.validatePhoneFormat(this.phone);
  }

  async openQRPayment(): Promise<void> {
    const isValid = this.validateForm();
    console.log('Form validation result:', isValid);

    if (isValid) {
      try {
        const created = await firstValueFrom(this.orderService.createOrder({
          Tong_tien: this.getFinalTotal(),
          Hinh_thuc_thanh_toan: this.paymentMethod === 'deposit' ? 'Thanh toán cọc' : 'Thanh toán toàn bộ',
          Phi_van_chuyen: this.getShippingFee(),
          Ma_khuyen_mai: this.appliedVoucher?.Ma_khuyen_mai,
          Ghi_chu: this.note,
          Xuat_hoa_don: this.wantInvoice,
          Thong_tin_khach_vang_lai: {
            Ho_va_ten: this.fullName,
            So_dien_thoai: this.phone,
            Email: this.email,
            Tinh_thanh: this.city,
            Quan_huyen: this.district,
            Phuong_xa: this.ward,
            Dia_chi_cu_the: this.specificAddress,
          },
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

        this.createdOrderCode = orderCode;
        this.showQRModal = true;
      } catch (error) {
        console.error('Error creating order:', error);
        alert('Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
    } else {
      this.showValidationModal = true;
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

  closeValidationModal(): void {
    this.showValidationModal = false;
  }
}
