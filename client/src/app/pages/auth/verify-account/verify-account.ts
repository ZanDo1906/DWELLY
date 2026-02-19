import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

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

  // LOGIC QUAN TRỌNG: Kiểm tra OTP và giả lập Đăng nhập
  verify() {
    const enteredOtp = this.otp.join('');
    const tempUserData = JSON.parse(localStorage.getItem('tempUser') || '{}');

    if (enteredOtp === tempUserData.otp) {
      // 1. Tạo đối tượng User mới (Giả lập dữ liệu thành công)
      const newUser = {
        Ma_khach_hang: 'C0' + (Math.floor(Math.random() * 90) + 10),
        Ho_va_ten: tempUserData.name,
        So_dien_thoai: tempUserData.phone,
        Email: tempUserData.email,
        Trang_thai: true,
        Ngay_tao: new Date().toISOString().split('T')[0],
        Ma_phan_hang: "DONG",
        Tong_diem: 0
      };

      // 2. LƯU TRẠNG THÁI ĐĂNG NHẬP (Để Header hiển thị tên)
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      localStorage.setItem('isLoggedIn', 'true');
      
      // 3. Xóa dữ liệu tạm OTP
      localStorage.removeItem('tempUser');

      alert('Chúc mừng! Tài khoản DWELLY của bạn đã được kích hoạt và đăng nhập thành công.');

      // 4. Đóng modal và tải lại trang để Header cập nhật giao diện mới
      this.closeAllModals();
      window.location.reload(); 

    } else {
      this.otpError = 'Mã xác thực không chính xác. Vui lòng thử lại!';
      // Reset lại các ô nhập để người dùng gõ lại từ đầu
      this.otp = ['', '', '', '', '', ''];
      document.getElementById('otp-0')?.focus();
    }
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