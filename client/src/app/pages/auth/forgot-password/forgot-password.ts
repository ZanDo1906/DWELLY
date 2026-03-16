import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Client } from '../../../services/client';
import { iClient } from '../../../interfaces/client';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  step: number = 1; // 1 = nhập email/sđt, 2 = nhập OTP, 3 = đặt lại mật khẩu
  emailOrPhone: string = '';
  maskedContact: string = ''; // Hiển thị ở bước 2
  touched: boolean = false;
  errorMessage: string = '';

  // OTP inputs (6 chữ số)
  otp: string[] = ['', '', '', '', '', ''];
  otpTouched: boolean = false;
  otpError: string = '';
  generatedOtp: string = '';
  resendCountdown: number = 0;
  private resendTimer: any = null;

  // Step 3: Reset password fields
  newPassword: string = '';
  confirmPassword: string = '';
  passwordTouched: boolean = false;
  passwordError: string = '';
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  matchedClient: iClient | null = null;

  constructor(private clientService: Client) { }

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
    if (this.errorMessage.trim() !== '') return true;
    if (this.emailOrPhone.trim() === '') return true;

    // Kiểm tra xem có phải email hoặc số điện thoại hợp lệ
    return !this.isValidEmail(this.emailOrPhone) && !this.isValidPhone(this.emailOrPhone);
  }

  onEmailOrPhoneChange(): void {
    this.errorMessage = '';
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

      this.verifyContactInDatabase();
    } else if (this.step === 2) {
      this.submitOTP();
    } else if (this.step === 3) {
      this.submitNewPassword();
    }
  }

  private verifyContactInDatabase(): void {
    const contact = this.emailOrPhone.trim();
    const isEmail = this.isValidEmail(contact);

    this.clientService.getClientData().subscribe({
      next: (clients) => {
        const matchedClient = clients.find(client => {
          if (isEmail) {
            return String(client.Email || '').trim().toLowerCase() === contact.toLowerCase();
          }
          return String(client.So_dien_thoai || '').trim() === contact;
        }) || null;

        if (!matchedClient) {
          this.errorMessage = 'Email hoặc số điện thoại không khớp';
          return;
        }

        this.matchedClient = matchedClient;
        const displayContact = isEmail
          ? String(matchedClient.Email || '').trim()
          : String(matchedClient.So_dien_thoai || '').trim();

        this.errorMessage = '';
        this.maskedContact = this.maskContact(displayContact);
        this.sendOtpNotification(displayContact);
        this.step = 2;
      },
      error: () => {
        this.errorMessage = 'Không thể kiểm tra dữ liệu tài khoản. Vui lòng thử lại';
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

  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val.length > 0) val = val.substring(val.length - 1);

    // Đồng bộ cả input DOM và array
    this.otp[index] = val;
    input.value = val;

    // Clear error ngay khi có thay đổi
    if (this.otpError) {
      this.otpError = '';
      this.otpTouched = false;
    }

    // Tự động chuyển sang ô kế tiếp
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }

    // Debug: Log cả array và DOM value
    console.log(`OTP[${index}] = "${val}", DOM value = "${input.value}", Array:`, this.otp);
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const currentInput = document.getElementById(`otp-${index}`) as HTMLInputElement;

      // Nếu ô hiện tại có giá trị, xóa nó
      if (this.otp[index] && this.otp[index] !== '') {
        this.otp[index] = '';
        if (currentInput) currentInput.value = '';
        console.log(`Cleared OTP[${index}], Array:`, this.otp);
        return;
      }

      // Nếu ô hiện tại trống và không phải ô đầu tiên, chuyển về ô trước
      if (index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null;
        if (prevInput) {
          this.otp[index - 1] = '';
          prevInput.value = '';
          prevInput.focus();
          console.log(`Moved to previous OTP[${index - 1}], Array:`, this.otp);
        }
      }
      return;
    }

    const allowControlKeys = ['Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!/^\d$/.test(event.key) && !allowControlKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  submitOTP(): void {
    this.otpTouched = true;

    console.log('Submit OTP - Current array state:', this.otp);

    // Check bằng helper method
    if (!this.isOtpComplete()) {
      // Tìm các ô trống
      const emptyIndexes = this.otp.map((val, idx) => (!val || val === '') ? idx : -1).filter(idx => idx >= 0);
      this.otpError = `Vui lòng nhập đầy đủ 6 chữ số (thiếu ô ${emptyIndexes.map(i => i + 1).join(', ')})`;
      console.log('Empty indexes found:', emptyIndexes);

      // Focus vào ô đầu tiên còn trống
      if (emptyIndexes.length > 0) {
        const firstEmptyInput = document.getElementById(`otp-${emptyIndexes[0]}`) as HTMLInputElement;
        firstEmptyInput?.focus();
      }
      return;
    }

    const otpCode = this.otp.join('');
    console.log('OTP submitted:', otpCode);
    this.otpError = '';

    if (!this.generatedOtp) {
      this.otpError = 'Mã OTP chưa được tạo. Vui lòng gửi lại mã';
      return;
    }

    if (otpCode === this.generatedOtp) {
      this.step = 3;
      console.log('OTP verified successfully, moving to step 3');
    } else {
      this.otpError = 'Mã OTP không chính xác. Vui lòng thử lại!';
      // Reset OTP inputs để nhập lại
      this.resetOtpInputs();
    }
  }

  resendOTP(): void {
    if (this.resendCountdown > 0) return; // Đang chờ, không cho gửi lại

    this.sendOtpNotification(this.emailOrPhone.trim());

    // Clear cả array và DOM inputs
    this.otp = ['', '', '', '', '', ''];
    this.otpError = '';
    this.otpTouched = false;

    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
      if (input) input.value = '';
    }

    // Focus vào ô đầu tiên
    setTimeout(() => {
      const firstInput = document.getElementById('otp-0') as HTMLInputElement | null;
      firstInput?.focus();
    }, 100);
  }

  private sendOtpNotification(contact: string): void {
    this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Sending OTP to:', contact);
    alert(`Mã OTP của bạn là: ${this.generatedOtp}`);
    this.startResendCountdown();
  }

  private startResendCountdown(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }

    this.resendCountdown = 60;
    this.resendTimer = setInterval(() => {
      this.resendCountdown--;

      if (this.resendCountdown <= 0) {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    }, 1000);
  }

  // Helper method to reset OTP inputs
  resetOtpInputs(): void {
    this.otp = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
      if (input) input.value = '';
    }
    console.log('OTP inputs reset, Array:', this.otp);

    // Focus về ô đầu tiên
    setTimeout(() => {
      const firstInput = document.getElementById('otp-0') as HTMLInputElement | null;
      firstInput?.focus();
    }, 100);
  }

  // Helper method để check OTP có đầy đủ không
  isOtpComplete(): boolean {
    const complete = this.otp.every(digit => digit && digit !== '' && digit !== null && digit !== undefined);
    console.log('OTP Complete check:', complete, 'Array:', this.otp);
    return complete;
  }

  // Step 3: New Password methods
  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Kiểm tra khi focus vào confirm password
  onConfirmPasswordFocus(): void {
    if (!this.newPassword || this.newPassword.trim() === '') {
      this.passwordError = 'Vui lòng nhập mật khẩu mới trước';
      return;
    }
    // Clear error nếu đã có new password
    if (this.passwordError === 'Vui lòng nhập mật khẩu mới trước') {
      this.passwordError = '';
    }
  }

  // Kiểm tra real-time khi nhập confirm password
  onConfirmPasswordInput(): void {
    // Nếu new password chưa có thì không check
    if (!this.newPassword || this.newPassword.trim() === '') {
      this.passwordError = 'Vui lòng nhập mật khẩu mới trước';
      return;
    }

    // Nếu confirm password trống thì clear error
    if (!this.confirmPassword || this.confirmPassword.trim() === '') {
      this.passwordError = '';
      return;
    }

    // Check khớp mật khẩu real-time
    if (this.newPassword === this.confirmPassword) {
      this.passwordError = '';
    } else {
      this.passwordError = 'Mat khau khong khop';
    }
  }

  // Clear error khi nhập new password
  onNewPasswordInput(): void {
    if (this.passwordError === 'Vui lòng nhập mật khẩu mới trước') {
      this.passwordError = '';
    }

    // Hiện cảnh báo ngay khi mật khẩu mới chưa đủ 6 ký tự.
    if (this.newPassword && this.newPassword.length < 6) {
      this.passwordError = 'Mật khẩu phải có ít nhất 6 ký tự';
      return;
    }

    if (this.passwordError === 'Mật khẩu phải có ít nhất 6 ký tự') {
      this.passwordError = '';
    }

    // Nếu có confirm password thì check lại
    if (this.confirmPassword && this.confirmPassword.trim() !== '') {
      this.onConfirmPasswordInput();
    }
  }

  validatePasswords(): boolean {
    if (!this.newPassword) {
      this.passwordError = 'Vui lòng nhập mật khẩu mới';
      return false;
    }

    if (this.newPassword.length < 6) {
      this.passwordError = 'Mật khẩu phải có ít nhất 6 ký tự';
      return false;
    }

    if (!this.confirmPassword) {
      this.passwordError = 'Vui lòng nhập lại mật khẩu';
      return false;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Mật khẩu không khớp';
      return false;
    }

    this.passwordError = '';
    return true;
  }

  submitNewPassword(): void {
    this.passwordTouched = true;

    if (!this.validatePasswords()) {
      return;
    }

    if (!this.matchedClient?.Ma_khach_hang) {
      alert('Không tìm thấy tài khoản cần cập nhật. Vui lòng thực hiện lại');
      return;
    }

    this.clientService.resetPassword(this.matchedClient.Ma_khach_hang, {
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        alert(`Đổi mật khẩu thành công cho ${this.emailOrPhone}`);
        // Reset toàn bộ form
        this.resetForm();
      },
      error: (error) => {
        const message = error?.error?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại';
        alert(message);
      }
    });
  }

  resetForm(): void {
    this.step = 1;
    this.emailOrPhone = '';
    this.maskedContact = '';
    this.touched = false;
    this.errorMessage = '';

    this.otp = ['', '', '', '', '', ''];
    this.otpTouched = false;
    this.otpError = '';
    this.generatedOtp = '';
    this.resendCountdown = 0;

    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordTouched = false;
    this.passwordError = '';
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.matchedClient = null;

    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
