import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})

export class Modal {
  @Input() modalId!: string;          // id để bootstrap target
  @Input() title?: string;            // tiêu đề modal
  @Output() close = new EventEmitter<void>();
  @Input() showHeader: boolean = true;
  
  closeModal() {
    const modalEl = document.getElementById(this.modalId);
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
      this.close.emit();
    }
  }
}
