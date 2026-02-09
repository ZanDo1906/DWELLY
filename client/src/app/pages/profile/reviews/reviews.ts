import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../services/order';
import { Order_Details } from '../../../services/order_details';
import { Review } from '../../../services/review';
import { Product } from '../../../services/product';
import { iOrder } from '../../../interfaces/order';
import { iOrderDetail } from '../../../interfaces/order_details';
import { iReview } from '../../../interfaces/review';
import { iProduct } from '../../../interfaces/product';

interface OrderItemWithReview {
  order: iOrder;
  items: (iOrderDetail & { product: iProduct })[];
  review?: iReview;
  hasReview: boolean;
}

@Component({
  selector: 'app-reviews',
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
})
export class Reviews implements OnInit {
  orderWithReviews: OrderItemWithReview[] = [];
  filteredOrders: OrderItemWithReview[] = [];
  
  currentCustomerId: string = '';
  
  // Filter & Sort
  filterStatus: 'all' | 'reviewed' | 'not-reviewed' = 'all';
  sortBy: 'newest' | 'oldest' | 'high-rating' = 'newest';
  selectedRatingFilter: number = 0; // 0 means all ratings

  // Review Modal
  isReviewModalOpen = false;
  currentReviewOrder: OrderItemWithReview | null = null;
  reviewRating: number = 5;
  reviewContent: string = '';
  hoveringRating: number = 0;
  reviewImages: (string | File)[] = [];

  constructor(
    private orderService: Order,
    private orderDetailService: Order_Details,
    private reviewService: Review,
    private productService: Product
  ) {}

  ngOnInit(): void {
    this.currentCustomerId = localStorage.getItem('userId') || '';
    this.loadData();
  }

  loadData(): void {
    // Load all required data
    Promise.all([
      this.orderService.getOrderData().toPromise(),
      this.orderDetailService.getOrderDetailsData().toPromise(),
      this.reviewService.getReviewData().toPromise(),
      this.productService.getProductData().toPromise(),
    ]).then(([orders, orderDetails, reviews, products]) => {
      this.processData(orders || [], orderDetails || [], reviews || [], products || []);
    });
  }

  private processData(
    orders: iOrder[],
    orderDetails: iOrderDetail[],
    reviews: iReview[],
    products: iProduct[]
  ): void {
    // Filter orders for current customer
    const customerOrders = orders.filter(o => o.Ma_khach_hang === this.currentCustomerId);

    this.orderWithReviews = customerOrders.map(order => {
      // Get order details for this order
      const items = orderDetails
        .filter(od => od.Ma_don_mua === order.Ma_don_mua)
        .map(od => {
          const product = products.find(p => p.Ma_san_pham === od.Ma_san_pham);
          return {
            ...od,
            product: product || ({} as iProduct),
          };
        });

      // Get review for this order (first product's review)
      let review: iReview | undefined;
      if (items.length > 0) {
        review = reviews.find(
          r => r.Ma_khach_hang === this.currentCustomerId &&
               r.Ma_san_pham === items[0].Ma_san_pham
        );
      }

      return {
        order,
        items,
        review,
        hasReview: !!review,
      };
    });

    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.orderWithReviews];

    // Filter by review status
    if (this.filterStatus === 'reviewed') {
      filtered = filtered.filter(o => o.hasReview);
    } else if (this.filterStatus === 'not-reviewed') {
      filtered = filtered.filter(o => !o.hasReview);
    }

    // Filter by rating
    if (this.selectedRatingFilter > 0) {
      filtered = filtered.filter(o => o.review?.Diem_danh_gia === this.selectedRatingFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.order.Ngay_dat).getTime() - new Date(a.order.Ngay_dat).getTime();
        case 'oldest':
          return new Date(a.order.Ngay_dat).getTime() - new Date(b.order.Ngay_dat).getTime();
        case 'high-rating':
          const ratingA = a.review?.Diem_danh_gia || 0;
          const ratingB = b.review?.Diem_danh_gia || 0;
          return ratingB - ratingA;
        default:
          return 0;
      }
    });

    this.filteredOrders = filtered;
  }

  setFilterStatus(status: 'all' | 'reviewed' | 'not-reviewed'): void {
    this.filterStatus = status;
    this.applyFiltersAndSort();
  }

  setSortBy(sort: 'newest' | 'oldest' | 'high-rating'): void {
    this.sortBy = sort;
    this.applyFiltersAndSort();
  }

  toggleRatingFilter(rating: number): void {
    this.selectedRatingFilter = this.selectedRatingFilter === rating ? 0 : rating;
    this.applyFiltersAndSort();
  }

  openReviewModal(order: OrderItemWithReview): void {
    this.currentReviewOrder = order;
    this.reviewRating = 5;
    this.reviewContent = '';
    this.isReviewModalOpen = true;
  }

  closeReviewModal(): void {
    this.isReviewModalOpen = false;
    this.currentReviewOrder = null;
    this.reviewRating = 5;
    this.reviewContent = '';
    this.reviewImages = [];
  }

  setReviewRating(rating: number): void {
    this.reviewRating = rating;
  }

  limitReviewContent(): void {
    if (this.reviewContent.length > 500) {
      this.reviewContent = this.reviewContent.substring(0, 500);
    }
  }

  onImageSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.reviewImages[index] = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.reviewImages[index] = '';
  }

  submitReview(): void {
    if (!this.currentReviewOrder || !this.reviewContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    // TODO: Submit review to API
    console.log('Submit review:', {
      orderId: this.currentReviewOrder.order.Ma_don_mua,
      customerId: this.currentCustomerId,
      rating: this.reviewRating,
      content: this.reviewContent,
    });

    this.closeReviewModal();
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getOrderDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  getTotalPrice(items: iOrderDetail[]): number {
    return items.reduce((sum, item) => sum + (item.Don_gia * item.So_luong), 0);
  }

  get notReviewedCount(): number {
    return this.orderWithReviews.filter(o => !o.hasReview).length;
  }

  get reviewedCount(): number {
    return this.orderWithReviews.filter(o => o.hasReview).length;
  }
}
