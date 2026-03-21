import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Admin } from '../../../services/admin';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm!: any;
  loginError = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private adminService: Admin
  ) {
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

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginError = '';

    const email = String(this.loginForm.value.email || '').trim().toLowerCase();
    const password = String(this.loginForm.value.password || '').trim();

    console.log('Login form values:', { email, password });

    this.adminService.login({ email, password }).subscribe({
      next: (res: any) => {
        console.log('Login success:', res);
        this.adminService.saveLoginData(res);
        this.router.navigate(['/dashboard']);
        window.dispatchEvent(new Event('admin-login'));
      },
      error: (err: any) => {
        console.error('Login error caught in component:', err);
        // Check error.message first (from backend response), then fallbacks
        if (err?.error?.message) {
          this.loginError = err.error.message;
        } else if (err?.message && !err?.message?.includes('Http failure')) {
          this.loginError = err.message;
        } else if (err?.statusText) {
          this.loginError = `${err.statusText}: Vui lòng thử lại`;
        } else {
          this.loginError = 'Đăng nhập thất bại';
        }
      }
    });
  }
}
