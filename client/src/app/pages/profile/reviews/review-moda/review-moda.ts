import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-review-moda',
  imports: [CommonModule, FormsModule],
  templateUrl: './review-moda.html',
  styleUrl: './review-moda.css',
})
export class ReviewModa {
  @Input() imgSrc: string = '';
  @Input() productName: string = '';
  @Input() quantity: number = 0;
  @Input() reviewRating = 5;
  @Input() hoveringRating = 0;
  @Input() reviewImages: (string | File)[] = [];
  @Input() reviewContent = '';
  @Input() isSubmitting = false;

  @Output() reviewContentChange = new EventEmitter<string>();
  @Output() setReviewRating = new EventEmitter<number>();
  @Output() hoveringRatingChange = new EventEmitter<number>();
  @Output() imageSelected = new EventEmitter<{ event: Event; index: number }>();
  @Output() removeImage = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  onImageSelected(event: Event, index: number): void {
    this.imageSelected.emit({ event, index });
  }
}

