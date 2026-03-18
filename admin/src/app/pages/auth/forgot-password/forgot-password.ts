import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Admin } from '../../../services/admin';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  step: number = 1; // 1 = nhập email/sđt, 2 = nhập OTP
  emailOrPhone: string = '';
  maskedContact: string = ''; // Hiển thị ở bước 2
  adminId: string = ''; // Lưu ID admin từ step 1
  touched: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  // OTP inputs (6 chữ số)
  otp: string[] = ['', '', '', '', '', ''];
  otpTouched: boolean = false;
  otpError: string = '';
  resendCountdown: number = 0;
  private resendTimer: any = null;

  constructor(private router: Router, private adminService: Admin) {}

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    // Số điện thoại Việt Nam: 10 chữ số, bắt đầu bằng 0
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone.trim());
  }

  hasError(): boolean {
    if (!this.touched) return false;
    if (this.emailOrPhone.trim() === '') return true;

    // Kiểm tra xem có phải email hoặc số điện thoại hợp lệ
    return !this.isValidEmail(this.emailOrPhone) && !this.isValidPhone(this.emailOrPhone);
  }

  onSubmit(): void {
    if (this.isLoading) {
      return;
    }

    if (this.step === 1) {
      this.submitStep1();
    } else if (this.step === 2) {
      this.submitStep2();
    }
  }

  onEmailOrPhoneChange(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  submitStep1(): void {
    this.touched = true;
    this.errorMessage = '';

    if (this.emailOrPhone.trim() === '') {
      this.errorMessage = 'Vui lòng nhập Email hoặc Số điện thoại';
      return;
    }

    if (!this.isValidEmail(this.emailOrPhone) && !this.isValidPhone(this.emailOrPhone)) {
      this.errorMessage = 'Email hoặc Số điện thoại không hợp lệ';
      return;
    }

    // Call API to verify email/phone and send OTP
    this.isLoading = true;
    this.adminService.forgotPassword(this.emailOrPhone).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.adminId = response.adminId;
        this.maskedContact = response.maskedContact;
        this.errorMessage = '';
        this.step = 2;
        // Start resend countdown
        this.startResendCountdown();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Không thể gửi mã xác thực';
      }
    });
  }

  maskContact(contact: string): string {
    if (this.isValidEmail(contact)) {
      // Mask email: ab***@gmail.com
      const [name, domain] = contact.split('@');
      return name.substring(0, 2) + '***@' + domain;
    } else {
      // Mask phone: 0915****03
      return contact.substring(0, 4) + '****' + contact.substring(8);
    }
  }

  onOtpInput(index: number, event: any): void {
    const input = event.target;
    let value = input.value.replace(/[^0-9]/g, ''); // Chỉ giữ số

    // Nếu giá trị không thay đổi, bỏ qua (tránh trigger do focus)
    if (value === this.otp[index]) {
      return;
    }

    // Chỉ lấy 1 số cuối cùng nếu nhập nhiều
    if (value.length > 1) {
      value = value.slice(-1);
    }

    // Cập nhật giá trị
    this.otp[index] = value;
    input.value = value;

    // Clear error
    if (this.otpError) {
      this.otpError = '';
    }

    // Tự động chuyển sang ô tiếp theo CHỈ KHI có giá trị mới
    if (value && index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select(); // Select để dễ thay thế
        }
      }, 10);
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    // Backspace - quay lại ô trước
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }

  submitStep2(): void {
    this.otpTouched = true;

    // Kiểm tra có ô rỗng không
    if (this.otp.some(digit => !digit)) {
      this.otpError = 'Vui lòng nhập đầy đủ 6 chữ số';
      return;
    }

    const otpCode = this.otp.join('');
    
    // Call API to verify OTP
    this.isLoading = true;
    this.adminService.verifyOTP(this.adminId, otpCode).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.otpError = '';
        // Navigate to reset password with adminId
        this.router.navigate(['/reset-password'], {
          queryParams: { adminId: this.adminId }
        });
      },
      error: (err: any) => {
        this.isLoading = false;
        this.otpError = err?.error?.message || 'Xác thực OTP thất bại';
      }
    });
  }

  private startResendCountdown(): void {
    this.resendCountdown = 60;
    this.resendTimer = setInterval(() => {
      this.resendCountdown--;

      if (this.resendCountdown <= 0) {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    }, 1000);
  }

  resendOTP(): void {
    if (this.resendCountdown > 0) return; // Đang chờ, không cho gửi lại

    this.otp = ['', '', '', '', '', ''];
    this.otpError = '';
    this.isLoading = true;

    // Call API again to send OTP
    this.adminService.forgotPassword(this.emailOrPhone).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.startResendCountdown();
        // Focus vào ô đầu tiên
        setTimeout(() => {
          document.getElementById('otp-0')?.focus();
        }, 100);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.otpError = err?.error?.message || 'Không thể gửi lại mã';
      }
    });
  }
}
