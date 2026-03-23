import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Voucher } from '../../../services/voucher';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';

export interface PromotionFormData {
  promotionCode: string;
  code: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  startDateRaw?: string;
  endDateRaw?: string;
  minimumRank: string;
  remaining: number;
  description: string;
  status: 'active' | 'paused';
}

@Component({
  selector: 'app-promotion-form',
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './promotion-form.html',
  styleUrl: './promotion-form.css',
})
export class PromotionForm {
  @Input() promotion: PromotionFormData | null = null;
  @Output() saveConfirmed = new EventEmitter<PromotionFormData>();

  constructor(private voucherService: Voucher) {}

  get isEditMode(): boolean {
    return !!this.promotion;
  }

  rankOptions: Array<{ label: string; value: string }> = [
    { label: 'Kim Cương', value: 'KIMCUONG' },
    { label: 'Vàng', value: 'VANG' },
    { label: 'Bạc', value: 'BAC' },
    { label: 'Đồng', value: 'DONG' },
  ];

  formValue: PromotionFormData = this.createEmptyFormValue();

  showConfirm = false;
  isRankOpen = false;

  get selectedRankLabel(): string {
    if (!this.formValue.minimumRank) {
      return 'Chọn phân hạng';
    }
    const option = this.rankOptions.find(o => o.value === this.formValue.minimumRank);
    return option ? option.label : 'Chọn phân hạng';
  }

  toggleRankDropdown(event: Event): void {
    event.stopPropagation();
    this.isRankOpen = !this.isRankOpen;
  }

  selectRank(value: string): void {
    this.formValue.minimumRank = value;
    this.isRankOpen = false;
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.isRankOpen = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['promotion']) {
      return;
    }

    if (!this.promotion) {
      this.formValue = this.createEmptyFormValue();
      this.voucherService.getNextPromotionCode().subscribe({
        next: (res) => {
          this.formValue.promotionCode = res.nextCode;
        },
        error: (err) => {
          console.error('Lỗi khi lấy mã khuyến mãi tự động:', err);
        }
      });
      return;
    }

    const normalizedStartDate = this.normalizeDateInput(this.promotion.startDateRaw || this.promotion.startDate);
    const normalizedEndDate = this.normalizeDateInput(this.promotion.endDateRaw || this.promotion.endDate);

    this.formValue = {
      promotionCode: this.promotion.promotionCode,
      code: this.promotion.code,
      discountPercent: this.promotion.discountPercent,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      minimumRank: this.normalizeRankCode(this.promotion.minimumRank),
      remaining: this.promotion.remaining,
      description: this.promotion.description,
      status: this.promotion.status,
    };
  }

  toggleVoucherStatus(): void {
    this.formValue.status = this.formValue.status === 'active' ? 'paused' : 'active';
  }

  openConfirm() {
    this.showConfirm = true;
  }

  closeConfirm() {
    this.showConfirm = false;
  }

  confirmSave() {
    this.saveConfirmed.emit({ ...this.formValue });
    this.showConfirm = false;
  }

  private createEmptyFormValue(): PromotionFormData {
    return {
      promotionCode: '',
      code: '',
      discountPercent: 0,
      startDate: '',
      endDate: '',
      minimumRank: '',
      remaining: 0,
      description: '',
      status: 'active',
    };
  }

  private normalizeDateInput(value: string): string {
    if (!value) {
      return '';
    }

    // Accept both yyyy-mm-dd and dd-mm-yyyy, always return yyyy-mm-dd for date input.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
    if (!match) {
      return '';
    }

    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }

  private normalizeRankCode(value: string): string {
    const normalized = (value || '').trim().toUpperCase();
    if (this.rankOptions.some((option) => option.value === normalized)) {
      return normalized;
    }
    return '';
  }


}
