import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Client } from '../../../services/client';
import { iClient } from '../../../interfaces/client';

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

    this.clientService.getClientData().subscribe({
      next: (clients: iClient[]) => {
        const matched = clients.find(
          (client) => client.Email.trim().toLowerCase() === email && client.Mat_khau === password
        );

        if (!matched) {
          this.loginError = 'Email hoặc mật khẩu không đúng.';
          return;
        }

        localStorage.setItem('userName', matched.Ho_va_ten);
        localStorage.setItem('userEmail', matched.Email);
        localStorage.setItem('userId', matched.Ma_khach_hang);

        this.closeLoginModal();
        window.dispatchEvent(new Event('user-login'));
      },
      error: () => {
        this.loginError = 'Không thể tải dữ liệu đăng nhập. Vui lòng thử lại.';
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
