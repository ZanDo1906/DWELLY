import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Modal } from '../../../components/modal/modal';
import { ReviewModa } from '../reviews/review-moda/review-moda';
import { Order as OrderService } from '../../../services/order';
import { iOrder } from '../../../interfaces/order';
import { Product } from '../../../services/product';
import { Category } from '../../../services/category';
import { iOrderDetail } from '../../../interfaces/order_details';
import { iProduct } from '../../../interfaces/product';
import { iCategory } from '../../../interfaces/category';
import { forkJoin } from 'rxjs';

type OrderWithDetails = iOrder & { details?: iOrderDetail[] };

interface OrderProductView {
  detail: iOrderDetail;
  product?: iProduct;
  categoryName: string;
  lineTotal: number;
}

interface OrderView {
  order: iOrder;
  items: OrderProductView[];
  totalItems: number;
}

@Component({
  selector: 'app-orders',
  imports: [CommonModule, Modal, ReviewModa],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  orders: OrderView[] = [];
  currentCustomerId: string = '';
  isLoading = false;
  errorMessage = '';

  currentReviewOrder: any = null;
  currentProduct: any = null;
  reviewRating = 5;
  hoveringRating = 0;
  reviewImages: (string | File)[] = [];
  reviewContent = '';

  constructor(
    private orderService: OrderService,
    private productService: Product,
    private categoryService: Category
  ) {}

  ngOnInit(): void {
    this.currentCustomerId = localStorage.getItem('userId') || '';
    this.getOrderData();
  }

  getOrderData(): void {
    if (!this.currentCustomerId) {
      this.orders = [];
      this.errorMessage = 'Bạn chưa đăng nhập.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      orders: this.orderService.getOrderDataByUserId(this.currentCustomerId),
      products: this.productService.getProductData(),
      categories: this.categoryService.getCategoryData(),
    }).subscribe({
      next: ({ orders, products, categories }) => {
        this.orders = this.mapOrdersForCurrentCustomer(
          orders as OrderWithDetails[],
          products,
          categories
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.message || 'Không thể tải danh sách đơn hàng.';
      },
    });
  }

  private mapOrdersForCurrentCustomer(
    orders: OrderWithDetails[],
    products: iProduct[],
    categories: iCategory[]
  ): OrderView[] {
    const productMap = new Map(products.map((product) => [product.Ma_san_pham, product]));
    const categoryMap = new Map(categories.map((category) => [category.Ma_danh_muc, category.Ten_danh_muc]));

    return orders.map((order) => {
      const items = (order.details || [])
        .map((detail) => {
          const product = productMap.get(detail.Ma_san_pham);
          const categoryName = product ? categoryMap.get(product.Ma_danh_muc) || 'Không rõ' : 'Không rõ';

          return {
            detail,
            product,
            categoryName,
            lineTotal: detail.Don_gia * detail.So_luong,
          };
        });

      return {
        order,
        items,
        totalItems: items.reduce((sum, item) => sum + item.detail.So_luong, 0),
      };
    });
  }

  trackByOrderId(_: number, orderView: OrderView): string {
    return orderView.order.Ma_don_mua;
  }

  trackByOrderItem(_: number, item: OrderProductView): string {
    return item.detail.Ma_chi_tiet;
  }

  setReviewRating(rating: number): void {
    this.reviewRating = rating;
  }

  setHoveringRating(value: number): void {
    this.hoveringRating = value;
  }

  onReviewContentChange(value: string): void {
    this.reviewContent = value;
    if (this.reviewContent.length > 500) {
      this.reviewContent = this.reviewContent.substring(0, 500);
    }
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        this.reviewImages[index] = result;
      }
    };
    reader.readAsDataURL(file);
  }

  removeImage(index: number): void {
    this.reviewImages[index] = '';
  }

  submitReview(): void {
    if (!this.reviewContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    console.log('Submit review:', {
      rating: this.reviewRating,
      content: this.reviewContent,
    });

    this.closeReviewModal();
  }

  closeReviewModal(): void {
    const modalEl = document.getElementById('reviewModal');
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    this.reviewRating = 5;
    this.hoveringRating = 0;
    this.reviewImages = [];
    this.reviewContent = '';
    this.currentReviewOrder = null;
  }
}
