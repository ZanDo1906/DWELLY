import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Table } from '../../../components/table/table';

interface Order {
  id: number;
  code: string;
  customer: string;
  date: string;
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
export class OrderList {
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  isStatusOpen = false;
  statusOptions = ['Tất cả trạng thái', 'Chờ duyệt', 'Đã duyệt', 'Đã từ chối', 'Đang giao', 'Hoàn thành', 'Bị hủy', 'Trả hàng'];
  selectedStatus = this.statusOptions[0];
  private readonly allStatusLabel = 'Tất cả trạng thái';

  constructor(private router: Router) {}

  private readonly approvalStatusLabels: Record<Order['approvalStatus'], string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Đã từ chối',
  };

  private readonly deliveryStatusLabels: Record<Order['deliveryStatus'], string> = {
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Bị hủy',
    returned: 'Trả hàng',
  };

  orders: Order[] = [
    { id: 1, code: 'B01', customer: 'Nguyễn Văn A', date: '20/10/2026', approvalStatus: 'pending', deliveryStatus: 'shipping', total: '18.000.000 VND' },
    { id: 2, code: 'B02', customer: 'Trần Thị B', date: '10/01/2026', approvalStatus: 'approved', deliveryStatus: 'completed', total: '12.500.000 VND' },
    { id: 3, code: 'B03', customer: 'Lê Văn C', date: '12/02/2026', approvalStatus: 'rejected', deliveryStatus: 'cancelled', total: '9.000.000 VND' },
    { id: 4, code: 'B04', customer: 'Phạm Văn D', date: '15/03/2026', approvalStatus: 'pending', deliveryStatus: 'completed', total: '22.000.000 VND' },
    { id: 5, code: 'B05', customer: 'Hoàng Thị E', date: '01/04/2026', approvalStatus: 'approved', deliveryStatus: 'completed', total: '15.300.000 VND' },
    { id: 6, code: 'B06', customer: 'Đỗ Văn F', date: '05/05/2026', approvalStatus: 'rejected', deliveryStatus: 'returned', total: '8.700.000 VND' },
    { id: 7, code: 'B07', customer: 'Ngô Thị G', date: '20/06/2026', approvalStatus: 'pending', deliveryStatus: 'shipping', total: '30.000.000 VND' },
    { id: 8, code: 'B08', customer: 'Võ Văn H', date: '12/07/2026', approvalStatus: 'approved', deliveryStatus: 'completed', total: '17.800.000 VND' },
    { id: 9, code: 'B09', customer: 'Bùi Thị I', date: '25/08/2026', approvalStatus: 'rejected', deliveryStatus: 'cancelled', total: '5.400.000 VND' },
    { id: 10, code: 'B10', customer: 'Nguyễn Văn K', date: '11/09/2026', approvalStatus: 'pending', deliveryStatus: 'shipping', total: '21.000.000 VND' },
    { id: 11, code: 'B11', customer: 'Lý Thị L', date: '14/10/2026', approvalStatus: 'approved', deliveryStatus: 'returned', total: '19.200.000 VND' },
    { id: 12, code: 'B12', customer: 'Trương Văn M', date: '30/10/2026', approvalStatus: 'rejected', deliveryStatus: 'cancelled', total: '11.600.000 VND' },
  ];

  get filteredOrders(): Order[] {
    const normalizedKeyword = this.searchTerm.trim().toLowerCase();

    return this.orders.filter((order) => {
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
}
