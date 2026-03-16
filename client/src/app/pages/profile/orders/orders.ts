import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Modal } from '../../../components/modal/modal';
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
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  orders: OrderView[] = [];
  allOrders: OrderView[] = []; // Store all orders
  currentCustomerId: string = '';
  isLoading = false;
  errorMessage = '';
  activeTab: string = 'Tất cả'; // Track active tab

  currentReviewOrder: OrderView | null = null;
  currentSelectedProduct: OrderProductView | null = null;
  reviewedProductIds: Set<string> = new Set();
  modalView: 'list' | 'form' = 'list';
  isSubmittingReview = false;

  reviewRating = 5;
  hoveringRating = 0;
  reviewImages: (string | File)[] = [];
  reviewContent = '';

  constructor(
    private orderService: OrderService,
    private productService: Product,
    private categoryService: Category,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentCustomerId = localStorage.getItem('userId') || '';
    this.getOrderData();
  }

  getOrderCountByStatus(status: string): number {
    return this.allOrders.filter(orderView => this.normalizeOrderStatus(orderView.order.Trang_thai) === status).length;
  }

  filterOrdersByTab(tabName: string): void {
    this.activeTab = tabName;
    
    switch(tabName) {
      case 'Tất cả':
        this.orders = [...this.allOrders];
        break;
      case 'Chờ xác nhận':
        this.orders = this.allOrders.filter(o => this.normalizeOrderStatus(o.order.Trang_thai) === 'Chờ duyệt');
        break;
      case 'Chờ giao hàng':
        this.orders = this.allOrders.filter(o => this.normalizeOrderStatus(o.order.Trang_thai) === 'Chờ giao hàng');
        break;
      case 'Đang giao hàng':
        this.orders = this.allOrders.filter(o => this.normalizeOrderStatus(o.order.Trang_thai) === 'Đang giao');
        break;
      case 'Đã giao hàng':
        this.orders = this.allOrders.filter(o => this.normalizeOrderStatus(o.order.Trang_thai) === 'Đã giao');
        break;
      case 'Hoàn thành':
        this.orders = this.allOrders.filter(o => {
          const status = this.normalizeOrderStatus(o.order.Trang_thai);
          return status === 'Hoàn thành';
        });
        break;
      case 'Đã hủy':
        this.orders = this.allOrders.filter(o => {
          const status = this.normalizeOrderStatus(o.order.Trang_thai);
          return status === 'Đã hủy' || status === 'Bị từ chối';
        });
        break;
      default:
        this.orders = [...this.allOrders];
    }
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
        this.allOrders = this.mapOrdersForCurrentCustomer(
          orders as OrderWithDetails[],
          products,
          categories
        );
        this.orders = [...this.allOrders]; // Initialize with all orders
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
      const normalizedStatus = this.normalizeOrderStatus(order.Trang_thai);
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
        order: {
          ...order,
          Trang_thai: normalizedStatus,
        },
        items,
        totalItems: items.reduce((sum, item) => sum + item.detail.So_luong, 0),
      };
    });
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

  trackByOrderId(_: number, orderView: OrderView): string {
    return orderView.order.Ma_don_mua;
  }

  trackByOrderItem(_: number, item: OrderProductView): string {
    return item.detail.Ma_chi_tiet;
  }

  goToOrderDetail(orderId: string): void {
    localStorage.setItem('orderId', orderId);
    this.router.navigate(['/user-layout/order-detail']);
  }

  canReviewOrder(orderView: OrderView): boolean {
    const status = this.normalizeOrderStatus(orderView.order.Trang_thai);
    if (status !== 'Hoàn thành') {
      return false;
    }

    const completedAt = this.getCompletedAt(orderView.order);
    if (!completedAt) {
      return false;
    }

    const now = Date.now();
    const diffMs = now - completedAt.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    return diffMs >= 0 && diffMs <= sevenDaysMs;
  }

  openReviewModal(orderView: OrderView, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.canReviewOrder(orderView)) {
      alert('Chỉ có thể đánh giá trong vòng 7 ngày kể từ khi đơn hàng chuyển sang Hoàn thành.');
      return;
    }

    this.currentReviewOrder = orderView;
    this.currentSelectedProduct = null;
    this.modalView = 'list';
    this.reviewedProductIds.clear();
    this.reviewRating = 5;
    this.hoveringRating = 0;
    this.reviewImages = [];
    this.reviewContent = '';
    this.isSubmittingReview = false;

    setTimeout(() => {
      const modalEl = document.getElementById('reviewModal');
      if (!modalEl) {
        return;
      }

      const bootstrapRef = (window as unknown as { bootstrap?: { Modal: new (el: Element) => { show: () => void } } }).bootstrap;
      if (!bootstrapRef?.Modal) {
        return;
      }

      const modal = new bootstrapRef.Modal(modalEl);
      modal.show();
    }, 0);
  }

  selectProductForReview(item: OrderProductView): void {
    const productId = item.detail.Ma_san_pham;
    if (this.reviewedProductIds.has(productId)) {
      alert('Sản phẩm này đã được đánh giá.');
      return;
    }

    this.currentSelectedProduct = item;
    this.modalView = 'form';
    this.reviewRating = 5;
    this.hoveringRating = 0;
    this.reviewImages = [];
    this.reviewContent = '';
  }

  backToProductList(): void {
    this.currentSelectedProduct = null;
    this.modalView = 'list';
  }

  private getCompletedAt(order: iOrder): Date | null {
    const raw = (order as unknown as Record<string, unknown>)['updatedAt'] || order.Ngay_dat;

    let date: Date;
    if (raw instanceof Date) {
      date = raw;
    } else if (typeof raw === 'string' || typeof raw === 'number') {
      date = new Date(raw);
    } else {
      return null;
    }

    return Number.isNaN(date.getTime()) ? null : date;
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
    if (!this.currentSelectedProduct) {
      alert('Vui lòng chọn sản phẩm cần đánh giá.');
      return;
    }

    if (!this.reviewContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    this.isSubmittingReview = true;

    console.log('Submit review:', {
      orderId: this.currentReviewOrder?.order.Ma_don_mua,
      productId: this.currentSelectedProduct.detail.Ma_san_pham,
      rating: this.reviewRating,
      content: this.reviewContent,
    });

    const reviewedId = this.currentSelectedProduct.detail.Ma_san_pham;
    this.reviewedProductIds.add(reviewedId);
    this.isSubmittingReview = false;

    const remainingItems = (this.currentReviewOrder?.items || []).filter(
      (item) => !this.reviewedProductIds.has(item.detail.Ma_san_pham),
    );

    if (remainingItems.length > 0) {
      this.backToProductList();
      return;
    }

    this.closeReviewModal();
  }

  closeReviewModal(): void {
    const modalEl = document.getElementById('reviewModal');
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }

    this.currentSelectedProduct = null;
    this.modalView = 'list';
    this.reviewedProductIds.clear();
    this.reviewRating = 5;
    this.hoveringRating = 0;
    this.reviewImages = [];
    this.reviewContent = '';
    this.isSubmittingReview = false;
    this.currentReviewOrder = null;
  }
}
