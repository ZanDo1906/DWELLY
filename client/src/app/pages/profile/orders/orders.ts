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
  expandedOrderIds: Set<string> = new Set();
  searchQuery = '';
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

    this.applyFilters();
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.applyFilters();
  }

  private applyFilters(): void {
    const byTab = this.filterByActiveTab(this.allOrders);
    this.orders = this.filterBySearch(byTab);
  }

  private filterByActiveTab(source: OrderView[]): OrderView[] {
    switch (this.activeTab) {
      case 'Tất cả':
        return [...source];
      case 'Chờ xác nhận':
        return source.filter(o => this.normalizeOrderStatus(o.order.Trang_thai) === 'Chờ duyệt');
      case 'Chờ giao hàng':
        return source.filter(o => this.normalizeOrderStatus(o.order.Trang_thai) === 'Chờ giao hàng');
      case 'Đang giao hàng':
        return source.filter(o => this.normalizeOrderStatus(o.order.Trang_thai) === 'Đang giao');
      case 'Đã giao hàng':
        return source.filter(o => this.normalizeOrderStatus(o.order.Trang_thai) === 'Đã giao');
      case 'Hoàn thành':
        return source.filter(o => {
          const status = this.normalizeOrderStatus(o.order.Trang_thai);
          return status === 'Hoàn thành';
        });
      case 'Đã hủy':
        return source.filter(o => {
          const status = this.normalizeOrderStatus(o.order.Trang_thai);
          return status === 'Đã hủy' || status === 'Bị từ chối';
        });
      default:
        return [...source];
    }
  }

  private filterBySearch(source: OrderView[]): OrderView[] {
    const query = this.normalizeSearchText(this.searchQuery);
    if (!query) {
      return source;
    }

    return source.filter((orderView) => {
      const fields: string[] = [
        orderView.order.Ma_don_mua,
        this.normalizeOrderStatus(orderView.order.Trang_thai),
        ...orderView.items.map((item) => item.product?.Ten_san_pham || ''),
        ...orderView.items.map((item) => item.detail.Ma_san_pham || ''),
      ];

      const haystack = this.normalizeSearchText(fields.join(' '));
      return haystack.includes(query);
    });
  }

  private normalizeSearchText(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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
        this.applyFilters();
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

  getVisibleItems(orderView: OrderView): OrderProductView[] {
    const isExpanded = this.expandedOrderIds.has(orderView.order.Ma_don_mua);
    if (isExpanded) {
      return orderView.items;
    }

    return orderView.items.slice(0, 2);
  }

  hasHiddenItems(orderView: OrderView): boolean {
    return orderView.items.length > 2;
  }

  isExpanded(orderView: OrderView): boolean {
    return this.expandedOrderIds.has(orderView.order.Ma_don_mua);
  }

  toggleItems(orderView: OrderView, event: MouseEvent): void {
    event.stopPropagation();
    const orderId = orderView.order.Ma_don_mua;

    if (this.expandedOrderIds.has(orderId)) {
      this.expandedOrderIds.delete(orderId);
      return;
    }

    this.expandedOrderIds.add(orderId);
  }

  goToOrderDetail(orderId: string): void {
    localStorage.setItem('orderId', orderId);
    this.router.navigate(['/user-layout/order-detail']);
  }

  isPendingOrder(orderView: OrderView): boolean {
    return this.normalizeOrderStatus(orderView.order.Trang_thai) === 'Chờ duyệt';
  }

  isDeliveredOrder(orderView: OrderView): boolean {
    const status = this.normalizeOrderStatus(orderView.order.Trang_thai);
    return status === 'Đã giao' || status === 'Đã giao hàng';
  }

  isCompletedOrder(orderView: OrderView): boolean {
    return this.normalizeOrderStatus(orderView.order.Trang_thai) === 'Hoàn thành';
  }

  cancelOrder(orderView: OrderView, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.isPendingOrder(orderView)) {
      return;
    }

    const confirmed = window.confirm('Bạn có chắc muốn huỷ đơn hàng này?');
    if (!confirmed) {
      return;
    }

    this.orderService.updateOrderStatus(orderView.order.Ma_don_mua, 'Hủy đơn').subscribe({
      next: () => {
        orderView.order.Trang_thai = 'Đã hủy';
        this.allOrders = [...this.allOrders];
        this.filterOrdersByTab(this.activeTab);
      },
      error: (error) => {
        alert(error?.message || 'Không thể huỷ đơn hàng. Vui lòng thử lại.');
      },
    });
  }

  confirmReceived(orderView: OrderView, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.isDeliveredOrder(orderView)) {
      return;
    }

    const confirmed = window.confirm('Xác nhận bạn đã nhận được đơn hàng này?');
    if (!confirmed) {
      return;
    }

    this.orderService.updateOrderStatus(orderView.order.Ma_don_mua, 'Hoàn thành').subscribe({
      next: () => {
        orderView.order.Trang_thai = 'Hoàn thành';
        this.allOrders = [...this.allOrders];
        this.filterOrdersByTab(this.activeTab);
      },
      error: (error) => {
        alert(error?.message || 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.');
      },
    });
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
