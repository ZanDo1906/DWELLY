import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-cancel-modal',
  imports: [CommonModule],
  templateUrl: './confirm-cancel-modal.html',
  styleUrl: './confirm-cancel-modal.css',
})
export class ConfirmCancelModal {
  @Input() modalId: string = 'confirmCancelModal';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
    this.closeModal();
  }

  onCancel() {
    this.cancelled.emit();
    this.closeModal();
  }

  closeModal() {
    const modalEl = document.getElementById(this.modalId);
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }
}
