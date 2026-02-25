import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';

export interface PromotionFormData {
  promotionCode: string;
  code: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  minimumRank: string;
  remaining: number;
  description: string;
}

@Component({
  selector: 'app-promotion-form',
  imports: [CommonModule, ConfirmDialogComponent],
  templateUrl: './promotion-form.html',
  styleUrl: './promotion-form.css',
})
export class PromotionForm {
  @Input() promotion: PromotionFormData | null = null;

  formValue: PromotionFormData = {
    promotionCode: '',
    code: '',
    discountPercent: 0,
    startDate: '',
    endDate: '',
    minimumRank: '',
    remaining: 0,
    description: '',
  };

  showConfirm = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['promotion']) {
      return;
    }

    if (!this.promotion) {
      this.formValue = {
        promotionCode: '',
        code: '',
        discountPercent: 0,
        startDate: '',
        endDate: '',
        minimumRank: '',
        remaining: 0,
        description: '',
      };
      return;
    }

    this.formValue = {
      promotionCode: this.promotion.promotionCode,
      code: this.promotion.code,
      discountPercent: this.promotion.discountPercent,
      startDate: this.promotion.startDate,
      endDate: this.promotion.endDate,
      minimumRank: this.promotion.minimumRank,
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
  console.log('Đã xác nhận lưu');
  this.showConfirm = false;
}


}
