import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { customValidator, passwordValidator, phoneValidator } from '../../../validator/check.validator';
import { CommonModule } from '@angular/common';
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
  constructor(private fb: FormBuilder) {
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
            phoneValidator()
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

    const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();

    const tempUser = {
      name: this.regForm.value.name,
      phone: this.regForm.value.phone,
      email: this.regForm.value.email,
      password: this.regForm.value.password,
      otp: mockOTP
    };

    localStorage.setItem('tempUser', JSON.stringify(tempUser));

    alert(`[DWELLY] Mã xác thực của bạn là: ${mockOTP}`);

    this.switchToVerify();
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

