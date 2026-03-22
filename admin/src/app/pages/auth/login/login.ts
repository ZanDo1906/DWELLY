import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Admin } from '../../../services/admin';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm!: any;
  loginError = '';
  showPassword = false;
  rememberMe = false;

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

  ngOnInit(): void {
    const savedEmail = localStorage.getItem('adminSavedEmail');
    const savedPassword = localStorage.getItem('adminSavedPassword');
    
    if (savedEmail && savedPassword) {
      this.loginForm.patchValue({
        email: savedEmail,
        password: savedPassword
      });
      this.rememberMe = true;
    }
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

    this.adminService.login({ email, password }).subscribe({
      next: (res: any) => {
        if (this.rememberMe) {
          localStorage.setItem('adminSavedEmail', email);
          localStorage.setItem('adminSavedPassword', password);
        } else {
          localStorage.removeItem('adminSavedEmail');
          localStorage.removeItem('adminSavedPassword');
        }
        const adminPayload = {
          Ma_quan_tri_vien: res?.admin?.maAdmin || '',
          Ho_ten: res?.admin?.fullName || 'Admin',
          Email: res?.admin?.email || '',
          id: res?.admin?.id || '',
          Anh_dai_dien: res?.admin?.avatar || '',
        };

        localStorage.setItem('token', res.token);
        localStorage.setItem('adminInfo', JSON.stringify(adminPayload));
        localStorage.setItem('admin', JSON.stringify(adminPayload));
        localStorage.setItem('adminName', adminPayload.Ho_ten);
        localStorage.setItem('adminEmail', adminPayload.Email);
        localStorage.setItem('adminAvatar', adminPayload.Anh_dai_dien || '');
        localStorage.setItem('adminId', adminPayload.Ma_quan_tri_vien || adminPayload.id);

        const lastRoute = localStorage.getItem('admin_last_route') || '';
        const fallbackRoute = '/profile';
        const targetRoute = this.isSafePostLoginRoute(lastRoute) ? lastRoute : fallbackRoute;

        this.router.navigateByUrl(targetRoute);
        window.dispatchEvent(new Event('admin-login'));
      },
      error: (err) => {
        this.loginError = err.error?.message || 'Đăng nhập thất bại';
      }
    });
  }

  private isSafePostLoginRoute(route: string): boolean {
    if (!route || !route.startsWith('/')) {
      return false;
    }

    const authRoutes = ['/', '/login', '/forgot-password', '/reset-password'];
    return !authRoutes.some((authRoute) => route.startsWith(authRoute));
  }
}
