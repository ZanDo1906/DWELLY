import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../services/product';
import { iProduct } from '../../interfaces/product';
import { Room } from '../../services/room';
import { iRoom } from '../../interfaces/room';
import { Voucher } from '../../services/voucher';
import { iVoucher } from '../../interfaces/voucher';
import { QRPayment } from '../qr-payment/qr-payment';

@Component({
  selector: 'app-payment-non-member',
  imports: [CommonModule, FormsModule, QRPayment],
  templateUrl: './payment-non-member.html',
  styleUrl: './payment-non-member.css',
})
export class PaymentNonMember implements OnInit {
  products: iProduct[] = [];
  rooms: iRoom[] = [];
  cartItems: any[] = [];
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

  // OTP countdown
  otpCountdown: number = 0;
  otpTimer: any = null;
  otpSent: boolean = false;
  otpVerified: boolean = false;

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

  constructor(
    private productService: Product,
    private roomService: Room,
    private voucherService: Voucher,
    private http: HttpClient
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

    // Load provinces
    this.loadProvinces();

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
    const selectedProvince = this.provinces.find(p => p.code === this.selectedProvinceCode);
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
    const selectedDistrict = this.districts.find(d => d.code === this.selectedDistrictCode);
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

    if (this.phone.trim() === '') {
      this.phoneValidationError = 'Vui l\u00f2ng nh\u1eadp s\u1ed1 \u0111i\u1ec7n tho\u1ea1i';
      return;
    }

    if (!this.isValidPhone(this.phone)) {
      this.phoneValidationError = 'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i kh\u00f4ng h\u1ee3p l\u1ec7';
      return;
    }

    if (this.otpCountdown === 0) {
      console.log('Sending OTP to:', this.phone);

      // Mark OTP as sent
      this.otpSent = true;

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

    // Reset countdown if phone number is changed during countdown
    if (this.otpCountdown > 0) {
      clearInterval(this.otpTimer);
      this.otpTimer = null;
      this.otpCountdown = 0;
    }
    // Reset OTP sent status
    this.otpSent = false;
    this.otpVerified = false;
  }

  verifyOTP(): void {
    if (this.otpCode.trim() !== '' && !this.otpVerified) {
      // Logic to verify OTP
      console.log('Verifying OTP:', this.otpCode);
      // Mark as verified
      this.otpVerified = true;
      // Stop and hide countdown
      if (this.otpTimer) {
        clearInterval(this.otpTimer);
        this.otpTimer = null;
      }
      this.otpCountdown = 0;
    }
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
    const isOtpValid = this.otpCode.trim() !== '';
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

  openQRPayment(): void {
    const isValid = this.validateForm();
    console.log('Form validation result:', isValid);

    if (isValid) {
      this.showQRModal = true;
    } else {
      this.showValidationModal = true;
    }
  }

  closeQRPayment(): void {
    this.showQRModal = false;
  }

  closeValidationModal(): void {
    this.showValidationModal = false;
  }
}
