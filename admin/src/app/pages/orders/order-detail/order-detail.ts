import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail implements OnInit {
  rooms: Room[] = [];
  cartItems: CartItem[] = [];
  private products: Product[] = [];
  showStatusDropdown = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    Promise.all([
      this.http.get<Room[]>('assets/data/room.json').toPromise(),
      this.http.get<Product[]>('assets/data/product.json').toPromise(),
      this.http
        .get<Array<{ Ma_don_mua: string; Ma_san_pham: string; Don_gia: number; So_luong: number }>>(
          'assets/data/order_details.json'
        )
        .toPromise(),
    ]).then(([rooms, products, orderDetails]) => {
      this.rooms = rooms || [];
      this.products = products || [];

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
