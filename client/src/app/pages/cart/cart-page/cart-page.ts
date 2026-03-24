import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../../services/product';
import { iProduct } from '../../../interfaces/product';
import { Room } from '../../../services/room';
import { iRoom } from '../../../interfaces/room';
import { Voucher } from '../../../services/voucher';
import { iVoucher } from '../../../interfaces/voucher';
import { VoucherPopup } from '../voucher-popup/voucher-popup';
import { Modal } from '../../../components/modal/modal';
import { Cart, CartItem as StoredCartItem } from '../../../services/cart';
import { Client } from '../../../services/client';

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
  imports: [CommonModule, FormsModule, VoucherPopup, Modal, RouterLink],
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
  currentUserRankCode: string = '';

  private readonly conceptDiscountPercent = 10;

  private readonly rankOrder: Record<string, number> = {
    DONG: 1,
    PH01: 1,
    BAC: 2,
    PH02: 2,
    VANG: 3,
    PH03: 3,
    KIMCUONG: 4,
    PH04: 4,
  };

  constructor(
    private productService: Product,
    private roomService: Room,
    private voucherService: Voucher,
    private cartService: Cart,
    private router: Router,
    private clientService: Client
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('userId');
    this.currentUserRankCode = this.getCurrentUserRankCode();
    this.syncCurrentUserRankFromClient();

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
    return this.cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + item.quantity, 0);
  }

  getFinalPrice(product: iProduct): number {
    if (!product?.Gia_ban) return 0;
    const discount = product.Phan_tram_giam_gia ?? 0;
    return product.Gia_ban * (1 - discount / 100);
  }

  getSelectedTotal(): number {
    return this.cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (this.getFinalPrice(item.product) * item.quantity), 0);
  }

  getDiscountAmount(): number {
    return this.getConceptDiscountAmount() + this.getVoucherDiscountAmount();
  }

  getProductImage(product: iProduct): string {
    const firstImage = product.Hinh_anh?.[0] || '';
    return this.productService.getImgUrl(firstImage);
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

      if (!this.canUseVoucherByRank(voucher)) {
        this.voucherError = 'Hạng thành viên của bạn chưa đủ điều kiện áp dụng mã này';
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
        selectedCount: selectedItems.reduce((total, item) => total + item.quantity, 0),
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
    // Chọn từ popup chỉ điền mã; cần bấm "Áp dụng" để kích hoạt giảm giá.
    this.voucherCode = voucher.Ma_so;
    this.voucherError = '';
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

  getConceptDiscountAmount(): number {
    const conceptSummary = this.getConceptSummary(
      this.cartItems.filter(item => item.selected)
    );

    return (conceptSummary.eligibleSubtotal * this.conceptDiscountPercent) / 100;
  }

  getCompletedConceptSetCount(): number {
    return this.getConceptSummary(this.cartItems.filter(item => item.selected)).completedSetCount;
  }

  getVoucherDiscountAmount(): number {
    if (!this.appliedVoucher) return 0;
    return (this.getSelectedTotal() * this.appliedVoucher.Phan_tram_giam) / 100;
  }

  private getConceptSummary(items: CartItem[]): { completedSetCount: number; eligibleSubtotal: number } {
    if (!this.products.length) {
      return { completedSetCount: 0, eligibleSubtotal: 0 };
    }

    const requiredProductsByConcept = new Map<string, Set<string>>();
    for (const product of this.products) {
      if (product.Trang_thai === false) {
        continue;
      }

      const conceptCode = product.Ma_khong_gian;
      if (!conceptCode) {
        continue;
      }

      if (!requiredProductsByConcept.has(conceptCode)) {
        requiredProductsByConcept.set(conceptCode, new Set<string>());
      }
      requiredProductsByConcept.get(conceptCode)!.add(product.Ma_san_pham);
    }

    const purchasedProductsByConcept = new Map<string, Map<string, { quantity: number; price: number }>>();
    for (const item of items) {
      if (item.quantity <= 0) {
        continue;
      }

      const conceptCode = item.product?.Ma_khong_gian;
      const productCode = item.product?.Ma_san_pham;
      if (!conceptCode || !productCode) {
        continue;
      }

      if (!purchasedProductsByConcept.has(conceptCode)) {
        purchasedProductsByConcept.set(conceptCode, new Map<string, { quantity: number; price: number }>());
      }

      const conceptItems = purchasedProductsByConcept.get(conceptCode)!;
      const current = conceptItems.get(productCode) || { quantity: 0, price: item.product.Gia_ban };
      current.quantity += item.quantity;
      current.price = item.product.Gia_ban;
      conceptItems.set(productCode, current);
    }

    let completedSetCount = 0;
    let eligibleSubtotal = 0;

    requiredProductsByConcept.forEach((requiredProducts, conceptCode) => {
      if (requiredProducts.size === 0) {
        return;
      }

      const purchasedProducts = purchasedProductsByConcept.get(conceptCode);
      if (!purchasedProducts || purchasedProducts.size < requiredProducts.size) {
        return;
      }

      let conceptSetCount = Number.MAX_SAFE_INTEGER;
      let conceptSingleSetSubtotal = 0;

      requiredProducts.forEach((productCode) => {
        const purchased = purchasedProducts.get(productCode);
        if (!purchased) {
          conceptSetCount = 0;
          return;
        }

        conceptSetCount = Math.min(conceptSetCount, purchased.quantity);
        conceptSingleSetSubtotal += purchased.price;
      });

      if (conceptSetCount > 0 && conceptSetCount !== Number.MAX_SAFE_INTEGER) {
        completedSetCount += conceptSetCount;
        eligibleSubtotal += conceptSingleSetSubtotal * conceptSetCount;
      }
    });

    return { completedSetCount, eligibleSubtotal };
  }

  private canUseVoucherByRank(voucher: iVoucher): boolean {
    const requiredRankLevel = this.getRankLevel(voucher.Ma_phan_hang_toi_thieu);
    if (requiredRankLevel === 0) {
      return true;
    }

    const userRankLevel = this.getRankLevel(this.currentUserRankCode);
    return userRankLevel >= requiredRankLevel;
  }

  private getCurrentUserRankCode(): string {
    try {
      const userRaw = localStorage.getItem('current_user');
      if (!userRaw) return '';

      const user = JSON.parse(userRaw);
      return user?.Ma_phan_hang || '';
    } catch {
      return '';
    }
  }

  private syncCurrentUserRankFromClient(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return;
    }

    this.clientService.getClientById(userId).subscribe({
      next: (client) => {
        this.currentUserRankCode = client?.Ma_phan_hang || this.currentUserRankCode;
      },
      error: () => {
        // Keep fallback rank from localStorage when client API is unavailable.
      }
    });
  }

  private getRankLevel(rankCode: string): number {
    const normalized = this.normalizeRank(rankCode);
    return this.rankOrder[normalized] || 0;
  }

  private normalizeRank(value: string): string {
    return (value || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[\s_-]+/g, '');
  }
}

