import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-support',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support implements OnInit {
  contactForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.contactForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      content: ['', [Validators.required]]
    });
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
    if (this.contactForm.valid) {
      alert('Gửi thành công! Dwelly sẽ phản hồi bạn sớm nhất.');
      console.log(this.contactForm.value);
      this.contactForm.reset();
    }
  }
}
