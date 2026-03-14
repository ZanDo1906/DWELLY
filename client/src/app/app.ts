import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Modal } from './components/modal/modal';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { LoginAlertPopup } from './pages/cart/login-alert-popup/login-alert-popup';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Modal, Login, Register, ForgotPassword, LoginAlertPopup],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');

  closeRegisterModal(): void {
    // Hook for modal close; add behavior if needed.
  }

  closeLoginModal(): void {
    // Hook for modal close; add behavior if needed.
  }

  closeLoginAlertPopup(): void {
    const modalEl = document.getElementById('loginAlertModal');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }
}
