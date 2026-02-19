import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { customValidator, passwordValidator } from '../../../validator/check.validator';
import { CommonModule } from '@angular/common';
import { Client } from '../../../services/client';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  regForm: any;
registerError = '';
  constructor(private fb: FormBuilder, private clientService: Client) {
    this.regForm = this.fb.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            customValidator(/^[a-zA-ZÀ-ỹ\s]+$/)
          ]
        ],
        phone: [
          '',
          [
            Validators.required,
            Validators.pattern(/^(03|05|07|08|09|01[2689])[0-9]{8}$/)
          ]
        ],
        email: [
          '',
          [Validators.required, Validators.email]
        ],
        password: [
          '',
          [Validators.required, Validators.minLength(6)]
        ],
        confirmPassword: [
          '',
          Validators.required
        ],
        accept: [false, Validators.requiredTrue]
      },
      {
        validators: passwordValidator
      }
    );
  }

  get name() {
    return this.regForm.get('name')!;
  }

  get phone() {
    return this.regForm.get('phone')!;
  }

  get email() {
    return this.regForm.get('email')!;
  }

  get password() {
    return this.regForm.get('password')!;
  }

  get confirmPassword() {
    return this.regForm.get('confirmPassword')!;
  }

  showPassword = false;
  showConfirmPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submit() {
  if (this.regForm.invalid) {
    this.regForm.markAllAsTouched();
    return;
  }

  const { email, phone, name, password } = this.regForm.value;

  // 1. Kiểm tra trùng lặp dữ liệu trong danh sách khách hàng
  this.clientService.getClientData().subscribe((clients: any[]) => {
    const isExisted = clients.some(c => c.Email === email || c.So_dien_thoai === phone);

    if (isExisted) {
      this.registerError = 'Email hoặc Số điện thoại này đã được sử dụng!';
      return;
    }

    // 2. Tạo mã OTP giả lập (6 số)
    const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 3. Lưu thông tin đăng ký tạm thời và mã OTP vào localStorage để VerifyComponent lấy
    const tempUser = { ...this.regForm.value, otp: mockOTP };
    localStorage.setItem('tempUser', JSON.stringify(tempUser));

    // 4. Giả lập gửi mã (Hiển thị alert để bạn biết mã mà test)
    alert(`[DWELLY] Mã xác thực của bạn là: ${mockOTP}`);
    console.log(`Đã gửi OTP ${mockOTP} tới ${email}`);

    // 5. Chuyển Modal
    this.switchToVerify();
  });
}

private switchToVerify() {
  const regModal = document.getElementById('registerModal');
  const bootstrapModalReg = (window as any).bootstrap.Modal.getInstance(regModal);
  bootstrapModalReg?.hide();

  setTimeout(() => {
    const verifyModal = document.getElementById('verifyModal');
    const bModalVerify = new (window as any).bootstrap.Modal(verifyModal);
    bModalVerify.show();
  }, 400);
}
}

