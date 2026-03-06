import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Client } from '../../../services/client';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm!: any;
  loginError = '';

  constructor(private fb: FormBuilder, private clientService: Client) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() {
    return this.loginForm.get('email')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  submit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginError = '';

    const email = String(this.loginForm.value.email || '').trim().toLowerCase();
    const password = String(this.loginForm.value.password || '').trim();

    this.clientService.login({ email, password }).subscribe({
      next: (res: any) => {
        this.clientService.saveLoginData(res);
        localStorage.setItem('token', res.token);
        localStorage.setItem('userName', res.user.fullName);
        localStorage.setItem('userEmail', res.user.email);
        localStorage.setItem('userId', res.user.customerCode || res.user.id);
        localStorage.removeItem('userAvatar');

        this.closeLoginModal();
        window.dispatchEvent(new Event('user-login'));
      },
      error: (err) => {
        this.loginError = err.error?.message || 'Đăng nhập thất bại';
      }
    });
  }

  private closeLoginModal(): void {
    const modalEl = document.getElementById('loginModal');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl) ||
        new (window as any).bootstrap.Modal(modalEl);
      modal.hide();
    }
  }
  // Khai báo biến để kiểm tra ẩn/hiện cho từng ô
showPassword = false;

togglePassword(): void {
  this.showPassword = !this.showPassword;

}
}
