import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface FaqFormData {
  id: string;
  questionCode: string;
  customerName: string;
  submittedAt: string;
  questionContent: string;
  statusLabel: string;
  draftReplyContent?: string;
  finalReplyContent?: string;
}

export interface FaqReplyPayload {
  id: string;
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
      const draftReply = this.faq?.draftReplyContent?.trim() || '';
      const finalReply = this.faq?.finalReplyContent?.trim() || '';
      this.replyContent = draftReply || finalReply;
    }
  }

  onSaveDraft(): void {
    if (!this.faq || this.isReplyLocked) {
      return;
    }

    this.saveDraft.emit({
      id: this.faq.id,
      replyContent: this.replyContent.trim(),
    });
  }

  onSendAnswer(): void {
    if (!this.faq || this.isReplyLocked) {
      return;
    }

    const trimmedReplyContent = this.replyContent.trim();
    if (!trimmedReplyContent) {
      return;
    }

    this.sendAnswer.emit({
      id: this.faq.id,
      replyContent: trimmedReplyContent,
    });
  }

  get statusClass(): string {
    if (!this.faq) {
      return 'status-pending';
    }

    return this.faq.statusLabel.toLowerCase().includes('chưa') ? 'status-pending' : 'status-done';
  }

  get isReplyLocked(): boolean {
    if (!this.faq) {
      return false;
    }

    return this.faq.statusLabel.trim().toLowerCase().includes('đã xử lý');
  }

}
