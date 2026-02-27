import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Client } from '../../../services/client';

@Component({
  selector: 'app-verify-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-account.html',
  styleUrl: './verify-account.css',
})
export class VerifyAccount implements OnInit {
  otp: string[] = ['', '', '', '', '', ''];
  otpError = '';
  displayPhone: string = '';
  resendCountdown: number = 0;
  timer: any;

  constructor(private clientService: Client) {}

  ngOnInit() {
    const tempUserData = JSON.parse(localStorage.getItem('tempUser') || '{}');
    if (tempUserData && tempUserData.phone) {
      this.displayPhone = this.maskPhone(tempUserData.phone);
    }
  }

  maskPhone(phone: string): string {
    if (phone.length < 10) return phone;
    return phone.substring(0, 4) + '****' + phone.substring(8);
  }

  closeAllModals() {
    const modalEl = document.getElementById('verifyModal');
    const modalInstance = (window as any).bootstrap.Modal.getInstance(modalEl);
    modalInstance?.hide();
  }

  verify() {
    const enteredOtp = this.otp.join('');
    const tempUser = JSON.parse(localStorage.getItem('tempUser') || '{}');

    if (enteredOtp !== tempUser.otp) {
      this.otpError = 'Mã xác thực không chính xác!';
      this.otp = ['', '', '', '', '', ''];
      return;
    }

    this.clientService.register({
      name: tempUser.name,
      phone: tempUser.phone,
      email: tempUser.email,
      password: tempUser.password
    }).subscribe({
      next: () => {
        localStorage.removeItem('tempUser');

        alert('Đăng ký thành công! Vui lòng đăng nhập.');

        this.closeAllModals();

        setTimeout(() => {
          const loginModal = document.getElementById('loginModal');
          const bModalLogin = new (window as any).bootstrap.Modal(loginModal);
          bModalLogin.show();
        }, 400);
      },
      error: (err) => {
        this.otpError = err.error?.message || 'Đăng ký thất bại';
      }
    });
  }

  onOtpInput(index: number, event: any) {
    const input = event.target;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val.length > 0) val = val.substring(val.length - 1);

    this.otp[index] = val;
    input.value = val;

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }

  onOtpKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }

  resendOTP() {
    if (this.resendCountdown > 0) return;

    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const tempUser = JSON.parse(localStorage.getItem('tempUser') || '{}');
    tempUser.otp = newOTP;
    localStorage.setItem('tempUser', JSON.stringify(tempUser));
    
    alert(`[DWELLY] Mã mới của bạn là: ${newOTP}`);

    this.resendCountdown = 60;
    this.timer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) clearInterval(this.timer);
    }, 1000);
  }
}