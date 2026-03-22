import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Table } from '../../../components/table/table';
import { Contact } from '../../../services/contact';
import { Modal } from '../../../components/modal/modal';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';
import { FaqForm, FaqFormData, FaqReplyPayload } from '../faq-form/faq-form';

interface FaqItem {
  id: string;
  questionCode: string;
  customerName: string;
  submittedAt: string;
  submittedTimestamp: number;
  questionContent: string;
  status: 'unprocessed' | 'draft' | 'processed';
  statusLabel: string;
  handler: string;
  draftReplyContent?: string;
  finalReplyContent?: string;
}

@Component({
  selector: 'app-faq-list',
  imports: [CommonModule, Table, Modal, FaqForm, ConfirmDialogComponent],
  templateUrl: './faq-list.html',
  styleUrl: './faq-list.css',
})
export class FaqList implements OnInit {
  pageSize = 10;
  currentPage = 1;

  searchText = '';
  selectedStatus: 'all' | 'unprocessed' | 'draft' | 'processed' = 'all';
  isStatusOpen = false;
  sortType: 'az' | 'newest' | 'oldest' | null = null;

  statusOptions: Array<{ label: string; value: 'all' | 'unprocessed' | 'draft' | 'processed' }> = [
    { label: 'Tất cả trạng thái', value: 'all' },
    { label: 'Chưa xử lý', value: 'unprocessed' },
    { label: 'Đang lưu nháp', value: 'draft' },
    { label: 'Đã xử lý', value: 'processed' },
  ];

  selectedIds = new Set<string>();
  selectedFaq: FaqFormData | null = null;
  showDeleteConfirm = false;
  deleteConfirmMessage = '';
  pendingDeleteIds: string[] = [];

  faqs: FaqItem[] = [];

  constructor(private contactService: Contact) { }

  ngOnInit(): void {
    this.loadFaqs();
  }

