import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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

  constructor(private fb: FormBuilder, private router: Router) {
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
      // TODO: Call API to reset password
      console.log('Reset password with:', this.newPassword.value);
      
      this.successMessage = 'Đặt lại mật khẩu thành công!';
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }
  }
}
