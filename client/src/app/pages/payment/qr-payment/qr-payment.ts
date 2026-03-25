import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../../../components/modal/modal';
import { Router } from '@angular/router';
import { Cart } from '../../../services/cart';

interface CheckoutItem {
  product: {
    Ma_san_pham: string;
  };
  quantity: number;
}

interface CheckoutPayload {
  items: CheckoutItem[];
}

@Component({
  selector: 'app-qr-payment',
  standalone: true,
  imports: [CommonModule, Modal],
  templateUrl: './qr-payment.html',
  styleUrl: './qr-payment.css',
})
export class QRPayment implements OnInit, OnDestroy {

  @Input() totalAmount: number = 0;
  @Input() orderCode: string = '';
  @Input() itemCount: number = 0;
  @Input() purchasedProductIds: string[] = [];

  showSuccessModal: boolean = false;
  paymentCompleted: boolean = false;
  remainingTime = '10:00';
  private countdown: any;
  private secondsLeft = 600; // 10 minutes in seconds
  confirmCountdown: number = 0;
  private confirmTimer: any;
  private hasClearedPurchasedItems = false;

  @Output() closeModal = new EventEmitter<void>();

  constructor(private router: Router, private cartService: Cart) { }

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdown) {
      clearInterval(this.countdown);
    }
    if (this.confirmTimer) {
      clearInterval(this.confirmTimer);
    }
  }

  startCountdown() {
    this.countdown = setInterval(() => {
      this.secondsLeft--;

      if (this.secondsLeft <= 0) {
        clearInterval(this.countdown);
        this.remainingTime = '00:00';
        // Có thể thêm logic khi hết thời gian ở đây
      } else {
        const minutes = Math.floor(this.secondsLeft / 60);
        const seconds = this.secondsLeft % 60;
        this.remainingTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  close() {
    this.closeModal.emit();
  }

  confirmPayment() {
    if (this.confirmCountdown > 0) return; // Prevent multiple clicks

    this.confirmCountdown = 3;
    this.confirmTimer = setInterval(() => {
      this.confirmCountdown--;

      if (this.confirmCountdown <= 0) {
        clearInterval(this.confirmTimer);
        this.confirmTimer = null;
        this.removePurchasedItemsFromCart();
        this.paymentCompleted = true;
        this.showSuccessModal = true;
        setTimeout(() => {
          const modalEl = document.getElementById('successModal');
          if (modalEl && (window as any).bootstrap?.Modal) {
            const modal = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
          }
        }, 0);
      }
    }, 1000);
  }

  closeSuccessModal() {
    const modalEl = document.getElementById('successModal');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    this.showSuccessModal = false;
    this.close();
  }

  hideSuccessModalOnly() {
    const modalEl = document.getElementById('successModal');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    this.showSuccessModal = false;
  }

  trackOrder(): void {
    const isLoggedIn = !!localStorage.getItem('userId');

    if (!isLoggedIn) {
      this.hideSuccessModalOnly();
      setTimeout(() => {
        const trackModalEl = document.getElementById('nonMemberTrackModal');
        if (trackModalEl && (window as any).bootstrap?.Modal) {
          const modal = (window as any).bootstrap.Modal.getOrCreateInstance(trackModalEl);
          modal.show();
        }
      }, 300);
      return;
    }

    const orderCode = (this.orderCode || '').trim();
    if (orderCode) {
      localStorage.setItem('orderId', orderCode);
    }

    this.closeSuccessModal();
    this.router.navigate(['/user-layout/order-detail']);
  }

  continueShopping(): void {
    this.closeSuccessModal();
    this.router.navigate(['/product-list']);
  }

  continueShoppingFromTrack(): void {
    const modalEl = document.getElementById('nonMemberTrackModal');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    this.close();
    this.router.navigate(['/product-list']);
  }

  private removePurchasedItemsFromCart(): void {
    if (this.hasClearedPurchasedItems) {
      return;
    }

    const rawCheckoutItems = localStorage.getItem('checkoutItems');
    if (!rawCheckoutItems) {
      this.hasClearedPurchasedItems = true;
      return;
    }

    let checkoutItems: CheckoutItem[] = [];

    try {
      const parsedData = JSON.parse(rawCheckoutItems) as CheckoutItem[] | CheckoutPayload;
      checkoutItems = Array.isArray(parsedData) ? parsedData : (parsedData.items || []);
    } catch (error) {
      console.error('Invalid checkoutItems data when clearing cart:', error);
      this.hasClearedPurchasedItems = true;
      return;
    }

    const idsFromInput = (this.purchasedProductIds || [])
      .filter((productId): productId is string => typeof productId === 'string' && productId.trim().length > 0)
      .map(productId => productId.trim());

    const idsFromCheckout = checkoutItems
      .map(item => item?.product?.Ma_san_pham)
      .filter((productId): productId is string => typeof productId === 'string' && productId.trim().length > 0)
      .map(productId => productId.trim());

    const purchasedProductIds = Array.from(new Set(
      idsFromInput.length > 0 ? idsFromInput : idsFromCheckout
    ));

    this.cartService.removeItems(purchasedProductIds);

    localStorage.removeItem('checkoutItems');
    this.hasClearedPurchasedItems = true;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }
}
