import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';
import { Order as OrderService } from '../../../services/order';
import { Order_Details as OrderDetailsService } from '../../../services/order_details';
import { forkJoin } from 'rxjs';

interface Room {
  Ma_loai_phong: string;
  Ten_loai_phong: string;
  Mo_ta: string;
}

interface Product {
  Ma_san_pham: string;
  Ten_san_pham: string;
  Gia_ban: number;
  Mo_ta: string;
  Kich_thuoc: string;
  Chat_lieu: string;
  Hinh_anh: string[];
  So_luong_ton_kho: number;
  Ma_loai_phong: string;
  Ma_phong_cach: string;
  Ma_danh_muc: string;
  Ma_khong_gian: string;
  Trang_thai: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Voucher {
  Ma_so: string;
  Phan_tram_giam: number;
  So_luong_con_lai: number;
  Ngay_bat_dau: string;
  Ngay_het_han: string;
  Trang_thai: boolean;
}

interface WardUnit {
  code: number;
  name: string;
}

interface DistrictUnit {
  code: number;
  name: string;
  wards: WardUnit[];
}

interface ProvinceUnit {
  code: number;
  name: string;
  districts: DistrictUnit[];
}

@Component({
  selector: 'app-add-order',
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './add-order.html',
  styleUrl: './add-order.css',
})
export class AddOrder implements OnInit {
  rooms: Room[] = [];
  cartItems: CartItem[] = [];
  searchTerm = '';
  searchResults: Product[] = [];
  voucherCode = '';
  voucherError = '';
  appliedVoucher: Voucher | null = null;
  shippingMethod: 'standard' | 'fast' = 'standard';
  private products: Product[] = [];
  private vouchers: Voucher[] = [];
  showStatusDropdown = false;
  paymentMode: 'deposit' | 'full' = 'deposit';
  isLoadingLocations = false;
  provinces: ProvinceUnit[] = [];
  districts: DistrictUnit[] = [];
  wards: WardUnit[] = [];
  selectedProvinceCode = '';
  selectedDistrictCode = '';
  selectedWardCode = '';
  customerName = '';
  customerPhone = '';
  customerEmail = '';
  shippingDetailAddress = '';
  orderNote = '';
  showCreateConfirm = false;
  isSavingOrder = false;

  constructor(
    private http: HttpClient,
    private orderService: OrderService,
    private orderDetailsService: OrderDetailsService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadAdministrativeData();
  }

  private loadAdministrativeData(): void {
    this.isLoadingLocations = true;

    this.http.get<ProvinceUnit[]>('https://provinces.open-api.vn/api/?depth=3').subscribe({
      next: (response) => {
        this.provinces = [...response].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        this.isLoadingLocations = false;
      },
      error: (err) => {
        console.error('Error loading administrative data:', err);
        this.provinces = [];
        this.districts = [];
        this.wards = [];
        this.isLoadingLocations = false;
      }
    });
  }

  onProvinceChange(): void {
    const selectedProvince = this.provinces.find(
      (item) => String(item.code) === String(this.selectedProvinceCode)
    );

    this.districts = selectedProvince?.districts || [];
    this.selectedDistrictCode = '';
    this.selectedWardCode = '';
    this.wards = [];
  }

  onDistrictChange(): void {
    const selectedDistrict = this.districts.find(
      (item) => String(item.code) === String(this.selectedDistrictCode)
    );

    this.wards = selectedDistrict?.wards || [];
    this.selectedWardCode = '';
  }

  private loadData(): void {
    Promise.all([
      this.http.get<Room[]>('assets/data/room.json').toPromise(),
      this.http.get<Product[]>('assets/data/product.json').toPromise(),
      this.http.get<Voucher[]>('assets/data/voucher.json').toPromise(),
      this.http
        .get<Array<{ Ma_don_mua: string; Ma_san_pham: string; Don_gia: number; So_luong: number }>>(
          'assets/data/order_details.json'
        )
        .toPromise(),
    ]).then(([rooms, products, vouchers, orderDetails]) => {
      this.rooms = rooms || [];
      this.products = products || [];
      this.vouchers = vouchers || [];

      // Hiện tại load chi tiết đơn hàng đầu tiên (ORD001)
      const orderId = 'ORD001';
      const detailsForOrder = orderDetails?.filter((d) => d.Ma_don_mua === orderId) || [];

      this.cartItems = detailsForOrder.map((detail) => {
        const product = this.products.find((p) => p.Ma_san_pham === detail.Ma_san_pham);
        return {
          product: product || this.createEmptyProduct(detail.Ma_san_pham),
          quantity: detail.So_luong,
        };
      });
    });
  }

