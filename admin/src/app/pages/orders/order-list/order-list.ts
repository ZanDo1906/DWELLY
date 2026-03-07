import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { iOrder } from '../../../interfaces/order';
import { Table } from '../../../components/table/table';
import { Client as ClientService } from '../../../services/client';
import { Order as OrderService } from '../../../services/order';

interface OrderRow {
  id: number;
  code: string;
  customer: string;
  date: string;
  dateValue: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  deliveryStatus: 'shipping' | 'completed' | 'cancelled' | 'returned';
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
  statusOptions = ['Tất cả trạng thái', 'Chờ duyệt', 'Đã duyệt', 'Đã từ chối', 'Đang giao', 'Hoàn thành', 'Bị hủy', 'Trả hàng'];
  selectedStatus = this.statusOptions[0];
  private readonly allStatusLabel = 'Tất cả trạng thái';

  constructor(
    private router: Router,
    private orderService: OrderService,
    private clientService: ClientService,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private readonly approvalStatusLabels: Record<OrderRow['approvalStatus'], string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Đã từ chối',
  };

  private readonly deliveryStatusLabels: Record<OrderRow['deliveryStatus'], string> = {
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Bị hủy',
    returned: 'Trả hàng',
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
    forkJoin({
      orders: this.orderService.getOrderData(),
      clients: this.clientService.getClientData(),
    }).subscribe({
      next: ({ orders, clients }) => {
        const clientMap = new Map(clients.map((client) => [client.Ma_khach_hang, client.Ho_va_ten]));

        this.orders = orders.map((order, index) => {
          const dateValue = this.toTimestamp(order.Ngay_dat);
          const normalizedStatus = this.normalizeText(order.Trang_thai || '');

          return {
            id: index + 1,
            code: order.Ma_don_mua,
            customer: this.getCustomerName(order, clientMap),
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

  private getCustomerName(order: iOrder, clientMap: Map<string, string>): string {
    const guestInfo = order.Thong_tin_khach_vang_lai as unknown as {
      Ho_va_ten?: string;
      Ho_ten?: string;
    };
    const guestName = (guestInfo?.Ho_va_ten || guestInfo?.Ho_ten || '').trim();
    if (guestName) {
      return guestName;
    }

    const clientName = order.Ma_khach_hang ? clientMap.get(order.Ma_khach_hang)?.trim() : '';
    if (clientName) {
      return clientName;
    }

    return 'Khách hàng';
  }

  private mapApprovalStatus(status: string): 'pending' | 'approved' | 'rejected' {
    if (status.includes('tu choi')) {
      return 'rejected';
    }

    if (status.includes('cho duyet')) {
      return 'pending';
    }

    return 'approved';
  }

  private mapDeliveryStatus(status: string): 'shipping' | 'completed' | 'cancelled' | 'returned' {
    if (status.includes('hoan thanh')) {
      return 'completed';
    }

    if (status.includes('tra hang')) {
      return 'returned';
    }

    if (status.includes('huy') || status.includes('tu choi')) {
      return 'cancelled';
    }

    return 'shipping';
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
      .toLowerCase()
      .trim();
  }
}
