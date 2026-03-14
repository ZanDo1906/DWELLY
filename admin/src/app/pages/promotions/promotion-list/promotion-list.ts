import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Table } from '../../../components/table/table';
import { PromotionForm, PromotionFormData } from '../promotion-form/promotion-form';
import { Modal } from '../../../components/modal/modal';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';
import { Voucher } from '../../../services/voucher';
import { iVoucher } from '../../../interfaces/voucher';

interface PromotionItem {
  id: string;
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
  imports: [CommonModule, Table, PromotionForm, Modal, ConfirmDialogComponent],
  templateUrl: './promotion-list.html',
  styleUrl: './promotion-list.css',
})
export class PromotionList {
  pageSize = 10;
  currentPage = 1;

  searchText = '';
  selectedStatus: 'all' | 'active' | 'paused' = 'all';
  isStatusOpen = false;
  sortType: 'az' | 'newest' | 'oldest' = 'az';

  statusOptions: Array<{ label: string; value: 'all' | 'active' | 'paused' }> = [
    { label: 'Tất cả trạng thái', value: 'all' },
    { label: 'Kích hoạt', value: 'active' },
    { label: 'Tạm dừng', value: 'paused' },
  ];

  selectedIds = new Set<string>();
  selectedPromotion: PromotionItem | null = null;
  deleteConfirmMessage = '';
  showDeleteConfirm = false;
  resultModalTitle = '';
  resultModalMessage = '';
  resultModalType: 'success' | 'error' = 'success';

  promotions: PromotionItem[] = [];

  constructor(private voucherService: Voucher) { }

