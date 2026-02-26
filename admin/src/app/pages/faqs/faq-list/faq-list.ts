import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Table } from '../../../components/table/table';
import { Contact } from '../../../services/contact';
import { Modal } from '../../../components/modal/modal';
import { FaqForm, FaqFormData, FaqReplyPayload } from '../faq-form/faq-form';

interface FaqItem {
  id: number;
  questionCode: string;
  customerName: string;
  submittedAt: string;
  submittedTimestamp: number;
  questionContent: string;
  status: 'unprocessed' | 'processed';
  statusLabel: string;
  handler: string;
}

@Component({
  selector: 'app-faq-list',
  imports: [CommonModule, Table, Modal, FaqForm],
  templateUrl: './faq-list.html',
  styleUrl: './faq-list.css',
})
export class FaqList implements OnInit {
  pageSize = 10;
  currentPage = 1;

  searchText = '';
  selectedStatus: 'all' | 'unprocessed' | 'processed' = 'all';
  sortType: 'az' | 'newest' | 'oldest' = 'az';

  selectedIds = new Set<number>();
  selectedFaq: FaqFormData | null = null;

  faqs: FaqItem[] = [];

  constructor(private contactService: Contact) { }

  ngOnInit(): void {
    this.contactService.getContactData().subscribe({
      next: (contacts) => {
        this.faqs = contacts.map((contact, index) => {
          const date = new Date(contact.Ngay_gui);
          return {
            id: index + 1,
            questionCode: contact.Ma_lien_he,
            customerName: contact.Ho_ten,
            submittedAt: this.formatDate(date),
            submittedTimestamp: date.getTime(),
            questionContent: contact.Noi_dung,
            status: this.normalizeStatus(contact.Trang_thai),
            statusLabel: contact.Trang_thai,
            handler: contact.Ma_quan_tri_vien_xu_ly || '-',
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

    return list.sort((a, b) => {
      const firstDate = a.submittedTimestamp;
      const secondDate = b.submittedTimestamp;
      return this.sortType === 'newest' ? secondDate - firstDate : firstDate - secondDate;
    });
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

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus = target.value as 'all' | 'unprocessed' | 'processed';
    this.currentPage = 1;
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

  toggleSelectRow(id: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedIds.add(id);
      return;
    }
    this.selectedIds.delete(id);
  }

  deleteSelected(): void {
    if (!this.selectedIds.size) {
      return;
    }

    this.faqs = this.faqs.filter((faq) => !this.selectedIds.has(faq.id));
    this.selectedIds.clear();
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  deleteFaq(id: number): void {
    this.faqs = this.faqs.filter((faq) => faq.id !== id);
    this.selectedIds.delete(id);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  editFaq(id: number): void {
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
    };
  }

  onSaveDraft(payload: FaqReplyPayload): void {
    console.log('Lưu nháp FAQ:', payload);
  }

  onSendAnswer(payload: FaqReplyPayload): void {
    this.faqs = this.faqs.map((faq) => {
      if (faq.id !== payload.id) {
        return faq;
      }

      return {
        ...faq,
        status: 'processed',
        statusLabel: 'Đã xử lý',
      };
    });

    if (this.selectedFaq && this.selectedFaq.id === payload.id) {
      this.selectedFaq = {
        ...this.selectedFaq,
        statusLabel: 'Đã xử lý',
      };
    }
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

  private normalizeStatus(status: string): 'unprocessed' | 'processed' {
    return status.trim().toLowerCase().includes('chưa') ? 'unprocessed' : 'processed';
  }

  private formatDate(date: Date): string {
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
