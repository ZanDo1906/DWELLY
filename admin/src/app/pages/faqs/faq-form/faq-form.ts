import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface FaqFormData {
  id: number;
  questionCode: string;
  customerName: string;
  submittedAt: string;
  questionContent: string;
  statusLabel: string;
}

export interface FaqReplyPayload {
  id: number;
  replyContent: string;
}

@Component({
  selector: 'app-faq-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './faq-form.html',
  styleUrl: './faq-form.css',
})
export class FaqForm implements OnChanges {
  @Input() faq: FaqFormData | null = null;

  @Output() saveDraft = new EventEmitter<FaqReplyPayload>();
  @Output() sendAnswer = new EventEmitter<FaqReplyPayload>();

  replyContent = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['faq']) {
      this.replyContent = '';
    }
  }

  onSaveDraft(): void {
    if (!this.faq) {
      return;
    }

    this.saveDraft.emit({
      id: this.faq.id,
      replyContent: this.replyContent.trim(),
    });
  }

  onSendAnswer(): void {
    if (!this.faq) {
      return;
    }

    this.sendAnswer.emit({
      id: this.faq.id,
      replyContent: this.replyContent.trim(),
    });
  }

  get statusClass(): string {
    if (!this.faq) {
      return 'status-pending';
    }

    return this.faq.statusLabel.toLowerCase().includes('chưa') ? 'status-pending' : 'status-done';
  }

}
