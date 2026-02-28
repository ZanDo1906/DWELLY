import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../../../components/modal/modal';
import { ReturnRequestModal } from './return-request-modal/return-request-modal';

declare var bootstrap: any;

@Component({
  selector: 'app-returns',
  imports: [CommonModule, Modal, ReturnRequestModal],
  templateUrl: './returns.html',
  styleUrl: './returns.css',
})
export class Returns {
  // Return Request Modal
  currentProduct: any = null;
  orderInfo: any = null;
  returnReason = '';
  returnDescription = '';
  returnImages: (string | File)[] = [];

  openReturnModal(product: any, order: any): void {
    this.currentProduct = product;
    this.orderInfo = order;
    this.returnReason = '';
    this.returnDescription = '';
    this.returnImages = [];
    
    // Open modal using Bootstrap
    setTimeout(() => {
      const modalEl = document.getElementById('returnRequestModal');
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 100);
  }

  handleReturnReasonChange(reason: string): void {
    this.returnReason = reason;
  }

  handleReturnDescriptionChange(description: string): void {
    this.returnDescription = description;
  }

  handleImageSelected(data: { event: Event; index: number }): void {
    const input = data.event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.returnImages[data.index] = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  handleRemoveImage(index: number): void {
    this.returnImages[index] = '';
  }

  handleCancelReturn(): void {
    // Close modal
    const modalEl = document.getElementById('returnRequestModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    this.currentProduct = null;
    this.orderInfo = null;
  }

  handleSubmitReturn(): void {
    console.log('Submit return request:', {
      product: this.currentProduct,
      order: this.orderInfo,
      reason: this.returnReason,
      description: this.returnDescription,
      images: this.returnImages
    });
    // TODO: Call API to submit return request
    this.handleCancelReturn();
  }
}
