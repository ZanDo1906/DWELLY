import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../../../components/modal/modal';
import { Router } from '@angular/router';

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

  showSuccessModal: boolean = false;
  remainingTime = '10:00';
  private countdown: any;
  private secondsLeft = 600; // 10 minutes in seconds
  confirmCountdown: number = 0;
  private confirmTimer: any;

  @Output() closeModal = new EventEmitter<void>();

  constructor(private router: Router) { }

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

  continueShopping(): void {
    this.closeSuccessModal();
    this.router.navigate(['/']);
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }
}
