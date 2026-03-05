import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Client } from '../../../../services/client';

@Component({
  selector: 'app-change-password-modal',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password-modal.html',
  styleUrl: './change-password-modal.css',
})
export class ChangePasswordModal implements OnInit {
  changePasswordForm!: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  formError = '';

  constructor(
    private fb: FormBuilder,
    private clientService: Client
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

    const userId = localStorage.getItem('userId') || '';
    if (!userId) {
      this.formError = 'Không xác định được tài khoản. Vui lòng đăng nhập lại.';
      return;
    }

    const currentPassword = this.changePasswordForm.get('currentPassword')?.value;
    const newPassword = this.changePasswordForm.get('newPassword')?.value;

    this.isSubmitting = true;

    this.clientService.changePassword(userId, { currentPassword, newPassword }).subscribe({
      next: (response) => {
        alert(response?.message || 'Đổi mật khẩu thành công');
        this.changePasswordForm.reset();
        this.isSubmitting = false;

        const modalEl = document.getElementById('changePasswordModal');
        const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
        modalInstance?.hide();
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Đổi mật khẩu thất bại';
        this.isSubmitting = false;
      }
    });
  }
}
