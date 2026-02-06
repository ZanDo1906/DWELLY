import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { Modal } from './components/modal/modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Register, Login, Modal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');
  closeRegisterModal() {
  const modalEl = document.getElementById('registerModal');
  if (modalEl) {
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
  }
}
    closeLoginModal() {
  const modalEl = document.getElementById('loginModal');
  if (modalEl) {
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
  }
}
  }
