import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table } from '../../../components/table/table';

interface Order {
  id: number;
  code: string;
  customer: string;
  date: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  deliveryStatus: 'pending' | 'approved' | 'rejected';
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

  orders: Order[] = [
    { id: 1, code: 'B01', customer: 'Nguyễn Văn A', date: '20/10/2026', approvalStatus: 'pending', deliveryStatus: 'pending', total: '18.000.000 VND' },
    { id: 2, code: 'B02', customer: 'Trần Thị B', date: '10/01/2026', approvalStatus: 'approved', deliveryStatus: 'approved', total: '12.500.000 VND' },
    { id: 3, code: 'B03', customer: 'Lê Văn C', date: '12/02/2026', approvalStatus: 'rejected', deliveryStatus: 'rejected', total: '9.000.000 VND' },
    { id: 4, code: 'B04', customer: 'Phạm Văn D', date: '15/03/2026', approvalStatus: 'pending', deliveryStatus: 'approved', total: '22.000.000 VND' },
    { id: 5, code: 'B05', customer: 'Hoàng Thị E', date: '01/04/2026', approvalStatus: 'approved', deliveryStatus: 'approved', total: '15.300.000 VND' },
    { id: 6, code: 'B06', customer: 'Đỗ Văn F', date: '05/05/2026', approvalStatus: 'rejected', deliveryStatus: 'rejected', total: '8.700.000 VND' },
    { id: 7, code: 'B07', customer: 'Ngô Thị G', date: '20/06/2026', approvalStatus: 'pending', deliveryStatus: 'pending', total: '30.000.000 VND' },
    { id: 8, code: 'B08', customer: 'Võ Văn H', date: '12/07/2026', approvalStatus: 'approved', deliveryStatus: 'approved', total: '17.800.000 VND' },
    { id: 9, code: 'B09', customer: 'Bùi Thị I', date: '25/08/2026', approvalStatus: 'rejected', deliveryStatus: 'rejected', total: '5.400.000 VND' },
    { id: 10, code: 'B10', customer: 'Nguyễn Văn K', date: '11/09/2026', approvalStatus: 'pending', deliveryStatus: 'approved', total: '21.000.000 VND' },
    { id: 11, code: 'B11', customer: 'Lý Thị L', date: '14/10/2026', approvalStatus: 'approved', deliveryStatus: 'approved', total: '19.200.000 VND' },
    { id: 12, code: 'B12', customer: 'Trương Văn M', date: '30/10/2026', approvalStatus: 'rejected', deliveryStatus: 'rejected', total: '11.600.000 VND' },
  ];

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.orders.length / this.pageSize));
  }

  get pagedOrders() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.orders.slice(startIndex, startIndex + this.pageSize);
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
}
