import { Component } from '@angular/core';
import { EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-qr-payment',
  imports: [],
  templateUrl: './qr-payment.html',
  styleUrl: './qr-payment.css',
})
export class QRPayment {

  remainingTime = '14:59';

  @Output() closeModal = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }
}
