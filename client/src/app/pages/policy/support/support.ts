import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-support',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support implements OnInit {
  contactForm!: FormGroup;
  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required]],
      phone: ['', [Validators.pattern(/^\d{7,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      content: ['', [Validators.required]]
    });
  }

  get phone() {
  return this.contactForm.get('phone')!;
}
  get fullName() {
    return this.contactForm.get('fullName')!;
  }

  get email() {
    return this.contactForm.get('email')!;
  }

  get content() {
    return this.contactForm.get('content')!;
  }
  isFAQVisible: boolean = false;
  isOrderGuideVisible: boolean = false;
  isReturnGuideVisible: boolean = false;

  faqOpen: { [key: number]: boolean } = {};

  toggleFAQList() {
    this.isFAQVisible = !this.isFAQVisible;
  }

  toggleFAQ(id: number) {
    this.faqOpen[id] = !this.faqOpen[id];
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const data: any = {
      Ho_ten: this.contactForm.value.fullName,
      Email: this.contactForm.value.email || null,
      So_dien_thoai: this.contactForm.value.phone || null,
      Noi_dung: this.contactForm.value.content
    };

    this.http.post('http://localhost:3000/contacts', data)
      .subscribe({
        next: () => {
          alert('Gửi thành công! Dwelly sẽ phản hồi bạn sớm nhất.');
          this.contactForm.reset();
        },
        error: (err) => {
          console.error(err);
          const msg = err?.error?.error || 'Gửi thất bại';
          alert(msg);
        }
      });
  }
}
