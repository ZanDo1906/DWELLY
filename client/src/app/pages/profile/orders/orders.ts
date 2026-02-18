import { Component } from '@angular/core';
import { Modal } from '../../../components/modal/modal';
import { ReviewModa } from '../reviews/review-moda/review-moda';

@Component({
  selector: 'app-orders',
  imports: [Modal, ReviewModa],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  currentReviewOrder: any = null;
  reviewRating = 5;
  hoveringRating = 0;
  reviewImages: (string | File)[] = [];
  reviewContent = '';

  setReviewRating(rating: number): void {
    this.reviewRating = rating;
  }

  setHoveringRating(value: number): void {
    this.hoveringRating = value;
  }

  onReviewContentChange(value: string): void {
    this.reviewContent = value;
    if (this.reviewContent.length > 500) {
      this.reviewContent = this.reviewContent.substring(0, 500);
    }
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        this.reviewImages[index] = result;
      }
    };
    reader.readAsDataURL(file);
  }

  removeImage(index: number): void {
    this.reviewImages[index] = '';
  }

  submitReview(): void {
    if (!this.reviewContent.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    console.log('Submit review:', {
      rating: this.reviewRating,
      content: this.reviewContent,
    });

    this.closeReviewModal();
  }

  closeReviewModal(): void {
    const modalEl = document.getElementById('reviewModal');
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
    this.reviewRating = 5;
    this.hoveringRating = 0;
    this.reviewImages = [];
    this.reviewContent = '';
    this.currentReviewOrder = null;
  }
}
