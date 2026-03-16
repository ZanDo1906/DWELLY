import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Product } from '../../../services/product';
import { iProduct } from '../../../interfaces/product';
import { Room } from '../../../services/room';
import { iRoom } from '../../../interfaces/room';
import { Voucher } from '../../../services/voucher';
import { iVoucher } from '../../../interfaces/voucher';
import { VoucherPopup } from '../voucher-popup/voucher-popup';
import { Modal } from '../../../components/modal/modal';
import { Cart, CartItem as StoredCartItem } from '../../../services/cart';

interface CartItem {
  product: iProduct;
  quantity: number;
  selected: boolean;
}

interface CheckoutItem {
  product: iProduct;
  quantity: number;
}

interface CheckoutPayload {
  items: CheckoutItem[];
  voucherCode: string;
  appliedVoucher: iVoucher | null;
  summary: {
    selectedCount: number;
    totalAmount: number;
    discountAmount: number;
    finalTotal: number;
  };
}

@Component({
  selector: 'app-cart-page',
  imports: [CommonModule, FormsModule, VoucherPopup, Modal],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
})
export class CartPage implements OnInit {
  products: iProduct[] = [];
  rooms: iRoom[] = [];
  cartItems: CartItem[] = [];
  selectAll: boolean = false;
  showDeleteModal: boolean = false;
  productToDelete: iProduct | null = null;
  deleteIndex: number = -1;
  vouchers: iVoucher[] = [];
  voucherCode: string = '';
  appliedVoucher: iVoucher | null = null;
  voucherError: string = '';
  isLoggedIn: boolean = false;

