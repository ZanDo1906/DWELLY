import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../services/product';
import { iProduct } from '../../../interfaces/product';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  products: iProduct[] = [];
  displayedCount: number = 9;
  itemsPerPage: number = 9;
  selectedRoomTypes: Set<string> = new Set();
  selectedStyles: Set<string> = new Set();
  selectedCategories: Set<string> = new Set();
  minPrice: number = 0;
  maxPrice: number = 100000000;
  maxPriceLimit: number = 100000000;
  searchQuery: string = '';
  currentSort: string = 'price-asc';

  constructor(private productService: Product) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProductData().subscribe(
      (data: iProduct[]) => {
        this.products = data;
      },
      (error) => {
        console.error('Error loading products:', error);
      }
    );
  }

  loadMore(): void {
    this.displayedCount += this.itemsPerPage;
  }

  toggleRoomType(roomTypeId: string): void {
    if (this.selectedRoomTypes.has(roomTypeId)) {
      this.selectedRoomTypes.delete(roomTypeId);
    } else {
      this.selectedRoomTypes.add(roomTypeId);
    }
    this.displayedCount = 9;
  }

  toggleStyle(styleId: string): void {
    if (this.selectedStyles.has(styleId)) {
      this.selectedStyles.delete(styleId);
    } else {
      this.selectedStyles.add(styleId);
    }
    this.displayedCount = 9;
  }

  toggleCategory(categoryId: string): void {
    if (this.selectedCategories.has(categoryId)) {
      this.selectedCategories.delete(categoryId);
    } else {
      this.selectedCategories.add(categoryId);
    }
    this.displayedCount = 9;
  }

  clearFilters(): void {
    this.selectedRoomTypes.clear();
    this.selectedStyles.clear();
    this.selectedCategories.clear();
    this.minPrice = 0;
    this.maxPrice = 100000000;
    this.displayedCount = 9;
  }

  onPriceChange(): void {
    this.displayedCount = 9;
  }

  getPriceDisplay(): string {
    return `${this.minPrice.toLocaleString('vi-VN')} - ${this.maxPrice.toLocaleString('vi-VN')}đ`;
  }

  setSortOption(option: string): void {
    if (this.currentSort === option) {
      this.currentSort = '';
    } else {
      this.currentSort = option;
    }
    this.displayedCount = 9;
  }

  get filteredProducts(): iProduct[] {
    let filtered = this.products;

    // Filter by search query
    if (this.searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.Ten_san_pham.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Filter by room type, style, category, and price
    return filtered.filter(product => {
      const roomTypeMatch = this.selectedRoomTypes.size === 0 || this.selectedRoomTypes.has(product.Ma_loai_phong);
      const styleMatch = this.selectedStyles.size === 0 || this.selectedStyles.has(product.Ma_phong_cach);
      const categoryMatch = this.selectedCategories.size === 0 || this.selectedCategories.has(product.Ma_danh_muc);
      const priceMatch = product.Gia_ban >= this.minPrice && product.Gia_ban <= this.maxPrice;
      return roomTypeMatch && styleMatch && categoryMatch && priceMatch;
    });
  }

  get displayedProducts(): iProduct[] {
    const sorted = [...this.filteredProducts];
    
    switch (this.currentSort) {
      case 'price-asc':
        sorted.sort((a, b) => a.Gia_ban - b.Gia_ban);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.Gia_ban - a.Gia_ban);
        break;
      case 'rating':
        // If you have a rating field, add sorting here
        break;
      case 'newest':
      default:
        // Keep original order
        break;
    }
    
    return sorted.slice(0, this.displayedCount);
  }
}
