import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  step: number = 1; // 1 = nhập email/sđt, 2 = nhập OTP
  emailOrPhone: string = '';
  maskedContact: string = ''; // Hiển thị ở bước 2
  touched: boolean = false;
  errorMessage: string = '';

  // OTP inputs (6 chữ số)
  otp: string[] = ['', '', '', '', '', ''];
  otpTouched: boolean = false;
  otpError: string = '';
  resendCountdown: number = 0;
  private resendTimer: any = null;

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
    if (this.step === 1) {
      this.touched = true;

      if (this.emailOrPhone.trim() === '') {
        this.errorMessage = 'Vui lòng nhập Email hoặc Số điện thoại';
        return;
      }

      if (!this.isValidEmail(this.emailOrPhone) && !this.isValidPhone(this.emailOrPhone)) {
        this.errorMessage = 'Email hoặc Số điện thoại không hợp lệ';
        return;
      }

      // Nếu hợp lệ - chuyển sang bước 2
      this.maskedContact = this.maskContact(this.emailOrPhone);
      console.log('Sending OTP to:', this.emailOrPhone);
      this.step = 2;
    } else if (this.step === 2) {
      this.submitOTP();
    }
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

  submitOTP(): void {
    this.otpTouched = true;

    // Kiểm tra có ô rỗng không
    if (this.otp.some(digit => !digit)) {
      this.otpError = 'Vui lòng nhập đầy đủ 6 chữ số';
      return;
    }

    const otpCode = this.otp.join('');
    console.log('OTP submitted:', otpCode);
    this.otpError = '';
    // Xử lý OTP - lát tiếp
  }

  resendOTP(): void {
    if (this.resendCountdown > 0) return; // Đang chờ, không cho gửi lại

    console.log('Resending OTP to:', this.emailOrPhone);
    this.otp = ['', '', '', '', '', ''];
    this.otpError = '';

    // Bắt đầu đếm ngược 60s
    this.resendCountdown = 60;
    this.resendTimer = setInterval(() => {
      this.resendCountdown--;

      if (this.resendCountdown <= 0) {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    }, 1000);

    // Focus vào ô đầu tiên
    setTimeout(() => {
      document.getElementById('otp-0')?.focus();
    }, 100);
  }
}