  constructor(
    private productService: Product,
    private roomService: Room,
    private voucherService: Voucher,
    private cartService: Cart,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('userId');

    // Load rooms first
    this.roomService.getRoomData().subscribe({
      next: (roomData) => {
        this.rooms = roomData;
      },
      error: (err) => {
        console.error('Error loading rooms:', err);
      }
    });

    // Load vouchers
    this.voucherService.getVoucherData().subscribe({
      next: (voucherData) => {
        this.vouchers = voucherData;
      },
      error: (err) => {
        console.error('Error loading vouchers:', err);
      }
    });

    // Load products and build cart from MongoDB
    this.cartService.loadCart();
    this.productService.getProductData().subscribe({
      next: (data) => {
        this.products = data;
        this.cartService.cart$.subscribe(storedItems => {
          this.cartItems = storedItems
            .map(item => {
              const product = this.products.find(p => p.Ma_san_pham === item.productId);
              if (!product) return null;
              return { product, quantity: item.quantity, selected: item.selected };
            })
            .filter(item => item !== null) as CartItem[];
          this.updateSelection();
        });
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }

  getRoomName(ma_loai_phong: string): string {
    const room = this.rooms.find(r => r.Ma_loai_phong === ma_loai_phong);
    return room ? room.Ten_loai_phong : '';
  }

  toggleSelectAll(): void {
    this.cartItems.forEach(item => item.selected = this.selectAll);
    this.syncCart();
  }

  updateSelection(): void {
    this.selectAll = this.cartItems.length > 0 && this.cartItems.every(item => item.selected);
    this.syncCart();
  }

  getSelectedCount(): number {
    return this.cartItems.filter(item => item.selected).length;
  }

  getSelectedTotal(): number {
    return this.cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.product.Gia_ban * item.quantity), 0);
  }

  getDiscountAmount(): number {
    if (!this.appliedVoucher) return 0;
    return (this.getSelectedTotal() * this.appliedVoucher.Phan_tram_giam) / 100;
  }

  getFinalTotal(): number {
    return this.getSelectedTotal() - this.getDiscountAmount();
  }

  applyVoucher(): void {
    if (!this.isLoggedIn) {
      return;
    }

    this.voucherError = '';

    if (!this.voucherCode.trim()) {
      this.voucherError = 'Vui lòng nhập mã khuyến mãi';
      return;
    }

    const voucher = this.vouchers.find(v =>
      v.Ma_so.toUpperCase() === this.voucherCode.toUpperCase() && v.Trang_thai === true
    );

    if (voucher) {
      // Check if voucher is valid (date range)
      const today = new Date();
      const startDate = new Date(voucher.Ngay_bat_dau);
      const endDate = new Date(voucher.Ngay_het_han);

      if (today < startDate || today > endDate) {
        this.voucherError = 'Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực';
        this.appliedVoucher = null;
        return;
      }

      if (voucher.So_luong_con_lai <= 0) {
        this.voucherError = 'Mã khuyến mãi đã hết lượt sử dụng';
        this.appliedVoucher = null;
        return;
      }

      this.appliedVoucher = voucher;
      this.voucherError = '';
    } else {
      this.voucherError = 'Mã khuyến mãi không hợp lệ';
      this.appliedVoucher = null;
    }
  }

  increaseQuantity(index: number): void {
    this.cartItems[index].quantity++;
    this.cartService.updateQuantity(
      this.cartItems[index].product.Ma_san_pham,
      this.cartItems[index].quantity
    );
  }

  decreaseQuantity(index: number): void {
    if (this.cartItems[index].quantity === 1) {
      this.openDeleteModal(index);
    } else {
      this.cartItems[index].quantity--;
      this.cartService.updateQuantity(
        this.cartItems[index].product.Ma_san_pham,
        this.cartItems[index].quantity
      );
    }
  }

  private syncCart(): void {
    const items: StoredCartItem[] = this.cartItems.map(ci => ({
      productId: ci.product.Ma_san_pham,
      quantity: ci.quantity,
      selected: ci.selected
    }));
    localStorage.setItem('cart_items', JSON.stringify(items));
  }

  openDeleteModal(index: number): void {
    this.productToDelete = this.cartItems[index].product;
    this.deleteIndex = index;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.productToDelete = null;
    this.deleteIndex = -1;
  }

  confirmDelete(): void {
    if (this.deleteIndex !== -1) {
      const removed = this.cartItems.splice(this.deleteIndex, 1);
      if (removed.length) {
        this.cartService.removeItem(removed[0].product.Ma_san_pham);
      }
      this.updateSelection();
    }
    this.closeDeleteModal();
  }

  proceedToCheckout(): void {
    const selectedItems = this.cartItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để mua hàng');
      return;
    }

    this.saveCheckoutItems(selectedItems);

    const isLoggedIn = !!localStorage.getItem('userId');
    if (!isLoggedIn) {
      this.openLoginAlertPopup();
      return;
    }

    // Navigate to payment page with selected items
    // You can implement this by storing selected items in a service or local storage
    this.router.navigate(['/payment-member']);
  }

  private saveCheckoutItems(selectedItems: CartItem[]): void {
    const checkoutItems: CheckoutItem[] = selectedItems.map(item => ({
      product: item.product,
      quantity: item.quantity,
    }));

    const checkoutPayload: CheckoutPayload = {
      items: checkoutItems,
      voucherCode: this.voucherCode,
      appliedVoucher: this.appliedVoucher,
      summary: {
        selectedCount: selectedItems.length,
        totalAmount: this.getSelectedTotal(),
        discountAmount: this.getDiscountAmount(),
        finalTotal: this.getFinalTotal(),
      },
    };

    localStorage.setItem('checkoutItems', JSON.stringify(checkoutPayload));
  }

  openLoginAlertPopup(): void {
    const modalEl = document.getElementById('loginAlertModal');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const existingModal = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);
      existingModal.show();
    }
  }

  closeVoucherPopup(): void {
    const modalEl = document.getElementById('voucherModal');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }

  handleVoucherSelected(voucher: iVoucher): void {
    // Chỉ điền mã vào input, chưa áp dụng
    this.voucherCode = voucher.Ma_so;
    this.voucherError = '';
    // Reset appliedVoucher để user phải bấm "Áp dụng"
    this.appliedVoucher = null;
  }

  clearVoucher(): void {
    this.voucherCode = '';
    this.appliedVoucher = null;
    this.voucherError = '';
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }
}

