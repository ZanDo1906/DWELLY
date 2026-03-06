import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table } from '../../../components/table/table';
import { FormsModule } from '@angular/forms';
import { ProductForm } from '../product-form/product-form';
import { iProduct } from '../../../interfaces/product';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../services/product';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, Table, FormsModule, ProductForm],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css'],
})
export class ProductList implements OnInit {
  pageSize = 10;
  currentPage = 1;
  selectedProducts: string[] = [];
  products: iProduct[] = [];
  constructor(private router: Router, private productService: Product) {}
  ngOnInit(): void {
  this.loadProducts();
}

  loadProducts(): void {
    this.productService.getProductData().subscribe({
      next: (data: iProduct[]) => {
        this.products = data;
      },
      error: (err) => console.error('Lỗi khi load sản phẩm', err)
    });
  }

    dropdownOpen = false;
  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('.dropdown-wrapper')) {
      return;
    }
    this.dropdownOpen = false;
  }

  toggleSelect(id: string) {

  if (this.selectedProducts.includes(id)) {
    this.selectedProducts =
      this.selectedProducts.filter(p => p !== id);
  } else {
    this.selectedProducts.push(id);
  }

}
  isSelected(id: string): boolean {
    return this.selectedProducts.includes(id);
  }
  isAllSelected(): boolean {
  return this.pagedProducts.length > 0 &&
         this.pagedProducts.every(p =>
           this.selectedProducts.includes(p.Ma_san_pham)
         );
}
  toggleSelectAll(event: any) {

  if (event.target.checked) {
    this.selectedProducts =
      this.pagedProducts.map(p => p.Ma_san_pham);
  } else {
    this.selectedProducts = [];
  }

}

  deleteSelected() {

  if (!confirm("Bạn có chắc muốn xóa các sản phẩm đã chọn?")) return;

  this.selectedProducts.forEach(id => {
    this.productService.deleteProduct(id).subscribe();
  });

  this.products =
    this.products.filter(
      p => !this.selectedProducts.includes(p.Ma_san_pham)
    );

  this.selectedProducts = [];

}

  toggleDropdown(event: Event): void {
  event.stopPropagation();
  this.dropdownOpen = !this.dropdownOpen;
}
selectStatus(status: string, event: Event): void {
  event.stopPropagation();
  this.statusFilter = status;
  this.dropdownOpen = false;
}
 

  goToDetail(id: string): void {
    this.router.navigate(['/product-form', id]);
  }

  goToAdd(): void {
  this.router.navigate(['/product-form']);
}

  private _searchTerm: string = '';
  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(val: string) {
    this._searchTerm = val;
    this.currentPage = 1; 
  }

  private _statusFilter: string = 'Tất cả trạng thái';
  get statusFilter(): string {
    return this._statusFilter;
  }
  set statusFilter(val: string) {
    this._statusFilter = val;
    this.currentPage = 1;
  }

  private _sortMode: string = ''; // 'az' | 'highest' | 'lowest'
  get sortMode(): string {
    return this._sortMode;
  }
  set sortMode(val: string) {
    this._sortMode = val;
    this.currentPage = 1;
  }

  get filteredProducts() {
    let list = [...this.products];

    if (this.statusFilter !== 'Tất cả trạng thái') {
      const isTrading = this.statusFilter === 'Đang kinh doanh';
      list = list.filter(p => p.Trang_thai === isTrading);
    }
    if (this.searchTerm.trim()) {
    const term = this.searchTerm.toLowerCase();
    list = list.filter(p =>
      p.Ten_san_pham.toLowerCase().includes(term) ||
      p.Ma_san_pham.toLowerCase().includes(term)
    );
  }

    if (this.sortMode === 'highest') {
    list.sort((a, b) => (b.Gia_ban || 0) - (a.Gia_ban || 0));
  } else if (this.sortMode === 'lowest') {
    list.sort((a, b) => (a.Gia_ban || 0) - (b.Gia_ban || 0));
  } else if (this.sortMode === 'az') {
    list.sort((a, b) => a.Ten_san_pham.localeCompare(b.Ten_san_pham));
  } else if (this.sortMode === 'za') {
    list.sort((a, b) => b.Ten_san_pham.localeCompare(a.Ten_san_pham));
  } else {
    list.sort((a, b) => a.Ma_san_pham.localeCompare(b.Ma_san_pham));
  }

  return list;
}
    toggleSort(mode: string): void {
  if (mode === 'az') { this.sortMode = this.sortMode === 'az' ? 'za' : 'az'; } else { this.sortMode = mode; } this.currentPage = 1;
}

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  get pagedProducts() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }
get pages(): (number | string)[] {
  const total = this.totalPages;
  const current = this.currentPage;
  const maxVisible = 5;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}


  goToPage(page: string | number): void {
  if (page === '...') {
    return; 
  }
  if (typeof page === 'number' && (page < 1 || page > this.totalPages)) {
    return;
  }
  this.currentPage = page as number;
}

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }
  getStarIcon(rating: number): string {
    if (rating % 1 >= 0.5) {
      return 'bi bi-star-half';
    }
    return 'bi bi-star-fill';
  }
 
}