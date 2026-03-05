import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Client } from '../../../../services/client';
import { phoneValidator } from '../../../../validator/check.validator';
import { HttpClient } from '@angular/common/http';

interface WardUnit {
  code: number;
  name: string;
}

interface DistrictUnit {
  code: number;
  name: string;
  wards: WardUnit[];
}

interface ProvinceUnit {
  code: number;
  name: string;
  districts: DistrictUnit[];
}

@Component({
  selector: 'app-add-address-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-address-modal.html',
  styleUrl: './add-address-modal.css',
})
export class AddAddressModal implements OnInit, OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() addressIndex: number | null = null;
  @Input() initialAddress: any = null;
  @Output() addressAdded = new EventEmitter<void>();
  addressForm!: FormGroup;
  isSubmitting = false;
  submitError = '';
  isLoadingLocations = false;

  provinces: ProvinceUnit[] = [];
  districts: DistrictUnit[] = [];
  wards: WardUnit[] = [];

  constructor(
    private fb: FormBuilder,
    private clientService: Client,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.addressForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, phoneValidator()]],
      province: ['', Validators.required],
      district: ['', Validators.required],
      ward: ['', Validators.required],
      address: ['', [Validators.required, Validators.minLength(5)]],
      isDefault: [false],
    });

    this.bindAdministrativeChanges();
    this.loadAdministrativeData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['initialAddress']) {
      this.applyFormModeData();
    }
  }

  onSubmit() {
    this.submitError = '';

    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const userId = localStorage.getItem('userId') || '';
    if (!userId) {
      this.submitError = 'Không xác định được tài khoản. Vui lòng đăng nhập lại.';
      return;
    }

    const payload = {
      FullName: this.addressForm.value.fullName,
      Phone: this.addressForm.value.phone,
      Province: this.getNameById(this.provinces, this.addressForm.value.province),
      District: this.getNameById(this.districts, this.addressForm.value.district),
      Ward: this.getNameById(this.wards, this.addressForm.value.ward),
      DetailAddress: this.addressForm.value.address,
      IsDefault: this.addressForm.value.isDefault,
    };

    this.isSubmitting = true;

    const request$ = this.mode === 'edit' && this.addressIndex !== null
      ? this.clientService.updateClientAddress(userId, this.addressIndex, payload)
      : this.clientService.addClientAddress(userId, payload);

    request$.subscribe({
      next: (response) => {
        alert(response?.message || (this.mode === 'edit' ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công'));
        this.addressForm.reset({ isDefault: false });
        this.isSubmitting = false;
        this.addressAdded.emit();

        const modalEl = document.getElementById('addAddressModal');
        const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
        modalInstance?.hide();
      },
      error: (err) => {
        this.submitError = err?.error?.message || err?.message || 'Thêm địa chỉ thất bại';
        this.isSubmitting = false;
      }
    });
  }

  clearField(fieldName: string): void {
    const field = this.addressForm.get(fieldName);
    if (!field) return;

    field.setValue('');
    field.markAsTouched();
    field.markAsDirty();
  }

  private applyFormModeData(): void {
    if (!this.addressForm) {
      return;
    }

    this.submitError = '';

    if (this.mode !== 'edit' || !this.initialAddress) {
      this.addressForm.reset({
        fullName: '',
        phone: '',
        province: '',
        district: '',
        ward: '',
        address: '',
        isDefault: false,
      });
      this.districts = [];
      this.wards = [];
      return;
    }

    const source = this.initialAddress;
    const provinceName = source.Province || source.province || '';
    const districtName = source.District || source.district || '';
    const wardName = source.Ward || source.ward || '';

    const selectedProvince = this.provinces.find((item) => this.normalizeText(item.name) === this.normalizeText(provinceName));
    this.districts = selectedProvince?.districts || [];

    const selectedDistrict = this.districts.find((item) => this.normalizeText(item.name) === this.normalizeText(districtName));
    this.wards = selectedDistrict?.wards || [];

    const selectedWard = this.wards.find((item) => this.normalizeText(item.name) === this.normalizeText(wardName));

    this.addressForm.patchValue({
      fullName: source.FullName || source.fullName || '',
      phone: source.Phone || source.phone || '',
      province: selectedProvince ? String(selectedProvince.code) : '',
      district: selectedDistrict ? String(selectedDistrict.code) : '',
      ward: selectedWard ? String(selectedWard.code) : '',
      address: source.DetailAddress || source.address || '',
      isDefault: Boolean(source.IsDefault),
    }, { emitEvent: false });
  }

  private bindAdministrativeChanges(): void {
    this.addressForm.get('province')?.valueChanges.subscribe((provinceCode) => {
      const selectedProvince = this.provinces.find((item) => String(item.code) === String(provinceCode));

      this.districts = selectedProvince?.districts || [];
      this.wards = [];

      this.addressForm.patchValue({ district: '', ward: '' }, { emitEvent: false });
    });

    this.addressForm.get('district')?.valueChanges.subscribe((districtCode) => {
      const selectedDistrict = this.districts.find((item) => String(item.code) === String(districtCode));

      this.wards = selectedDistrict?.wards || [];
      this.addressForm.patchValue({ ward: '' }, { emitEvent: false });
    });
  }

  private loadAdministrativeData(): void {
    this.isLoadingLocations = true;

    this.http.get<ProvinceUnit[]>('https://provinces.open-api.vn/api/?depth=3').subscribe({
      next: (response) => {
        this.provinces = [...response].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        this.applyFormModeData();
        this.isLoadingLocations = false;
      },
      error: () => {
        this.submitError = 'Không tải được danh mục Tỉnh/Quận/Phường. Vui lòng thử lại.';
        this.isLoadingLocations = false;
      }
    });
  }

  private getNameById(options: Array<{ code: number; name: string }>, code: string): string {
    return options.find((item) => String(item.code) === String(code))?.name || '';
  }

  private normalizeText(value: string): string {
    return String(value || '').trim().toLowerCase();
  }
}
