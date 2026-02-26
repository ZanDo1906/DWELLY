import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HostListener } from '@angular/core';

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

@Component({
  selector: 'app-add-order',
  imports: [CommonModule, FormsModule],
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
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
