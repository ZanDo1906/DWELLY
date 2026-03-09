import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Modal } from '../../../components/modal/modal';
import { ReviewModa } from './review-moda/review-moda';
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
  hasReview: boolean;
  canReview: boolean; // Order completed and within 7 days
}

@Component({
  selector: 'app-reviews',
  imports: [CommonModule, FormsModule, Modal, ReviewModa],
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
  currentReviewOrder: OrderItemWithReview | null = null;
  currentSelectedProduct: (iOrderDetail & { product: iProduct }) | null = null;
  reviewedProductIds: Set<string> = new Set(); // Track reviewed products
  modalView: 'list' | 'form' = 'list'; // Which view to show in modal
  
  reviewRating: number = 5;
  reviewContent: string = '';
  hoveringRating: number = 0;
  reviewImages: (string | File)[] = [];
  isSubmittingReview: boolean = false;

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

      // Check if ALL products in the order have been reviewed
      const hasReview = items.length > 0 && items.every(item =>
        reviews.some(r => r.Ma_don_mua === order.Ma_don_mua && r.Ma_san_pham === item.Ma_san_pham)
      );

      // Check if order can be reviewed: status is "Hoàn thành" and within 7 days
      const canReview = this.isOrderEligibleForReview(order);

      return {
        order,
        items,
        hasReview,
        canReview,
      };
    });

    this.applyFiltersAndSort();
  }

  private isOrderEligibleForReview(order: iOrder): boolean {
    // Check if order status is "Hoàn thành" (Completed)
    if (order.Trang_thai !== 'Hoàn thành') {
      return false;
    }

    // Check if order is within 7 days
    const orderDate = new Date(order.Ngay_dat);
    const today = new Date();
    const diffTime = today.getTime() - orderDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays <= 7;
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.orderWithReviews];

    // Filter by review status
    if (this.filterStatus === 'reviewed') {
      filtered = filtered.filter(o => o.hasReview);
    } else if (this.filterStatus === 'not-reviewed') {
      filtered = filtered.filter(o => !o.hasReview);
    }

    // Filter by rating - Not applicable for this view since we show all products
    if (this.selectedRatingFilter > 0) {
      // Can be implemented later if needed
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.order.Ngay_dat).getTime() - new Date(a.order.Ngay_dat).getTime();
        case 'oldest':
          return new Date(a.order.Ngay_dat).getTime() - new Date(b.order.Ngay_dat).getTime();
        case 'high-rating':
          return 0; // Not applicable for this view
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
    // Open modal with list of products to review
    this.currentReviewOrder = order;
    this.currentSelectedProduct = null;
    this.modalView = 'list';
    this.reviewedProductIds = new Set();
    
    // Mark products as reviewed if they already have reviews
    const existingReviews = this.reviewService.getReviewData().toPromise().then(reviews => {
      reviews?.forEach(review => {
        if (review.Ma_don_mua === order.order.Ma_don_mua) {
          this.reviewedProductIds.add(review.Ma_san_pham);
        }
      });
    });

    setTimeout(() => {
      const modalEl = document.getElementById('reviewModal');
      if (modalEl) {
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 0);
  }

  selectProductForReview(product: iOrderDetail & { product: iProduct }): void {
    if (this.reviewedProductIds.has(product.Ma_san_pham)) {
      alert('Sản phẩm này đã được đánh giá');
      return;
    }
    
    this.currentSelectedProduct = product;
    this.modalView = 'form';
    this.reviewRating = 5;
    this.reviewContent = '';
    this.reviewImages = [];
    this.hoveringRating = 0;
  }

  backToProductList(): void {
    this.currentSelectedProduct = null;
    this.modalView = 'list';
    this.reviewRating = 5;
    this.reviewContent = '';
    this.reviewImages = [];
    this.hoveringRating = 0;
  }

  closeReviewModal(): void {
    const modalEl = document.getElementById('reviewModal');
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    this.currentReviewOrder = null;
    this.currentSelectedProduct = null;
    this.modalView = 'list';
    this.reviewedProductIds.clear();
    this.reviewRating = 5;
    this.reviewContent = '';
    this.reviewImages = [];
    this.hoveringRating = 0;
    this.isSubmittingReview = false;
  }

  setReviewRating(rating: number): void {
    this.reviewRating = rating;
  }

  limitReviewContent(): void {
    if (this.reviewContent.length > 500) {
      this.reviewContent = this.reviewContent.substring(0, 500);
    }
  }

  onReviewContentChange(value: string): void {
    this.reviewContent = value;
    this.limitReviewContent();
  }

  setHoveringRating(value: number): void {
    this.hoveringRating = value;
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
    if (!this.currentSelectedProduct || !this.reviewContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    if (!this.currentReviewOrder) {
      alert('Không tìm thấy đơn hàng');
      return;
    }

    this.isSubmittingReview = true;

    // Create review for the selected product only
    const review: iReview = {
      Ma_danh_gia: '', // Will be generated by server
      Ma_khach_hang: this.currentCustomerId,
      Ma_san_pham: this.currentSelectedProduct.Ma_san_pham,
      Ma_don_mua: this.currentReviewOrder.order.Ma_don_mua,
      Diem_danh_gia: this.reviewRating,
      Noi_dung: this.reviewContent,
      Hinh_anh: this.reviewImages.filter(img => img !== '')
        .map(img => typeof img === 'string' ? img : ''),
      Thoi_gian_gui: new Date(),
    };

    this.reviewService.createReview(review).toPromise()
      .then(() => {
        // Mark product as reviewed
        this.reviewedProductIds.add(this.currentSelectedProduct!.Ma_san_pham);
        alert('Cảm ơn bạn đã đánh giá sản phẩm này!');
        
        // Get unreviewd products
        const unreviwedProducts = this.currentReviewOrder!.items.filter(
          item => !this.reviewedProductIds.has(item.Ma_san_pham)
        );
        
        if (unreviwedProducts.length > 0) {
          // Continue to next product
          this.backToProductList();
        } else {
          // All products reviewed, close modal
          this.closeReviewModal();
          this.loadData(); // Reload to update UI
        }
      })
      .catch((error) => {
        console.error('Error submitting review:', error);
        alert('Lỗi khi gửi đánh giá. Vui lòng thử lại.');
      })
      .finally(() => {
        this.isSubmittingReview = false;
      });
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

  getDaysUntilExpiration(order: iOrder): number {
    const orderDate = new Date(order.Ngay_dat);
    const expiryDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  get notReviewedCount(): number {
    return this.orderWithReviews.filter(o => !o.hasReview && o.canReview).length;
  }

  get reviewedCount(): number {
    return this.orderWithReviews.filter(o => o.hasReview).length;
  }
}
