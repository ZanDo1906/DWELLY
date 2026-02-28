import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-return-request-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './return-request-modal.html',
  styleUrl: './return-request-modal.css',
})
export class ReturnRequestModal {
  @Input() currentProduct: any = null;
  @Input() orderInfo: any = null;
  @Input() returnReason = '';
  @Input() returnImages: (string | File)[] = [];
  @Input() returnDescription = '';

  @Output() returnReasonChange = new EventEmitter<string>();
  @Output() returnDescriptionChange = new EventEmitter<string>();
  @Output() imageSelected = new EventEmitter<{ event: Event; index: number }>();
  @Output() removeImage = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  onImageSelected(event: Event, index: number): void {
    this.imageSelected.emit({ event, index });
  }
}
