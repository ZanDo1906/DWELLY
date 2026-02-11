import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ConfirmCancelModal } from '../confirm-cancel-modal/confirm-cancel-modal';

@Component({
  selector: 'app-return-request-modal',
  imports: [CommonModule, ConfirmCancelModal],
  templateUrl: './return-request-modal.html',
  styleUrl: './return-request-modal.css',
})
export class ReturnRequestModal {
  @Input() modalId: string = 'returnRequestModal';

  handleConfirm() {
    console.log('Return request confirmed');
    // Close return request modal
    const modalEl = document.getElementById(this.modalId);
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }

  handleCancel() {
    console.log('Return request cancelled');
  }

  closeModal() {
    const modalEl = document.getElementById(this.modalId);
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }
}
