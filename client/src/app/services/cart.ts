import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, retry, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

export interface CartItem {
  productId: string;
  quantity: number;
  selected: boolean;
}

interface CartResponse {
  Ma_khach_hang: string;
  San_pham: { Ma_san_pham: string; So_luong: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class Cart {
  private storageKey = 'cart_items';
  private cartSubject = new BehaviorSubject<CartItem[]>(this.getLocalItems());

  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) { }

  private getCustomerId(): string | null {
    const user = localStorage.getItem('current_user');
    if (!user) return null;
    const parsed = JSON.parse(user);
    return parsed.customerCode ?? parsed.Ma_khach_hang ?? null;
  }

  // Đọc từ localStorage (fallback / cache)
  getLocalItems(): CartItem[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private saveLocal(items: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.cartSubject.next(items);
  }

  // Lấy giỏ hàng từ MongoDB
  loadCart(): void {
    const customerId = this.getCustomerId();
    if (!customerId) return;

    this.http.get<CartResponse>(`${baseUrl}/cart/${customerId}`)
      .pipe(retry(2), catchError(this.handleError))
      .subscribe({
        next: (res) => {
          const items: CartItem[] = res.San_pham.map(sp => ({
            productId: sp.Ma_san_pham,
            quantity: sp.So_luong,
            selected: true
          }));
          this.saveLocal(items);
        }
      });
  }

  // Lấy items hiện tại (ưu tiên cache)
  getItems(): CartItem[] {
    return this.getLocalItems();
  }

  // Thêm sản phẩm
  addItem(productId: string, quantity: number = 1): void {
    // Cập nhật local ngay
    const items = this.getLocalItems();
    const existing = items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId, quantity, selected: true });
    }
    this.saveLocal(items);

    // Gửi lên MongoDB
    const customerId = this.getCustomerId();
    if (customerId) {
      this.http.post<CartResponse>(`${baseUrl}/cart/add`, {
        Ma_khach_hang: customerId,
        Ma_san_pham: productId,
        So_luong: quantity
      }).pipe(catchError(this.handleError)).subscribe();
    }
  }

  // Xóa sản phẩm
  removeItem(productId: string): void {
    const items = this.getLocalItems().filter(i => i.productId !== productId);
    this.saveLocal(items);

    const customerId = this.getCustomerId();
    if (customerId) {
      this.http.delete<CartResponse>(`${baseUrl}/cart/${customerId}/${productId}`)
        .pipe(catchError(this.handleError)).subscribe();
    }
  }

  // Xóa nhiều sản phẩm cùng lúc
  removeItems(productIds: string[]): void {
    const normalizedIds = Array.from(new Set(
      (productIds || [])
        .map(id => String(id || '').trim())
        .filter(Boolean)
    ));

    if (normalizedIds.length === 0) return;

    const idSet = new Set(normalizedIds);
    const items = this.getLocalItems().filter(i => !idSet.has(i.productId));
    this.saveLocal(items);

    const customerId = this.getCustomerId();
    if (customerId) {
      this.http.patch<CartResponse>(`${baseUrl}/cart/remove-items`, {
        Ma_khach_hang: customerId,
        Ma_san_pham_list: normalizedIds
      }).pipe(catchError(this.handleError)).subscribe();
    }
  }

  // Cập nhật số lượng
  updateQuantity(productId: string, quantity: number): void {
    const items = this.getLocalItems();
    const item = items.find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
      this.saveLocal(items);
    }

    const customerId = this.getCustomerId();
    if (customerId) {
      this.http.patch<CartResponse>(`${baseUrl}/cart/update`, {
        Ma_khach_hang: customerId,
        Ma_san_pham: productId,
        So_luong: quantity
      }).pipe(catchError(this.handleError)).subscribe();
    }
  }

  toggleSelected(productId: string): void {
    const items = this.getLocalItems();
    const item = items.find(i => i.productId === productId);
    if (item) {
      item.selected = !item.selected;
      this.saveLocal(items);
    }
  }

  setAllSelected(selected: boolean): void {
    const items = this.getLocalItems();
    items.forEach(i => i.selected = selected);
    this.saveLocal(items);
  }

  // Xóa toàn bộ giỏ hàng
  clearCart(): void {
    this.saveLocal([]);

    const customerId = this.getCustomerId();
    if (customerId) {
      this.http.delete<CartResponse>(`${baseUrl}/cart/${customerId}`)
        .pipe(catchError(this.handleError)).subscribe();
    }
  }

  getCartCount(): number {
    return this.getLocalItems().reduce((sum, i) => sum + i.quantity, 0);
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
