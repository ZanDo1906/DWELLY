import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-address-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-address-modal.html',
  styleUrl: './add-address-modal.css',
})
export class AddAddressModal implements OnInit {
  addressForm!: FormGroup;

  provinces = [
    { id: '01', name: 'Thành phố Hồ Chí Minh' },
    { id: '02', name: 'Hà Nội' },
    { id: '03', name: 'Đà Nẵng' },
  ];

  districts = [
    { id: '01', name: 'Quận 1' },
    { id: '02', name: 'Quận 2' },
    { id: '03', name: 'Quận 3' },
  ];

  wards = [
    { id: '01', name: 'Phường 1' },
    { id: '02', name: 'Phường 2' },
    { id: '03', name: 'Phường 3' },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.addressForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      province: ['', Validators.required],
      district: ['', Validators.required],
      ward: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      isDefault: [false],
    });
  }

  onSubmit() {
    if (this.addressForm.valid) {
      console.log(this.addressForm.value);
    }
  }
}
