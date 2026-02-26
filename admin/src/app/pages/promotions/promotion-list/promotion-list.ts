import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Table } from '../../../components/table/table';
import { PromotionForm } from '../promotion-form/promotion-form';
import { Modal } from '../../../components/modal/modal';
import { Voucher } from '../../../services/voucher';
import { iVoucher } from '../../../interfaces/voucher';

interface PromotionItem {
  id: number;
  promotionCode: string;
  code: string;
  discountPercent: number;
  remaining: number;
  rank: string;
  minimumRank: string;
  startDate: string;
  endDate: string;
  startDateRaw: string;
  endDateRaw: string;
  description: string;
  status: 'active' | 'paused';
  statusLabel: string;
  creator: string;
}

@Component({
  selector: 'app-promotion-list',
  imports: [CommonModule, Table, PromotionForm, Modal],
  templateUrl: './promotion-list.html',
  styleUrl: './promotion-list.css',
})
export class PromotionList {
  pageSize = 10;
  currentPage = 1;

  searchText = '';
  selectedStatus: 'all' | 'active' | 'paused' = 'all';
  sortType: 'az' | 'newest' | 'oldest' = 'az';

  selectedIds = new Set<number>();
  selectedPromotion: PromotionItem | null = null;

  promotions: PromotionItem[] = [];

  constructor(private voucherService: Voucher) { }

  ngOnInit(): void {
    this.voucherService.getVoucherData().subscribe({
      next: (vouchers) => {
        this.promotions = vouchers.map((voucher, index) => this.mapVoucherToPromotion(voucher, index));
      },
      error: () => {
        this.promotions = [];
      },
    });
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get filteredPromotions(): PromotionItem[] {
    const keyword = this.searchText.trim().toLowerCase();

    return this.promotions.filter((promotion) => {
      const matchesKeyword =
        !keyword ||
        promotion.promotionCode.toLowerCase().includes(keyword) ||
        promotion.code.toLowerCase().includes(keyword) ||
        promotion.rank.toLowerCase().includes(keyword) ||
        promotion.creator.toLowerCase().includes(keyword);

      const matchesStatus = this.selectedStatus === 'all' || promotion.status === this.selectedStatus;
      return matchesKeyword && matchesStatus;
    });
  }

  get sortedPromotions(): PromotionItem[] {
    const list = [...this.filteredPromotions];

    if (this.sortType === 'az') {
      return list.sort((first, second) => first.promotionCode.localeCompare(second.promotionCode));
    }

    return list.sort((first, second) => {
      const firstTime = this.toTimestamp(first.startDate);
      const secondTime = this.toTimestamp(second.startDate);
      return this.sortType === 'newest' ? secondTime - firstTime : firstTime - secondTime;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedPromotions.length / this.pageSize));
  }

  get pagedPromotions(): PromotionItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.sortedPromotions.slice(startIndex, startIndex + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get isPageFullySelected(): boolean {
    return this.pagedPromotions.length > 0 && this.pagedPromotions.every((item) => this.selectedIds.has(item.id));
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchText = target.value;
    this.currentPage = 1;
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus = target.value as 'all' | 'active' | 'paused';
    this.currentPage = 1;
  }

  setSortType(type: 'az' | 'newest' | 'oldest'): void {
    this.sortType = type;
    this.currentPage = 1;
  }

  toggleSelectPage(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.pagedPromotions.forEach((promotion) => {
      if (target.checked) {
        this.selectedIds.add(promotion.id);
      } else {
        this.selectedIds.delete(promotion.id);
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

    this.promotions = this.promotions.filter((promotion) => !this.selectedIds.has(promotion.id));
    this.selectedIds.clear();
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  openCreatePromotion(): void {
    this.selectedPromotion = null;
  }

  openPromotionDetail(promotion: PromotionItem): void {
    this.selectedPromotion = { ...promotion };
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

  get promotionModalTitle(): string {
    if (!this.selectedPromotion) {
      return 'Thêm khuyến mãi';
    }
    return `Khuyến mãi: ${this.selectedPromotion.promotionCode}`;
  }

  private toTimestamp(dateString: string): number {
    const [day, month, year] = dateString.split('-').map((value) => Number(value));
    return new Date(year, month - 1, day).getTime();
  }

  private mapVoucherToPromotion(voucher: iVoucher, index: number): PromotionItem {
    const startDateRaw = this.formatDateForInput(voucher.Ngay_bat_dau);
    const endDateRaw = this.formatDateForInput(voucher.Ngay_het_han);

    return {
      id: index + 1,
      promotionCode: voucher.Ma_khuyen_mai,
      code: voucher.Ma_so,
      discountPercent: Number(voucher.Phan_tram_giam || 0),
      remaining: Number(voucher.So_luong_con_lai || 0),
      rank: this.formatRank(voucher.Ma_phan_hang_toi_thieu),
      minimumRank: voucher.Ma_phan_hang_toi_thieu,
      startDate: this.formatDate(startDateRaw),
      endDate: this.formatDate(endDateRaw),
      startDateRaw,
      endDateRaw,
      description: voucher.Mo_ta,
      status: voucher.Trang_thai ? 'active' : 'paused',
      statusLabel: voucher.Trang_thai ? 'Kích hoạt' : 'Tạm dừng',
      creator: voucher.Ma_quan_tri_vien_tao,
    };
  }

  private formatDateForInput(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatRank(rankCode: string): string {
    const normalized = rankCode.trim().toUpperCase();
    if (normalized === 'DONG') {
      return 'Đồng';
    }
    if (normalized === 'BAC') {
      return 'Bạc';
    }
    if (normalized === 'VANG') {
      return 'Vàng';
    }
    if (normalized === 'KIMCUONG') {
      return 'Kim cương';
    }
    return rankCode;
  }

}
