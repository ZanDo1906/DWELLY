import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Component, Input, OnInit } from '@angular/core';
import { iProduct } from '../../interfaces/product';
import { iReview } from '../../interfaces/review';
import { Review } from '../../services/review';
import { Client } from '../../services/client';
import { Cart } from '../../services/cart';
import { Product } from '../../services/product';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
  

  showCartNotification = false;

  constructor(
    private reviewService: Review,
    private clientService: Client,
    private cartService: Cart,
    private productService: Product,
    private router: Router
  ) {}

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

  isFavorite(productId: string): boolean {

  const user = this.clientService.getCurrentUser();
  if (!user || !user.favorites) return false;

  return user.favorites.includes(productId);

}

  toggleFavorite(event: Event, productId: string) {

  event.preventDefault();
  event.stopPropagation();

  const user = this.clientService.getCurrentUser();
  if (!user) return;

  const maKhachHang = user.customerCode ?? user.Ma_khach_hang;

  this.clientService.toggleFavorite(maKhachHang, productId)
    .subscribe({

      next: (res: any) => {

        user.favorites = res.favorites;

        localStorage.setItem(
          'current_user',
          JSON.stringify(user)
        );

      },

      error: (err) => console.error(err)

    });
}
  goToCart(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  this.cartService.addItem(this.product.Ma_san_pham);
  this.showCartNotification = true;
  setTimeout(() => this.showCartNotification = false, 1500);
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
    const rawImage = this.mainImage || this.product?.Hinh_anh?.[0];
    return rawImage ? this.productService.getImgUrl(rawImage) : 'assets/images/no-image.png';
  }

  getHoverImage(): string {
    const rawImage = this.product?.Hinh_anh?.[1] || this.product?.Hinh_anh?.[0];
    return rawImage ? this.productService.getImgUrl(rawImage) : 'assets/images/no-image.png';
  }

  getFormattedPrice(): string {
    if (!this.product?.Gia_ban) return '';
    const discount = (this.product as any).Phan_tram_giam_gia ?? 0;
    const finalPrice = this.product.Gia_ban * (1 - discount / 100);
    return finalPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VNĐ';
  }

  getOldPrice(): string {
    if (!this.product?.Gia_ban) return '';
    return this.product.Gia_ban.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VNĐ';
  }

  getDiscountPercent(): number {
    return (this.product as any).Phan_tram_giam_gia ?? 0;
  }

  getStarIcon(): string {
    if (this.averageRating % 1 >= 0.5) {
      return 'bi bi-star-half';
    }
    return 'bi bi-star-fill';
  }
}
