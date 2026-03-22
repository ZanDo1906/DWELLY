import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Admin } from '../../../services/admin';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  resetForm: FormGroup;
  showNewPassword = false;
  showConfirmPassword = false;
  successMessage = '';
  errorMessage = '';
  adminId: string = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private route: ActivatedRoute,
    private adminService: Admin
  ) {
    this.resetForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  ngOnInit(): void {
    // Get adminId from query params
    this.route.queryParams.subscribe((params: any) => {
      this.adminId = params.adminId;
      if (!this.adminId) {
        this.errorMessage = 'Không tìm thấy thông tin. Vui lòng bắt đầu lại quy trình quên mật khẩu';
        setTimeout(() => {
          this.router.navigate(['/forgot-password']);
        }, 2000);
      }
    });

    // Real-time password validation listener
    this.resetForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.resetForm.updateValueAndValidity();
    });
  }

  get newPassword() {
    return this.resetForm.get('newPassword')!;
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword')!;
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (confirmPassword && newPassword !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
    } else if (group.get('confirmPassword')?.hasError('mismatch')) {
      group.get('confirmPassword')?.setErrors(null);
    }

    return null;
  }

  onSubmit() {
    if (this.resetForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      
      // Call API to reset password
      const newPassword = this.newPassword.value;
      
      this.adminService.resetPassword(this.adminId, newPassword).subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          this.successMessage = 'Đặt lại mật khẩu thành công!';
          
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.message || 'Đặt lại mật khẩu thất bại';
        }
      });
    }
  }
}
