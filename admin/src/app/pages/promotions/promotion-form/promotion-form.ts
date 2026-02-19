import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-promotion-form',
  imports: [CommonModule, ConfirmDialogComponent],
  templateUrl: './promotion-form.html',
  styleUrl: './promotion-form.css',
})
export class PromotionForm {

  showConfirm = false;

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
