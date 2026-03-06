import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
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

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['promotion']) {
      return;
    }

    if (!this.promotion) {
      this.formValue = this.createEmptyFormValue();
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
    };
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
