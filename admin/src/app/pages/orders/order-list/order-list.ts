import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { iOrder } from '../../../interfaces/order';
import { Table } from '../../../components/table/table';
import { Order as OrderService } from '../../../services/order';

interface OrderRow {
  id: number;
  code: string;
  customer: string;
  date: string;
  dateValue: number;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  deliveryStatus: 'none' | 'waiting' | 'shipping' | 'delivered' | 'completed';
  total: string;
}

@Component({
  selector: 'app-order-list',
  imports: [CommonModule, Table],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderList implements OnInit {
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  sortMode: '' | 'az' | 'za' | 'newest' | 'oldest' = '';
  isStatusOpen = false;
  statusOptions = ['Tất cả trạng thái', 'Chờ duyệt', 'Đã duyệt', 'Bị từ chối', 'Đã hủy', 'Chờ giao', 'Đang giao', 'Đã giao', 'Hoàn thành'];
  selectedStatus = this.statusOptions[0];
  private readonly allStatusLabel = 'Tất cả trạng thái';

  constructor(
    private router: Router,
    private orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private readonly approvalStatusLabels: Record<OrderRow['approvalStatus'], string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Bị từ chối',
    cancelled: 'Đã hủy',
  };

  private readonly deliveryStatusLabels: Record<OrderRow['deliveryStatus'], string> = {
    none: '',
    waiting: 'Chờ giao',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    completed: 'Hoàn thành',
  };

  orders: OrderRow[] = [];

  get filteredOrders(): OrderRow[] {
    const normalizedKeyword = this.searchTerm.trim().toLowerCase();

    const filtered = this.orders.filter((order) => {
      const approvalLabel = this.approvalStatusLabels[order.approvalStatus];
      const deliveryLabel = this.deliveryStatusLabels[order.deliveryStatus];
      const matchesStatus =
        this.selectedStatus === this.allStatusLabel ||
        approvalLabel === this.selectedStatus ||
        deliveryLabel === this.selectedStatus;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const searchable = [
        order.code,
        order.customer,
        order.date,
        order.total,
        approvalLabel,
        deliveryLabel,
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedKeyword);
    });

    if (this.sortMode === 'az' || this.sortMode === 'za') {
      filtered.sort((a, b) => {
        const compareValue = a.customer.localeCompare(b.customer, 'vi', { sensitivity: 'base' });
        return this.sortMode === 'az' ? compareValue : -compareValue;
      });
    } else if (this.sortMode === 'newest' || this.sortMode === 'oldest') {
      filtered.sort((a, b) => {
        const aTime = a.dateValue;
        const bTime = b.dateValue;
        return this.sortMode === 'newest' ? bTime - aTime : aTime - bTime;
      });
    }

    return filtered;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize));
  }

  get pagedOrders() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(startIndex, startIndex + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  toggleSort(mode: 'az'): void {
    if (mode === 'az') {
      this.sortMode = this.sortMode === 'az' ? 'za' : 'az';
      this.currentPage = 1;
    }
  }

  setDateSort(mode: 'newest' | 'oldest'): void {
    this.sortMode = mode;
    this.currentPage = 1;
  }

  toggleStatusDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isStatusOpen = !this.isStatusOpen;
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.isStatusOpen = false;
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.currentPage = 1;
  }

  @HostListener('document:click')
  closeStatusDropdown(): void {
    this.isStatusOpen = false;
  }

  navigateToAddOrder(): void {
    this.router.navigate(['/add-order']);
  }

  goToOrderDetail(orderId: string): void {
    this.router.navigate(['/order-detail', orderId]);
  }

  private loadOrders(): void {
    this.orderService.getOrderData().subscribe({
      next: (orders) => {
        this.orders = orders.map((order, index) => {
          const dateValue = this.toTimestamp(order.Ngay_dat);
          const normalizedStatus = this.normalizeText(order.Trang_thai || '');

          return {
            id: index + 1,
            code: order.Ma_don_mua,
            customer: this.getCustomerName(order),
            date: this.formatDate(order.Ngay_dat),
            dateValue,
            approvalStatus: this.mapApprovalStatus(normalizedStatus),
            deliveryStatus: this.mapDeliveryStatus(normalizedStatus),
            total: `${Number(order.Tong_tien || 0).toLocaleString('vi-VN')} VND`,
          };
        });

        this.currentPage = 1;
      },
      error: () => {
        this.orders = [];
      },
    });
  }

  private getCustomerName(order: iOrder): string {
    const guestInfo = order.Thong_tin_khach_vang_lai as unknown as {
      Ho_va_ten?: string;
      Ho_ten?: string;
    };
    const shippingInfo = order.Thong_tin_giao_hang as unknown as {
      Ho_ten_nguoi_nhan?: string;
    };

    const guestName = (guestInfo?.Ho_va_ten || guestInfo?.Ho_ten || '').trim();
    if (guestName) {
      return guestName;
    }

    const shippingName = (shippingInfo?.Ho_ten_nguoi_nhan || '').trim();
    if (shippingName) {
      return shippingName;
    }

    return 'Khách hàng';
  }

  private mapApprovalStatus(status: string): 'pending' | 'approved' | 'rejected' | 'cancelled' {
    if (status.includes('da huy')) {
      return 'cancelled';
    }

    if (status.includes('bi tu choi')) {
      return 'rejected';
    }

    if (status.includes('cho duyet')) {
      return 'pending';
    }

    return 'approved';
  }

  private mapDeliveryStatus(status: string): 'none' | 'waiting' | 'shipping' | 'delivered' | 'completed' {
    if (
      status.includes('cho duyet') ||
      status.includes('bi tu choi') ||
      status.includes('da huy') ||
      status.includes('huy don') ||
      status.includes('tra hang')
    ) {
      return 'none';
    }

    if (status.includes('cho giao hang') || status.includes('cho giao') || status.includes('da duyet')) {
      return 'waiting';
    }

    if (status.includes('da giao')) {
      return 'delivered';
    }

    if (status.includes('hoan thanh')) {
      return 'completed';
    }

    if (status.includes('dang giao') || status.includes('dang van chuyen')) {
      return 'shipping';
    }

    return 'none';
  }

  private formatDate(value: Date | string): string {
    const timestamp = this.toTimestamp(value);
    if (!timestamp) {
      return '--/--/----';
    }

    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private toTimestamp(value: Date | string): number {
    const date = new Date(value);
    const timestamp = date.getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }
}
