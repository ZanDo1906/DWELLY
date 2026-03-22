import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Admin } from '../../../services/admin';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword implements OnInit {
  changePasswordForm!: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  formError = '';

  constructor(
    private fb: FormBuilder,
    private adminService: Admin
  ) {}

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword === confirmPassword ? null : { passwordMisMatch: true };
  }

  ngOnInit() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    this.formError = '';

    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const adminId = localStorage.getItem('adminId') || '';
    if (!adminId) {
      this.formError = 'Không xác định được tài khoản. Vui lòng đăng nhập lại.';
      return;
    }

    const currentPassword = this.changePasswordForm.get('currentPassword')?.value;
    const newPassword = this.changePasswordForm.get('newPassword')?.value;

    this.isSubmitting = true;

    this.adminService.changePassword(adminId, { currentPassword, newPassword }).subscribe({
      next: (response) => {
        alert(response?.message || 'Đổi mật khẩu thành công');
        this.changePasswordForm.reset();
        this.isSubmitting = false;

        const modalEl = document.getElementById('changePasswordModal');
        const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
        modalInstance?.hide();
      },
      error: (err) => {
        console.error('Change password error:', err);
        // Nếu backend trả về JSON
        if (err?.error?.message) {
          this.formError = err.error.message;
        }
        // Nếu backend trả về text (không phải JSON)
        else if (typeof err?.error === 'string') {
          try {
            const parsed = JSON.parse(err.error);
            this.formError = parsed.message || 'Đổi mật khẩu thất bại';
          } catch {
            this.formError = err.error;
          }
        }
        // Nếu có message ở HttpErrorResponse
        else if (err?.message) {
          this.formError = err.message;
        } else {
          this.formError = 'Đổi mật khẩu thất bại';
        }
        this.isSubmitting = false;
      }
    });
  }
}