  private loadFaqs(): void {
    this.contactService.getContactData().subscribe({
      next: (contacts) => {
        this.faqs = contacts.map((contact) => {
          const date = new Date(contact.Ngay_gui);
          return {
            id: contact._id ?? contact.Ma_lien_he,
            questionCode: contact.Ma_lien_he,
            customerName: contact.Ho_ten,
            submittedAt: this.formatDate(date),
            submittedTimestamp: date.getTime(),
            questionContent: contact.Noi_dung,
            status: this.normalizeStatus(contact.Trang_thai),
            statusLabel: contact.Trang_thai,
            handler: contact.Ma_quan_tri_vien_xu_ly || '-',
            draftReplyContent: contact.Noi_dung_tra_loi_nhap || '',
            finalReplyContent: contact.Noi_dung_tra_loi || '',
          };
        });
      },
      error: () => {
        this.faqs = [];
      },
    });
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get filteredFaqs(): FaqItem[] {
    const keyword = this.searchText.trim().toLowerCase();

    return this.faqs.filter((faq) => {
      const matchesKeyword =
        !keyword ||
        faq.questionCode.toLowerCase().includes(keyword) ||
        faq.customerName.toLowerCase().includes(keyword) ||
        faq.questionContent.toLowerCase().includes(keyword) ||
        faq.handler.toLowerCase().includes(keyword);

      const matchesStatus = this.selectedStatus === 'all' || faq.status === this.selectedStatus;
      return matchesKeyword && matchesStatus;
    });
  }

  get sortedFaqs(): FaqItem[] {
    const list = [...this.filteredFaqs];

    if (this.sortType === 'az') {
      return list.sort((a, b) => a.questionCode.localeCompare(b.questionCode));
    }

    if (this.sortType === 'newest') {
      return list.sort((a, b) => b.submittedTimestamp - a.submittedTimestamp);
    }

    if (this.sortType === 'oldest') {
      return list.sort((a, b) => a.submittedTimestamp - b.submittedTimestamp);
    }

    return list;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedFaqs.length / this.pageSize));
  }

  get pagedFaqs(): FaqItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.sortedFaqs.slice(startIndex, startIndex + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get isPageFullySelected(): boolean {
    return this.pagedFaqs.length > 0 && this.pagedFaqs.every((faq) => this.selectedIds.has(faq.id));
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchText = target.value;
    this.currentPage = 1;
  }

  toggleStatusDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isStatusOpen = !this.isStatusOpen;
  }

  selectStatus(status: 'all' | 'unprocessed' | 'draft' | 'processed'): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.isStatusOpen = false;
  }

  get selectedStatusLabel(): string {
    return this.statusOptions.find((option) => option.value === this.selectedStatus)?.label || 'Tất cả trạng thái';
  }

  @HostListener('document:click')
  closeStatusDropdown(): void {
    this.isStatusOpen = false;
  }

  setSortType(type: 'az' | 'newest' | 'oldest'): void {
    this.sortType = type;
    this.currentPage = 1;
  }

  toggleSelectPage(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.pagedFaqs.forEach((faq) => {
      if (target.checked) {
        this.selectedIds.add(faq.id);
      } else {
        this.selectedIds.delete(faq.id);
      }
    });
  }

  toggleSelectRow(id: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedIds.add(id);
      return;
    }
    this.selectedIds.delete(id);
  }

  deleteSelected(): void {
    this.requestDeleteSelected();
  }

  requestDeleteSelected(): void {
    if (!this.selectedIds.size) {
      return;
    }

    this.pendingDeleteIds = Array.from(this.selectedIds);
    this.deleteConfirmMessage = this.pendingDeleteIds.length === 1
      ? 'Bạn có chắc chắn muốn xóa câu hỏi đã chọn không?'
      : `Bạn có chắc chắn muốn xóa ${this.pendingDeleteIds.length} câu hỏi đã chọn không?`;
    this.showDeleteConfirm = true;
  }

  requestDeleteFaq(id: string): void {
    const selectedFaq = this.faqs.find((faq) => faq.id === id);
    this.pendingDeleteIds = [id];
    this.deleteConfirmMessage = selectedFaq
      ? `Bạn có chắc chắn muốn xóa câu hỏi ${selectedFaq.questionCode} không?`
      : 'Bạn có chắc chắn muốn xóa câu hỏi này không?';
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.pendingDeleteIds.length) {
      this.cancelDelete();
      return;
    }

    const idsToDelete = [...this.pendingDeleteIds];

    forkJoin(idsToDelete.map((id) => this.contactService.deleteContact(id))).subscribe({
      next: () => {
        this.removeFaqsFromView(idsToDelete);
        this.cancelDelete();
      },
      error: (error) => {
        console.error('Xoa FAQ that bai:', error);
        this.cancelDelete();
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteConfirmMessage = '';
    this.pendingDeleteIds = [];
  }

  deleteFaq(id: string): void {
    this.requestDeleteFaq(id);
  }

  editFaq(id: string): void {
    const faq = this.faqs.find((item) => item.id === id);
    if (!faq) {
      return;
    }

    this.selectedFaq = {
      id: faq.id,
      questionCode: faq.questionCode,
      customerName: faq.customerName,
      submittedAt: faq.submittedAt,
      questionContent: faq.questionContent,
      statusLabel: faq.statusLabel,
      draftReplyContent: faq.draftReplyContent,
      finalReplyContent: faq.finalReplyContent,
    };
  }

  onSaveDraft(payload: FaqReplyPayload): void {
    this.contactService.saveContactDraft(payload.id, payload.replyContent).subscribe({
      next: (updatedContact) => {
        const draftStatusLabel = updatedContact.Trang_thai || 'Đang lưu nháp';
        const draftContent = updatedContact.Noi_dung_tra_loi_nhap || payload.replyContent;

        this.faqs = this.faqs.map((faq) => {
          if (faq.id !== payload.id) {
            return faq;
          }

          return {
            ...faq,
            status: this.normalizeStatus(draftStatusLabel),
            statusLabel: draftStatusLabel,
            draftReplyContent: draftContent,
            finalReplyContent: faq.finalReplyContent,
          };
        });

        if (this.selectedFaq && this.selectedFaq.id === payload.id) {
          this.selectedFaq = {
            ...this.selectedFaq,
            statusLabel: draftStatusLabel,
            draftReplyContent: draftContent,
            finalReplyContent: this.selectedFaq.finalReplyContent,
          };
        }
      },
      error: (error) => {
        console.error('Luu nhap FAQ that bai:', error);
      },
    });
  }

  onSendAnswer(payload: FaqReplyPayload): void {
    const shouldSend = window.confirm(
      'Bạn có chắc chắn muốn gửi câu trả lời cho khách không? Sau khi gửi, bạn sẽ không thể chỉnh sửa lại nội dung này.',
    );

    if (!shouldSend) {
      return;
    }

    this.contactService.sendContactReply(payload.id, payload.replyContent).subscribe({
      next: (updatedContact) => {
        const replyStatusLabel = updatedContact.Trang_thai || 'Đã xử lý';
        const finalReplyContent = updatedContact.Noi_dung_tra_loi || payload.replyContent;

        this.faqs = this.faqs.map((faq) => {
          if (faq.id !== payload.id) {
            return faq;
          }

          return {
            ...faq,
            status: this.normalizeStatus(replyStatusLabel),
            statusLabel: replyStatusLabel,
            draftReplyContent: '',
            finalReplyContent,
          };
        });

        if (this.selectedFaq && this.selectedFaq.id === payload.id) {
          this.selectedFaq = {
            ...this.selectedFaq,
            statusLabel: replyStatusLabel,
            draftReplyContent: '',
            finalReplyContent,
          };
        }
      },
      error: (error) => {
        console.error('Gui cau tra loi FAQ that bai:', error);
      },
    });
  }

  get faqModalTitle(): string {
    if (!this.selectedFaq) {
      return 'Mã câu hỏi';
    }

    return `Mã câu hỏi: ${this.selectedFaq.questionCode}`;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  private removeFaqsFromView(ids: string[]): void {
    const idsToRemove = new Set(ids);
    this.faqs = this.faqs.filter((faq) => !idsToRemove.has(faq.id));
    ids.forEach((id) => this.selectedIds.delete(id));

    if (this.selectedFaq && idsToRemove.has(this.selectedFaq.id)) {
      this.selectedFaq = null;
    }

    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  private normalizeStatus(status: string): 'unprocessed' | 'draft' | 'processed' {
    const normalizedStatus = status.trim().toLowerCase();
    if (normalizedStatus.includes('nháp')) {
      return 'draft';
    }

    if (normalizedStatus.includes('chưa')) {
      return 'unprocessed';
    }

    return 'processed';
  }

  private formatDate(date: Date): string {
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
