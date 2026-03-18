import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { customValidator, passwordValidator, phoneValidator } from '../../../validator/check.validator';
import { CommonModule } from '@angular/common';
import { Client } from '../../../services/client';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements AfterViewInit, OnDestroy {

  regForm: any;
  registerError = '';
  isCheckingAvailability = false;
  private registerModalEl: HTMLElement | null = null;
  private availabilityCheckSub?: Subscription;
  private readonly handleRegisterModalHidden = (_event: Event): void => {
    this.resetFormState();
  };

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
    if (this.isCheckingAvailability) {
      return;
    }

    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      return;
    }

    this.registerError = '';
    this.isCheckingAvailability = true;

    const normalizedEmail = String(this.regForm.value.email || '').trim().toLowerCase();
    const normalizedPhone = String(this.regForm.value.phone || '').trim();

    this.availabilityCheckSub?.unsubscribe();
    this.availabilityCheckSub = this.clientService.checkRegisterAvailability({
      email: normalizedEmail,
      phone: normalizedPhone
    }).subscribe({
      next: () => {
        const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();

        const tempUser = {
          name: this.regForm.value.name,
          phone: normalizedPhone,
          email: normalizedEmail,
          password: this.regForm.value.password,
          otp: mockOTP
        };

        localStorage.setItem('tempUser', JSON.stringify(tempUser));

        alert(`[DWELLY] Mã xác thực của bạn là: ${mockOTP}`);

        this.availabilityCheckSub = undefined;
        this.isCheckingAvailability = false;
        this.switchToVerify();
      },
      error: (err) => {
        this.availabilityCheckSub = undefined;
        this.isCheckingAvailability = false;
        this.registerError = this.mapAvailabilityErrorMessage(err);
      }
    });
  }

  private mapAvailabilityErrorMessage(err: any): string {
    const exists = err?.error?.exists;

    if (exists?.email && exists?.phone) {
      return 'Email và Số điện thoại đều đã tồn tại';
    }

    if (exists?.email) {
      return 'Email đã tồn tại';
    }

    if (exists?.phone) {
      return 'Số điện thoại đã tồn tại';
    }

    return err?.error?.message || 'Không thể kiểm tra thông tin đăng ký. Vui lòng thử lại.';
  }

  ngAfterViewInit(): void {
    this.registerModalEl = document.getElementById('registerModal');
    this.registerModalEl?.addEventListener('hidden.bs.modal', this.handleRegisterModalHidden);
  }

  ngOnDestroy(): void {
    this.availabilityCheckSub?.unsubscribe();
    this.registerModalEl?.removeEventListener('hidden.bs.modal', this.handleRegisterModalHidden);
  }

  private resetFormState(): void {
    this.availabilityCheckSub?.unsubscribe();
    this.availabilityCheckSub = undefined;

    this.regForm.reset({
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      accept: false
    });

    this.registerError = '';
    this.isCheckingAvailability = false;
    this.showPassword = false;
    this.showConfirmPassword = false;
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