  private createEmptyProduct(maSanPham: string): Product {
    return {
      Ma_san_pham: maSanPham,
      Ten_san_pham: 'Sản phẩm không xác định',
      Gia_ban: 0,
      Mo_ta: '',
      Kich_thuoc: '',
      Chat_lieu: '',
      Hinh_anh: [],
      So_luong_ton_kho: 0,
      Ma_loai_phong: '',
      Ma_phong_cach: '',
      Ma_danh_muc: '',
      Ma_khong_gian: '',
      Trang_thai: false,
    };
  }

  getRoomName(Ma_loai_phong: string): string {
    const room = this.rooms.find((r) => r.Ma_loai_phong === Ma_loai_phong);
    return room ? room.Ten_loai_phong : 'Không xác định';
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchTerm = input?.value ?? '';
    
    // Filter products by name or SKU
    if (this.searchTerm.trim() === '') {
      this.searchResults = [];
    } else {
      const keyword = this.searchTerm.toLowerCase().trim();
      this.searchResults = this.products.filter(
        (p) =>
          p.Ten_san_pham.toLowerCase().includes(keyword) ||
          p.Ma_san_pham.toLowerCase().includes(keyword)
      );
    }
  }

  addProductToCart(product: Product): void {
    // Check if product already in cart
    const existingItem = this.cartItems.find((item) => item.product.Ma_san_pham === product.Ma_san_pham);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cartItems.push({ product, quantity: 1 });
    }
    
    // Clear search
    this.searchTerm = '';
    this.searchResults = [];
  }

  removeProductFromCart(index: number): void {
    if (index >= 0 && index < this.cartItems.length) {
      this.cartItems.splice(index, 1);
    }
  }

  setShippingMethod(method: 'standard' | 'fast'): void {
    this.shippingMethod = method;
  }

  increaseQty(index: number): void {
    if (index >= 0 && index < this.cartItems.length) {
      this.cartItems[index].quantity += 1;
    }
  }

  decreaseQty(index: number): void {
    if (index >= 0 && index < this.cartItems.length && this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity -= 1;
    }
  }

