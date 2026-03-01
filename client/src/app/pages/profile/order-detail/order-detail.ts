import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Modal } from '../../../components/modal/modal';
import { Order } from '../../../services/order';
import { Client} from '../../../services/client';
import { Order_Details } from '../../../services/order_details';
import { Product } from '../../../services/product';
import { Orders } from '../orders/orders';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

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
