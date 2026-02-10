import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { customValidator, passwordValidator } from '../../../validator/check.validator';
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

  submit() {
    if (this.regForm.invalid) {
      this.regForm.markAllAsTouched();
      return;
    }

    console.log(this.regForm.value);
  }
}