  applyVoucher(): void {
    const code = this.voucherCode.trim().toUpperCase();
    this.voucherError = '';
    this.appliedVoucher = null;

    if (!code) {
      this.voucherError = 'Vui lòng nhập mã khuyến mãi';
      return;
    }

    const today = new Date();
    const matchedVoucher = this.vouchers.find((voucher) => {
      const startsAt = new Date(voucher.Ngay_bat_dau);
      const endsAt = new Date(voucher.Ngay_het_han);
      return (
        voucher.Ma_so.toUpperCase() === code &&
        voucher.Trang_thai &&
        voucher.So_luong_con_lai > 0 &&
        startsAt <= today &&
        today <= endsAt
      );
    });

    if (!matchedVoucher) {
      this.voucherError = 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn';
      return;
    }

    this.appliedVoucher = matchedVoucher;
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => {
      const price = Number(item.product?.Gia_ban || 0);
      const qty = Number(item.quantity || 0);
      return sum + price * qty;
    }, 0);
  }

  getShippingFee(): number {
    return this.shippingMethod === 'fast' ? 100000 : 0;
  }

  getDiscountPercent(): number {
    return Number(this.appliedVoucher?.Phan_tram_giam || 0);
  }

  getDiscountAmount(): number {
    const subtotal = this.getSubtotal();
    const percent = this.getDiscountPercent();
    return Math.round((subtotal * percent) / 100);
  }

  getGrandTotal(): number {
    const total = this.getSubtotal() + this.getShippingFee() - this.getDiscountAmount();
    return Math.max(0, Math.round(total));
  }

  getDepositAmount(): number {
    return Math.round(this.getGrandTotal() * 0.3);
  }

  getTotalProducts(): number {
    return this.cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  canCreateOrder(): boolean {
    const hasProducts = this.cartItems.length > 0;
    const hasName = this.customerName.trim().length >= 2;
    const hasValidPhone = this.isValidPhone(this.customerPhone);
    const hasValidEmail = this.isValidEmail(this.customerEmail);
    const hasFullAddress =
      this.selectedProvinceCode !== '' &&
      this.selectedDistrictCode !== '' &&
      this.selectedWardCode !== '' &&
      this.shippingDetailAddress.trim().length > 0;

    return hasProducts && hasName && hasValidPhone && hasValidEmail && hasFullAddress;
  }

  openCreateConfirm(): void {
    if (!this.canCreateOrder()) {
      alert('Vui lòng chọn sản phẩm và nhập đầy đủ thông tin giao hàng hợp lệ trước khi tạo đơn hàng.');
      return;
    }

    this.showCreateConfirm = true;
  }

  closeCreateConfirm(): void {
    this.showCreateConfirm = false;
  }

  onConfirmCreateOrder(): void {
    if (!this.canCreateOrder() || this.isSavingOrder) {
      this.showCreateConfirm = false;
      return;
    }

    this.isSavingOrder = true;

    const provinceName = this.provinces.find(
      (item) => String(item.code) === String(this.selectedProvinceCode)
    )?.name || '';
    const districtName = this.districts.find(
      (item) => String(item.code) === String(this.selectedDistrictCode)
    )?.name || '';
    const wardName = this.wards.find(
      (item) => String(item.code) === String(this.selectedWardCode)
    )?.name || '';

    const orderPayload = {
      Ma_khach_hang: undefined,
      Thong_tin_giao_hang: undefined,
      Thong_tin_khach_vang_lai: {
        Ho_va_ten: this.customerName.trim(),
        So_dien_thoai: this.customerPhone.trim(),
        Email: this.customerEmail.trim(),
        Tinh_thanh: provinceName,
        Quan_huyen: districtName,
        Phuong_xa: wardName,
        Dia_chi_cu_the: this.shippingDetailAddress.trim(),
      },
      Tong_tien: this.getGrandTotal(),
      Hinh_thuc_thanh_toan: this.paymentMode === 'deposit' ? 'Đặt cọc' : 'Thanh toán toàn bộ',
      Trang_thai: 'Chờ duyệt',
      Ma_khuyen_mai: this.appliedVoucher?.Ma_so || undefined,
      Phi_van_chuyen: this.getShippingFee(),
      Ghi_chu: this.orderNote.trim(),
      Ngay_dat: new Date(),
    };

    this.orderService.createOrder(orderPayload).subscribe({
      next: (orderResponse) => {
        const orderCode = orderResponse?.order?.Ma_don_mua;
        if (!orderCode) {
          this.isSavingOrder = false;
          this.showCreateConfirm = false;
          alert('Không nhận được mã đơn hàng sau khi tạo.');
          return;
        }

        const detailPayload = this.cartItems
          .filter((item) => item.product?.Ma_san_pham && Number(item.quantity || 0) > 0)
          .map((item) => ({
          Ma_san_pham: item.product.Ma_san_pham,
          Don_gia: Number(item.product.Gia_ban || 0),
          So_luong: Number(item.quantity || 0),
        }));

        if (detailPayload.length === 0) {
          this.isSavingOrder = false;
          this.showCreateConfirm = false;
          alert('Đơn hàng đã tạo nhưng chưa có sản phẩm hợp lệ để lưu chi tiết đơn hàng.');
          return;
        }

        this.orderDetailsService.createOrderDetailsBulk(orderCode, detailPayload).subscribe({
          next: () => {
            this.isSavingOrder = false;
            this.showCreateConfirm = false;
            alert(`Tạo đơn hàng ${orderCode} thành công.`);
          },
          error: () => {
            const fallbackRequests = detailPayload.map((detail) =>
              this.orderDetailsService.createOrderDetail({
                Ma_don_mua: orderCode,
                Ma_san_pham: detail.Ma_san_pham,
                Don_gia: detail.Don_gia,
                So_luong: detail.So_luong,
              })
            );

            forkJoin(fallbackRequests).subscribe({
              next: () => {
                this.isSavingOrder = false;
                this.showCreateConfirm = false;
                alert(`Tạo đơn hàng ${orderCode} thành công.`);
              },
              error: (fallbackErr) => {
                this.isSavingOrder = false;
                this.showCreateConfirm = false;
                alert(fallbackErr?.error?.message || fallbackErr?.message || 'Tạo chi tiết đơn hàng thất bại');
              }
            });
          }
        });
      },
      error: (err) => {
        this.isSavingOrder = false;
        this.showCreateConfirm = false;
        alert(err?.error?.message || err?.message || 'Tạo đơn hàng thất bại');
      }
    });
  }

  private isValidPhone(value: string): boolean {
    const phone = String(value || '').trim().replace(/\s+/g, '');
    return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone);
  }

  private isValidEmail(value: string): boolean {
    const email = String(value || '').trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdownWrapper = target.closest('.dropdown-wrapper');
    if (!dropdownWrapper) {
      this.showStatusDropdown = false;
    }
  }
}