  ngOnInit(): void {
    this.voucherService.getVoucherData().subscribe({
      next: (vouchers) => {
        this.promotions = vouchers.map((voucher) => this.mapVoucherToPromotion(voucher));
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

  toggleStatusDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isStatusOpen = !this.isStatusOpen;
  }

  selectStatus(status: 'all' | 'active' | 'paused'): void {
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
    this.pagedPromotions.forEach((promotion) => {
      if (target.checked) {
        this.selectedIds.add(promotion.id);
      } else {
        this.selectedIds.delete(promotion.id);
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

  requestDeleteSelected(): void {
    if (!this.selectedIds.size) {
      return;
    }

    const selectedPromotions = this.promotions.filter((promotion) => this.selectedIds.has(promotion.id));
    const selectedCodes = selectedPromotions.map((promotion) => promotion.promotionCode);

    if (selectedCodes.length === 1) {
      this.deleteConfirmMessage = `Bạn có chắc chắn muốn xóa mã khuyến mãi ${selectedCodes[0]} không?`;
    } else {
      this.deleteConfirmMessage = `Bạn có chắc chắn muốn xóa ${selectedCodes.length} mã khuyến mãi đã chọn không?`;
    }

    this.showDeleteConfirm = true;
  }

  confirmDeleteSelected(): void {
    if (!this.selectedIds.size) {
      this.showDeleteConfirm = false;
      return;
    }

    const idsToDelete = Array.from(this.selectedIds);
    this.voucherService.deleteVouchersByIds(idsToDelete).subscribe({
      next: () => {
        this.promotions = this.promotions.filter((promotion) => !this.selectedIds.has(promotion.id));
        this.selectedIds.clear();
        this.currentPage = Math.min(this.currentPage, this.totalPages);
        this.showDeleteConfirm = false;
        this.showResultModal(
          'Xóa thành công',
          'Đã xóa mã khuyến mãi đã chọn khỏi cơ sở dữ liệu.',
          'success',
        );
      },
      error: (error) => {
        console.error('Delete selected vouchers failed:', error);
        this.showDeleteConfirm = false;
        this.showResultModal(
          'Xóa thất bại',
          'Không thể xóa mã khuyến mãi khỏi database. Vui lòng kiểm tra server và thử lại.',
          'error',
        );
      },
    });
  }

  openCreatePromotion(): void {
    this.selectedPromotion = null;
  }

  openPromotionDetail(promotion: PromotionItem): void {
    this.selectedPromotion = { ...promotion };
    this.showPromotionModal();
  }

  onPromotionSave(payload: PromotionFormData): void {
    const isCreateMode = !this.selectedPromotion;
    if (isCreateMode) {
      const createPayload: iVoucher = {
        Ma_khuyen_mai: payload.promotionCode.trim(),
        Ma_so: payload.code.trim(),
        Phan_tram_giam: Number(payload.discountPercent || 0),
        So_luong_con_lai: Number(payload.remaining || 0),
        Ma_phan_hang_toi_thieu: payload.minimumRank,
        Ngay_bat_dau: payload.startDate as unknown as Date,
        Ngay_het_han: payload.endDate as unknown as Date,
        Mo_ta: payload.description.trim(),
        Trang_thai: true,
        Ma_quan_tri_vien_tao: 'AD01',
      };

      this.voucherService.createVoucher(createPayload).subscribe({
        next: (createdVoucher) => {
          const newPromotion = this.mapVoucherToPromotion(createdVoucher);
          this.promotions = [newPromotion, ...this.promotions];
          this.currentPage = 1;
          this.hidePromotionModal();
          this.showResultModal(
            'Thêm thành công',
            `Đã thêm mã khuyến mãi ${newPromotion.promotionCode} vào cơ sở dữ liệu.`,
            'success',
          );
        },
        error: (error) => {
          console.error('Create voucher failed:', error);
          this.showResultModal(
            'Thêm thất bại',
            'Không thể thêm mã khuyến mãi vào database. Vui lòng kiểm tra dữ liệu hoặc server.',
            'error',
          );
        },
      });
      return;
    }

    const currentPromotion = this.selectedPromotion;
    if (!currentPromotion) {
      return;
    }

    const voucherId = currentPromotion.id;
    const updatePayload: Partial<iVoucher> = {
      Ma_so: payload.code,
      Phan_tram_giam: Number(payload.discountPercent || 0),
      So_luong_con_lai: Number(payload.remaining || 0),
      Ma_phan_hang_toi_thieu: payload.minimumRank,
      Ngay_bat_dau: payload.startDate as unknown as Date,
      Ngay_het_han: payload.endDate as unknown as Date,
      Mo_ta: payload.description,
    };

    this.voucherService.updateVoucherById(voucherId, updatePayload).subscribe({
      next: () => {
        const updatedPromotion: PromotionItem = {
          ...currentPromotion,
          promotionCode: payload.promotionCode,
          code: payload.code,
          discountPercent: Number(payload.discountPercent || 0),
          remaining: Number(payload.remaining || 0),
          minimumRank: payload.minimumRank,
          rank: this.formatRank(payload.minimumRank),
          startDateRaw: payload.startDate,
          endDateRaw: payload.endDate,
          startDate: this.formatDate(payload.startDate),
          endDate: this.formatDate(payload.endDate),
          description: payload.description,
        };

        this.promotions = this.promotions.map((promotion) =>
          promotion.id === voucherId ? updatedPromotion : promotion,
        );

        this.selectedPromotion = { ...updatedPromotion };
        this.hidePromotionModal();
        this.showResultModal(
          'Cập nhật thành công',
          `Đã cập nhật mã khuyến mãi ${updatedPromotion.promotionCode} vào cơ sở dữ liệu.`,
          'success',
        );
      },
      error: (error) => {
        console.error('Update voucher failed:', error);
        this.showResultModal(
          'Cập nhật thất bại',
          'Không thể cập nhật dữ liệu xuống database. Vui lòng kiểm tra server và thử lại.',
          'error',
        );
      },
    });
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

  private mapVoucherToPromotion(voucher: iVoucher): PromotionItem {
    const startDateRaw = this.formatDateForInput(voucher.Ngay_bat_dau);
    const endDateRaw = this.formatDateForInput(voucher.Ngay_het_han);

    return {
      id: voucher.Ma_khuyen_mai,
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

  private showPromotionModal(): void {
    const modalEl = document.getElementById('promotionModal');
    if (!modalEl) {
      return;
    }

    const modal = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl);
    modal?.show();
  }

  private hidePromotionModal(): void {
    const modalEl = document.getElementById('promotionModal');
    if (!modalEl) {
      return;
    }

    const modal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    modal?.hide();
  }

  hideResultModal(): void {
    const modalEl = document.getElementById('promotionResultModal');
    if (!modalEl) {
      return;
    }

    const modal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    modal?.hide();
  }

  cancelDeleteSelected(): void {
    this.showDeleteConfirm = false;
  }

  private showResultModal(title: string, message: string, type: 'success' | 'error'): void {
    this.resultModalTitle = title;
    this.resultModalMessage = message;
    this.resultModalType = type;

    const modalEl = document.getElementById('promotionResultModal');
    if (!modalEl) {
      return;
    }

    const modal = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl);
    modal?.show();
  }

}
