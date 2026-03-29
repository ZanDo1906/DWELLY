import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../services/product';
import { iProduct } from '../../../interfaces/product';
import { ProductCard } from '../../../components/product-card/product-card';
import { Review } from '../../../services/review';
import { iReview } from '../../../interfaces/review';
import { Room } from '../../../services/room';
import { Style } from '../../../services/style';
import { Category } from '../../../services/category';
import { iRoom } from '../../../interfaces/room';
import { iStyle } from '../../../interfaces/style';
import { iCategory } from '../../../interfaces/category';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FormsModule, ProductCard],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  products: iProduct[] = [];
  reviews: iReview[] = [];
  roomTypes: iRoom[] = [];
  styles: iStyle[] = [];
  categories: iCategory[] = [];
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
  productRatings: Map<string, number> = new Map();

  constructor(
    private productService: Product,
    private reviewService: Review,
    private roomService: Room,
    private styleService: Style,
    private categoryService: Category
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadReviews();
    this.loadRoomTypes();
    this.loadStyles();
    this.loadCategories();
  }

  loadProducts(): void {
    this.productService.getProductData().subscribe(
      (data: iProduct[]) => {
        // Chỉ hiển thị sản phẩm đang kinh doanh
        this.products = data.filter(p => p.Trang_thai === true);
      },
      (error) => {
        console.error('Error loading products:', error);
      }
    );
  }

  loadReviews(): void {
    this.reviewService.getReviewData().subscribe(
      (data: iReview[]) => {
        this.reviews = data;
        this.calculateProductRatings();
      },
      (error) => {
        console.error('Error loading reviews:', error);
      }
    );
  }

  loadRoomTypes(): void {
    this.roomService.getRoomData().subscribe(
      (data: iRoom[]) => {
        this.roomTypes = data;
      },
      (error) => {
        console.error('Error loading room types:', error);
      }
    );
  }

  loadStyles(): void {
    this.styleService.getStyleData().subscribe(
      (data: iStyle[]) => {
        this.styles = data;
      },
      (error) => {
        console.error('Error loading styles:', error);
      }
    );
  }

  loadCategories(): void {
    this.categoryService.getCategoryData().subscribe(
      (data: iCategory[]) => {
        this.categories = data;
      },
      (error) => {
        console.error('Error loading categories:', error);
      }
    );
  }

  calculateProductRatings(): void {
    this.productRatings.clear();
    
    this.reviews.forEach(review => {
      if (!this.productRatings.has(review.Ma_san_pham)) {
        this.productRatings.set(review.Ma_san_pham, 0);
      }
    });

    // Group reviews by product and calculate average
    const ratingGroups = new Map<string, iReview[]>();
    this.reviews.forEach(review => {
      if (!ratingGroups.has(review.Ma_san_pham)) {
        ratingGroups.set(review.Ma_san_pham, []);
      }
      ratingGroups.get(review.Ma_san_pham)!.push(review);
    });

    ratingGroups.forEach((productReviews, productId) => {
      const avgRating = productReviews.reduce((sum, review) => sum + review.Diem_danh_gia, 0) / productReviews.length;
      this.productRatings.set(productId, avgRating);
    });
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
    this.maxPrice = this.maxPriceLimit;
    this.displayedCount = 9;
  }

  onMinPriceChange(value: number | null): void {
    const normalizedValue = this.normalizePrice(value, 0);
    this.minPrice = Math.min(normalizedValue, this.maxPrice);
    this.onPriceChange();
  }

  onMaxPriceChange(value: number | null): void {
    const normalizedValue = this.normalizePrice(value, this.maxPriceLimit);
    this.maxPrice = Math.max(normalizedValue, this.minPrice);
    this.onPriceChange();
  }

  onPriceChange(): void {
    this.displayedCount = 9;
  }

  normalizePrice(value: number | null, fallback: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return fallback;
    }

    return Math.min(Math.max(value, 0), this.maxPriceLimit);
  }

  getPriceDisplay(): string {
    return `${this.minPrice.toLocaleString('vi-VN')} - ${this.maxPrice.toLocaleString('vi-VN')} VND`;
  }

  setSortOption(option: string): void {
    if (this.currentSort === option) {
      this.currentSort = '';
    } else {
      this.currentSort = option;
    }
    this.displayedCount = 9;
  }

  getFinalPrice(product: iProduct): number {
    if (!product?.Gia_ban) return 0;
    const discount = product.Phan_tram_giam_gia ?? 0;
    return product.Gia_ban * (1 - discount / 100);
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
      const finalPrice = this.getFinalPrice(product);
      const priceMatch = finalPrice >= this.minPrice && finalPrice <= this.maxPrice;
      return roomTypeMatch && styleMatch && categoryMatch && priceMatch;
    });
  }

  get displayedProducts(): iProduct[] {
    const sorted = [...this.filteredProducts];
    
    switch (this.currentSort) {
      case 'price-asc':
        sorted.sort((a, b) => this.getFinalPrice(a) - this.getFinalPrice(b));
        break;
      case 'price-desc':
        sorted.sort((a, b) => this.getFinalPrice(b) - this.getFinalPrice(a));
        break;
      case 'rating':
        sorted.sort((a, b) => {
          const ratingA = this.productRatings.get(a.Ma_san_pham) ?? 0;
          const ratingB = this.productRatings.get(b.Ma_san_pham) ?? 0;
          return ratingB - ratingA; // Sort from high to low
        });
        break;
      case 'newest':
      default:
        // Keep original order
        break;
    }
    
    return sorted.slice(0, this.displayedCount);
  }
}
