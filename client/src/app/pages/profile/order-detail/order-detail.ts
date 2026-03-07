import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Order } from '../../../services/order';
import { Client} from '../../../services/client';
import { Order_Details } from '../../../services/order_details';
import { Product } from '../../../services/product';
import { Router } from '@angular/router';
import { iOrder } from '../../../interfaces/order';
import { iClient } from '../../../interfaces/client';

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
  customerName = 'Khách hàng';
  customerPhone = 'Chưa có';
  customerAddress = 'Chưa có';
  
  constructor(
    private orderService: Order,
    private router: Router,
    private clientService: Client,
    private orderDetailsService: Order_Details,
    private productService: Product
  ) {}

  ngOnInit(): void {
    this.orderId = localStorage.getItem('orderId') || '';
    if (this.orderId) {
      this.loadOrderInfo();
    }
  }

  loadOrderInfo(): void {
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (data) => {
        this.orderInfo = data;
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

  confirmReceived(): void {
    if (!this.orderInfo) return;

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
}
