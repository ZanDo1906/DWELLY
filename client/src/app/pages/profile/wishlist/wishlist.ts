import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { iProduct } from '../../../interfaces/product';
import { Product } from '../../../services/product';
import { Client } from '../../../services/client';
import { Router } from '@angular/router';

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
  constructor(
    public productService: Product,
    private clientService: Client,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist() {

    const user = JSON.parse(localStorage.getItem("current_user") || "{}");

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
  goToCart() {
  this.router.navigate(['/cart-page']);
  }
  sortByNewest() {
    this.products = [...this.products].sort((a, b) =>
      Number(b.Ma_san_pham) - Number(a.Ma_san_pham)
    );
  }

  sortByPrice() {

  this.priceSort = this.priceSort === 'desc' ? 'asc' : 'desc';

  this.products = [...this.products].sort((a, b) => {
    return this.priceSort === 'desc'
      ? b.Gia_ban - a.Gia_ban
      : a.Gia_ban - b.Gia_ban;
  });
  }
  sortByFavoriteOrder() {

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