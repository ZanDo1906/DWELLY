import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-alert-popup',
  imports: [],
  templateUrl: './login-alert-popup.html',
  styleUrl: './login-alert-popup.css',
})
export class LoginAlertPopup {
  @Output() closeModal = new EventEmitter<void>();

  constructor(private router: Router) { }

  closeAlert(): void {
    this.closeModal.emit();
  }

  continueShopping(): void {
    this.closeModal.emit();
    this.router.navigate(['/payment-non-member']);
  }
}
