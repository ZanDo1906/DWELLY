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

    this.adminService.login({ email, password }).subscribe({
      next: (res: any) => {
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
        
        this.router.navigate(['/dashboard']);
        window.dispatchEvent(new Event('admin-login'));
      },
      error: (err) => {
        this.loginError = err.error?.message || 'Đăng nhập thất bại';
      }
    });
  }
}
