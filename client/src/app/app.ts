import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Modal } from './components/modal/modal';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Modal, Login, Register],
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
}
