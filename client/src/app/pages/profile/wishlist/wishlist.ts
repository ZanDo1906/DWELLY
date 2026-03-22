import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { iProduct } from '../../../interfaces/product';
import { Product } from '../../../services/product';
import { Client } from '../../../services/client';
import { Cart } from '../../../services/cart';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class Wishlist implements OnInit {

  products: iProduct[] = [];
  favorites: string[] = [];   
  priceSort: 'asc' | 'desc' = 'desc';
  dateSort: 'asc' | 'desc' = 'desc';
  currentSort: 'date' | 'price' | null = null;
  cartNotificationProductId: string | null = null;
  private cartNotificationTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public productService: Product,
    private clientService: Client,
    private cartService: Cart
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist() {
    const user = this.clientService.getCurrentUser();

    if (!user) {
      this.products = [];
      return;
    }

    const maKhachHang = user.customerCode ?? user.Ma_khach_hang;

    this.clientService.getWishlist(maKhachHang).subscribe({
      next: (data: any) => {
        this.products = data;
        this.favorites = data.map((p: any) => p.Ma_san_pham);
        user.favorites = this.favorites;
        localStorage.setItem('current_user', JSON.stringify(user));
      },
      error: (err) => {
        console.log(err);
        if (!user.favorites || user.favorites.length === 0) {
          this.products = [];
          return;
        }
        this.favorites = user.favorites;
        this.productService.getProductsByCodes(user.favorites)
          .subscribe({
            next: (data) => {
              this.products = data;
            },
            error: (err) => console.log(err)
          });
      }
    });
  }

  isFavorite(productId: string): boolean {
    return this.favorites.includes(productId);
  }

  toggleFavorite(productId: string) {

    const user = this.clientService.getCurrentUser();
    if (!user) return;

    const maKhachHang = user.customerCode ?? user.Ma_khach_hang;

    this.clientService.toggleFavorite(maKhachHang, productId)
      .subscribe({

        next: (res: any) => {

          user.favorites = res.favorites;
          this.favorites = res.favorites;

          localStorage.setItem('current_user', JSON.stringify(user));

          if (!this.favorites.includes(productId)) {
            this.products = this.products.filter(
              p => p.Ma_san_pham !== productId
            );
          }

        },

        error: (err) => console.error(err)
      });
  }
  addToCart(productId: string): void {
    this.cartService.addItem(productId);
    this.showCartNotification(productId);
  }

  private showCartNotification(productId: string): void {
    this.cartNotificationProductId = productId;

    if (this.cartNotificationTimer) {
      clearTimeout(this.cartNotificationTimer);
    }

    this.cartNotificationTimer = setTimeout(() => {
      this.cartNotificationProductId = null;
      this.cartNotificationTimer = null;
    }, 1500);
  }
  sortByNewest() {
    this.products = [...this.products].sort((a, b) =>
      Number(b.Ma_san_pham) - Number(a.Ma_san_pham)
    );
  }

  sortByPrice() {
  this.currentSort = 'price';

  this.priceSort = this.priceSort === 'desc' ? 'asc' : 'desc';

  this.products = [...this.products].sort((a, b) => {
    return this.priceSort === 'desc'
      ? b.Gia_ban - a.Gia_ban
      : a.Gia_ban - b.Gia_ban;
  });
  }
  sortByFavoriteOrder() {

  this.currentSort = 'date';

  this.dateSort = this.dateSort === 'desc' ? 'asc' : 'desc';

  this.products = [...this.products].sort((a, b) => {

    const indexA = this.favorites.indexOf(a.Ma_san_pham);
    const indexB = this.favorites.indexOf(b.Ma_san_pham);

    return this.dateSort === 'desc'
      ? indexB - indexA   
      : indexA - indexB;  

  });

}
}