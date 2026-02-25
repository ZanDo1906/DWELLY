import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table } from '../../../components/table/table';
import { FormsModule } from '@angular/forms';
import { ProductForm } from '../product-form/product-form';
import { iProduct } from '../../../interfaces/product';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, Table, FormsModule, ProductForm],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  pageSize = 10;
  currentPage = 1;
  products: Array<any> = [];
  
  dropdownOpen = false;
@HostListener('document:click', ['$event'])
closeDropdown(event: Event): void {
  const target = event.target as HTMLElement;
  if (target.closest('.dropdown-wrapper')) {
    return;
  }
  this.dropdownOpen = false;
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
  constructor(private router: Router) {}

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
      list = list.filter(p => p.status === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)  
      );
    }

    if (this.sortMode === 'az') { list.sort((a, b) => a.name.localeCompare(b.name)); } else if (this.sortMode === 'za') { list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (this.sortMode === 'highest') {
      list.sort((a, b) => {
        const priceA = Number((a.price || '0').replace(/[^\d]/g, ''));
        const priceB = Number((b.price || '0').replace(/[^\d]/g, ''));
        return priceB - priceA; // cao nhất trước
      });
    } else if (this.sortMode === 'lowest') {
      list.sort((a, b) => {
        const priceA = Number((a.price || '0').replace(/[^\d]/g, ''));
        const priceB = Number((b.price || '0').replace(/[^\d]/g, ''));
        return priceA - priceB; // thấp nhất trước
      });
    }
    return list;  }

    toggleSort(mode: string): void {
  if (mode === 'az') { this.sortMode = this.sortMode === 'az' ? 'za' : 'az'; } else { this.sortMode = mode; } this.currentPage = 1;
}

  async ngOnInit(): Promise<void> {
    try {
      const [prodRes, revRes] = await Promise.all([
        fetch('/assets/data/product.json'),
        fetch('/assets/data/review.json')
      ]);
      if (!prodRes.ok) throw new Error('Failed to load product.json');
      if (!revRes.ok) throw new Error('Failed to load review.json');

      const [prodData, revData] = await Promise.all([prodRes.json(), revRes.json()]);

      const reviewsByProduct = revData.reduce((map: any, r: any) => {
        const key = r.Ma_san_pham;
        if (!map[key]) map[key] = [];
        map[key].push(r);
        return map;
      }, {});

      this.products = prodData.map((p: any, idx: number) => {
        const reviewsFor = reviewsByProduct[p.Ma_san_pham] || [];
        const total = reviewsFor.reduce(
          (sum: number, r: any) => sum + (Number(r.Diem_danh_gia) || 0),
          0
        );
        const avg = reviewsFor.length ? total / reviewsFor.length : 0;

        return {
          sku: p.Ma_san_pham ?? (`P${String(idx + 1).padStart(2, '0')}`),
          name: p.Ten_san_pham ?? '—',
          price: p.Gia_ban != null
            ? new Intl.NumberFormat('vi-VN').format(p.Gia_ban) + ' ₫'
            : '—',
          stock: p.So_luong_ton_kho ?? 0,

          ratingValue: avg,
          ratingCount: reviewsFor.length,

          status: p.Trang_thai ? 'Đang kinh doanh' : 'Ngưng kinh doanh',
          statusColor: p.Trang_thai ? 'green' : 'red'
        };
      });
    } catch (err) {
      console.error('Error loading products or reviews:', err);
      this.products = [];
    }
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

  // Nếu tổng số trang <= 5 thì hiển thị hết
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  // Trang đầu tiên
  pages.push(1);

  // Nếu current > 3 thì thêm "..."
  if (current > 3) {
    pages.push('...');
  }

  // Các trang xung quanh current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Nếu current < total - 2 thì thêm "..."
  if (current < total - 2) {
    pages.push('...');
  }

  // Trang cuối cùng
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