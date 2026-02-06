import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { iProduct } from '../../interfaces/product';
import { iReview } from '../../interfaces/review';
import { Review } from '../../services/review';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCard implements OnInit {
  @Input() product!: iProduct;
@Input() mainImage?: string;
 @Input() enableHover: boolean = true;

  hover = false;
  currentImageIndex = 0;

  reviews: iReview[] = [];
  averageRating = 0;
  heartActive = false;

  constructor(private reviewService: Review) {}

  ngOnInit(): void {
    if (this.product) {
      this.reviewService.getReviewData().subscribe({
        next: (data) => {
          this.reviews = data.filter(r => r.Ma_san_pham === this.product.Ma_san_pham);
          this.calcAverage();
        }
      });
    }
  }

  prevImage() {
    if (!this.product.Hinh_anh) return;
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.product.Hinh_anh.length) % this.product.Hinh_anh.length;
  }

  nextImage() {
    if (!this.product.Hinh_anh) return;
    this.currentImageIndex =
      (this.currentImageIndex + 1) % this.product.Hinh_anh.length;
  }

  toggleHeart() {
    this.heartActive = !this.heartActive;
  }

  calcAverage() {
    if (!this.reviews.length) {
      this.averageRating = 0;
      return;
    }
    const total = this.reviews.reduce((sum, r) => sum + r.Diem_danh_gia, 0);
    this.averageRating = total / this.reviews.length;
  }

  getMainImage(): string {
  return this.mainImage || this.product?.Hinh_anh?.[0] || 'assets/images/no-image.png';
}


  getHoverImage(): string {
    return this.product?.Hinh_anh?.[1] || this.product?.Hinh_anh?.[0] || 'assets/images/no-image.png';
  }

  getFormattedPrice(): string {
    return this.product?.Gia_ban
      ? this.product.Gia_ban.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VNĐ'
      : '';
  }

  getOldPrice(): string {
    if (!this.product?.Gia_ban) return '';
    const giaCu = this.product.Gia_ban / 0.75;
    return giaCu.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VNĐ';
  }

  getDiscountPercent(): number {
    if (!this.product?.Gia_ban) return 0;
    const giaCu = this.product.Gia_ban / 0.75;
    return Math.round((1 - this.product.Gia_ban / giaCu) * 100);
  }

  getStarIcon(): string {
    if (this.averageRating % 1 >= 0.5) {
      return 'bi bi-star-half';
    }
    return 'bi bi-star-fill';
  }
}
