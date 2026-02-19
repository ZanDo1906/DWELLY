import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table } from '../../../components/table/table';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, Table],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  pageSize = 10;
  currentPage = 1;

  products = [
    { sku: 'SKU01', name: 'Giường bọc nệm', price: '50.000.000', rating: '⭐ 4.5 (15)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU02', name: 'Sofa góc', price: '32.000.000', rating: '⭐ 4.2 (8)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU03', name: 'Bàn ăn gỗ', price: '18.500.000', rating: '⭐ 4.7 (21)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU04', name: 'Ghế thư giãn', price: '9.900.000', rating: '⭐ 4.1 (6)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU05', name: 'Tủ quần áo', price: '24.000.000', rating: '⭐ 4.6 (13)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU06', name: 'Bàn làm việc', price: '7.800.000', rating: '⭐ 4.0 (5)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU07', name: 'Kệ tivi', price: '12.300.000', rating: '⭐ 4.3 (10)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU08', name: 'Giường tầng', price: '21.000.000', rating: '⭐ 4.4 (9)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU09', name: 'Bàn trang điểm', price: '6.500.000', rating: '⭐ 4.2 (7)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU10', name: 'Ghế ăn', price: '2.900.000', rating: '⭐ 4.1 (4)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU11', name: 'Tủ giày', price: '4.200.000', rating: '⭐ 4.3 (6)', status: 'Đang kinh doanh', statusColor: 'green' },
    { sku: 'SKU12', name: 'Tủ đầu giường', price: '3.100.000', rating: '⭐ 4.0 (3)', status: 'Đang kinh doanh', statusColor: 'green' },
  ];

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.products.length / this.pageSize));
  }

  get pagedProducts() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.products.slice(startIndex, startIndex + this.pageSize);
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
