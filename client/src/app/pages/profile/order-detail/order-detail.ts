import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Order } from '../../../services/order';
import { Client} from '../../../services/client';
import { Order_Details } from '../../../services/order_details';
import { Product } from '../../../services/product';
import { Voucher } from '../../../services/voucher';
import { Router, ActivatedRoute } from '@angular/router';
import { iOrder } from '../../../interfaces/order';
import { iClient } from '../../../interfaces/client';
import { iVoucher } from '../../../interfaces/voucher';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail implements OnInit {
  orderId: string = '';
  orderInfo: any = null;
  userInfo: any = null;
  userId: string = '';
  orderDetails: any[] = [];
  productInfo: any = null;
  appliedVoucher: iVoucher | null = null;
  customerName = 'Khách hàng';
  customerPhone = 'Chưa có';
  customerAddress = 'Chưa có';
  
  constructor(
    private route: ActivatedRoute,
    private orderService: Order,
    private router: Router,
    private clientService: Client,
    private orderDetailsService: Order_Details,
    private productService: Product,
    private voucherService: Voucher
  ) {}

  ngOnInit(): void {
    const idFromUrl = this.route.snapshot.paramMap.get('id');
    if (idFromUrl) {
      this.orderId = idFromUrl;
      localStorage.setItem('orderId', idFromUrl);
    } else {
      this.orderId = localStorage.getItem('orderId') || '';
    }

    if (this.orderId) {
      this.loadOrderInfo();
    }
  }

  loadOrderInfo(): void {
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (data) => {
        this.orderInfo = {
          ...data,
          Trang_thai: this.normalizeOrderStatus((data as iOrder).Trang_thai),
        };
        console.log('Order info:', this.orderInfo);

        this.resolveCustomerInfo(this.orderInfo as iOrder, undefined);
        
        // Load customer info after order is loaded
        if (this.orderInfo.Ma_khach_hang) {
          this.loadUserInfo(this.orderInfo.Ma_khach_hang);
        }
        
        // Load order details by Ma_don_mua
        if (this.orderInfo.Ma_don_mua) {
          this.loadOrderDetails(this.orderInfo.Ma_don_mua);
        }

        this.loadVoucherInfo();
      },
      error: (err) => {
        console.error('Error loading order info:', err);
      }
    });
  }

    loadUserInfo(userID: string): void {
    this.clientService.getClientById(userID).subscribe({
      next: (data) => {
        this.userInfo = data;
          if (this.orderInfo) {
            this.resolveCustomerInfo(this.orderInfo as iOrder, this.userInfo as iClient);
          }
      },
      error: (err) => {
        console.error('Error loading user info:', err);
      }
    });
  }

  loadOrderDetails(orderId: string): void {
    this.orderDetailsService.getOrderDetailsByOrderId(orderId).subscribe({
      next: (data) => {
        this.orderDetails = data;
        console.log('Order details:', this.orderDetails);
        
        // Load product info for each order detail
        this.loadProductsForOrderDetails();
      },
      error: (err) => {
        console.error('Error loading order details:', err);
      }
    });
  }

  loadProductsForOrderDetails(): void {
    if (this.orderDetails.length === 0) return;

    console.log('Product IDs:', this.orderDetails.map(d => d.Ma_san_pham));

    // Fetch all products at once
    this.productService.getProductData().subscribe({
      next: (allProducts) => {
        // console.log('All products loaded:', allProducts.length);
        // Create a map of product ID to product info
        const productMap = new Map();
        allProducts.forEach((product: any) => {
          productMap.set(product.Ma_san_pham, product);
        });
        
        // Attach product info to each order detail
        this.orderDetails = this.orderDetails.map(detail => {
          const productInfo = productMap.get(detail.Ma_san_pham);
          console.log(`Mapping product ${detail.Ma_san_pham}:`, productInfo ? 'Found' : 'NOT FOUND');
          return {
            ...detail,
            productInfo: productInfo
          };
        });
        
        console.log('Order details with products:', this.orderDetails);
        
        // Log each product info
        this.orderDetails.forEach((detail, index) => {
          console.log(`Product ${index + 1} (${detail.Ma_san_pham}) info:`, detail.productInfo);
        });
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }

  getProductImage(productInfo: any): string {
    if (!productInfo) return 'https://via.placeholder.com/64';
    const firstImage = productInfo.Hinh_anh?.[0] || '';
    return firstImage ? this.productService.getImgUrl(firstImage) : 'https://via.placeholder.com/64';
  }

  getTotalProducts(): number {
    return this.orderDetails.reduce((sum, item) => sum + item.So_luong, 0);
  }

  private resolveCustomerInfo(order: iOrder, client?: iClient): void {
    const shippingInfo = order.Thong_tin_giao_hang;
    const guestInfo = order.Thong_tin_khach_vang_lai;
    const isGuestOrder = !order.Ma_khach_hang;

    const shippingName = (shippingInfo?.Ho_ten_nguoi_nhan || '').trim();
    const shippingPhone = (shippingInfo?.So_dien_thoai_nguoi_nhan || '').trim();

    const guestName = (guestInfo?.Ho_va_ten || '').trim();
    const guestPhone = (guestInfo?.So_dien_thoai || '').trim();

    const shippingAddress = this.composeAddressFrom4Parts(
      shippingInfo?.Dia_chi_cu_the,
      shippingInfo?.Phuong_xa,
      shippingInfo?.Quan_huyen,
      shippingInfo?.Tinh_thanh,
    );

    const guestAddress = this.composeAddressFrom4Parts(
      guestInfo?.Dia_chi_cu_the,
      guestInfo?.Phuong_xa,
      guestInfo?.Quan_huyen,
      guestInfo?.Tinh_thanh,
    );

    const clientAddress = this.resolveAddress(client?.Dia_chi);
    const finalAddress = this.resolveAddress(
      shippingAddress,
      guestAddress,
      order.Dia_chi,
      clientAddress,
    );

    if (isGuestOrder && (guestName || guestPhone || finalAddress)) {
      this.customerName = guestName || shippingName || 'Khách hàng';
      this.customerPhone = guestPhone || shippingPhone || 'Chưa có';
      this.customerAddress = finalAddress || 'Chưa có';
      return;
    }

    if (shippingName || shippingPhone || finalAddress) {
      this.customerName = shippingName || client?.Ho_va_ten || 'Khách hàng';
      this.customerPhone = shippingPhone || client?.So_dien_thoai || 'Chưa có';
      this.customerAddress = finalAddress || 'Chưa có';
      return;
    }

    if (client) {
      this.customerName = client.Ho_va_ten || 'Khách hàng';
      this.customerPhone = client.So_dien_thoai || 'Chưa có';
      this.customerAddress = finalAddress || 'Chưa có';
      return;
    }

    this.customerName = guestName || 'Khách hàng';
    this.customerPhone = guestPhone || 'Chưa có';
    this.customerAddress = finalAddress || 'Chưa có';
  }

  private composeAddressFrom4Parts(
    detail?: string,
    ward?: string,
    district?: string,
    province?: string,
  ): string {
    return [detail, ward, district, province]
      .map((part) => (part || '').trim())
      .filter((part) => part.length > 0)
      .join(', ');
  }

  private resolveAddress(...candidates: unknown[]): string {
    for (const candidate of candidates) {
      const resolved = this.stringifyAddress(candidate);
      if (resolved) {
        return resolved;
      }
    }
    return '';
  }

  private stringifyAddress(value: unknown): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const resolved = this.stringifyAddress(item);
        if (resolved) {
          return resolved;
        }
      }
      return '';
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const direct =
        this.stringifyAddress(record['Dia_chi']) ||
        this.stringifyAddress(record['Dia_chi_cu_the']) ||
        this.stringifyAddress(record['DetailAddress']) ||
        this.stringifyAddress(record['address']);

      if (direct) {
        return direct;
      }

      const composed = [
        this.stringifyAddress(record['DetailAddress']),
        this.stringifyAddress(record['Ward']),
        this.stringifyAddress(record['District']),
        this.stringifyAddress(record['Province']),
      ].filter(Boolean);

      if (composed.length > 0) {
        return composed.join(', ');
      }
    }

    return '';
  }

  getShippingFee(): number {
    return Number(this.orderInfo?.Phi_giao_hang ?? this.orderInfo?.Phi_van_chuyen ?? 0);
  }

  getVoucherDisplayCode(): string {
    if (this.appliedVoucher?.Ma_so) {
      return this.appliedVoucher.Ma_so;
    }

    return this.orderInfo?.Ma_khuyen_mai ? String(this.orderInfo.Ma_khuyen_mai) : 'Không áp dụng';
  }

  getVoucherDiscountAmount(): number {
    if (!this.orderInfo?.Tong_tien || !this.appliedVoucher?.Phan_tram_giam) {
      return 0;
    }

    const subtotal = Number(this.orderInfo.Tong_tien || 0);
    return (subtotal * this.appliedVoucher.Phan_tram_giam) / 100;
  }

  getGrandTotal(): number {
    const subtotal = Number(this.orderInfo?.Tong_tien || 0);
    return subtotal + this.getShippingFee() - this.getVoucherDiscountAmount();
  }

  private loadVoucherInfo(): void {
    if (!this.orderInfo?.Ma_khuyen_mai) {
      this.appliedVoucher = null;
      return;
    }

    this.voucherService.getVoucherData().subscribe({
      next: (vouchers) => {
        this.appliedVoucher = vouchers.find((voucher) =>
          voucher.Ma_khuyen_mai === this.orderInfo.Ma_khuyen_mai ||
          voucher.Ma_so === this.orderInfo.Ma_khuyen_mai
        ) || null;
      },
      error: (err) => {
        console.error('Error loading voucher info:', err);
        this.appliedVoucher = null;
      }
    });
  }

  confirmReceived(): void {
    if (!this.orderInfo) return;

    if (this.orderInfo.Trang_thai !== 'Đã giao') {
      alert('Đơn hàng chưa ở trạng thái Đã giao để xác nhận nhận hàng.');
      return;
    }

    if (confirm('Xác nhận bạn đã nhận được hàng?')) {
      this.orderService.updateOrderStatus(this.orderId, 'Hoàn thành').subscribe({
        next: (response) => {
          alert('Cảm ơn bạn đã xác nhận! Đơn hàng đã hoàn thành.');
          this.loadOrderInfo(); // Reload to show updated status
        },
        error: (err) => {
          console.error('Error updating order status:', err);
          alert('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng.');
        }
      });
    }
  }

  private normalizeOrderStatus(status: string): string {
    if (status === 'Đã duyệt') {
      return 'Chờ giao hàng';
    }

    if (status === 'Hủy đơn' || status === 'Bị hủy' || status === 'Trả hàng') {
      return 'Đã hủy';
    }

    return status;
  }
}
