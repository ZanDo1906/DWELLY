import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Table } from '../../../components/table/table';
import { BannerForm, BannerFormData } from '../banner-form/banner-form';
import { Modal } from '../../../components/modal/modal';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';
import { Banner } from '../../../services/banner';
import { iBanner } from '../../../interfaces/banner';

interface BannerItem extends iBanner {
  statusLabel: string;
  updatedDateDisplay: string;
}

@Component({
  selector: 'app-banner-list',
  imports: [CommonModule, Table, BannerForm, Modal, ConfirmDialogComponent],
  templateUrl: './banner-list.html',
  styleUrl: './banner-list.css',
})
export class BannerList implements OnInit {
  pageSize = 10;
  currentPage = 1;

  searchText = '';
  selectedStatus: 'all' | 'active' | 'inactive' = 'all';
  selectedPage: 'all' | string = 'all';
  isStatusOpen = false;
  isPageOpen = false;
  sortMode: '' | 'az' | 'za' | 'newest' | 'oldest' = '';

  statusOptions: Array<{ label: string; value: 'all' | 'active' | 'inactive' }> = [
    { label: 'Tất cả trạng thái', value: 'all' },
    { label: 'Đang hiển thị', value: 'active' },
    { label: 'Đã ẩn', value: 'inactive' },
  ];

  pageOptions: Array<{ label: string; value: string }> = [
    { label: 'Tất cả trang', value: 'all' },
    { label: 'Trang chủ', value: 'Trang chủ' },
    { label: 'Giới thiệu', value: 'Giới thiệu' },
    { label: 'Gợi ý không gian', value: 'Gợi ý không gian' },
  ];

  selectedIds = new Set<string>();
  selectedBanner: BannerItem | null = null;
  deleteConfirmMessage = '';
  showDeleteConfirm = false;

  banners: BannerItem[] = [];

  // Stats
  totalBanners = 0;
  activeBanners = 0;
  inactiveBanners = 0;

  constructor(private bannerService: Banner) {}

  ngOnInit(): void {
    this.loadBanners();
  }

  private loadBanners(): void {
    this.bannerService.getBannerData().subscribe({
      next: (banners) => {
        this.banners = banners.map((banner) => this.mapBannerToItem(banner));
        this.updateStats();
      },
      error: () => {
        this.banners = [];
        this.updateStats();
      },
    });
  }

  private mapBannerToItem(banner: iBanner): BannerItem {
    return {
      ...banner,
      statusLabel: banner.Trang_thai ? 'Đang hiển thị' : 'Đã ẩn',
      updatedDateDisplay: this.formatDate(banner.Ngay_cap_nhat),
    };
  }

  private updateStats(): void {
    this.totalBanners = this.banners.length;
    this.activeBanners = this.banners.filter((b) => b.Trang_thai).length;
    this.inactiveBanners = this.banners.filter((b) => !b.Trang_thai).length;
  }

  private formatDate(date?: Date | string): string {
    if (!date) return '--';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get filteredBanners(): BannerItem[] {
    const keyword = this.searchText.trim().toLowerCase();

    return this.banners.filter((banner) => {
      const matchesKeyword =
        !keyword ||
        banner.Tieu_de.toLowerCase().includes(keyword) ||
        banner.Trang.toLowerCase().includes(keyword);

      const matchesStatus = this.selectedStatus === 'all' || (this.selectedStatus === 'active' ? banner.Trang_thai : !banner.Trang_thai);
      const matchesPage = this.selectedPage === 'all' || banner.Trang === this.selectedPage;

      return matchesKeyword && matchesStatus && matchesPage;
    });
  }

  get sortedBanners(): BannerItem[] {
    const list = [...this.filteredBanners];

    if (this.sortMode === 'az' || this.sortMode === 'za') {
      list.sort((a, b) => {
        const comp = a.Tieu_de.localeCompare(b.Tieu_de);
        return this.sortMode === 'az' ? comp : -comp;
      });
    } else if (this.sortMode === 'newest' || this.sortMode === 'oldest') {
      list.sort((a, b) => {
        const timeA = new Date(a.Ngay_cap_nhat || 0).getTime();
        const timeB = new Date(b.Ngay_cap_nhat || 0).getTime();
        return this.sortMode === 'newest' ? timeB - timeA : timeA - timeB;
      });
    }

    return list;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedBanners.length / this.pageSize));
  }

  get pagedBanners(): BannerItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.sortedBanners.slice(startIndex, startIndex + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get isPageFullySelected(): boolean {
    return this.pagedBanners.length > 0 && this.pagedBanners.every((item) => this.selectedIds.has(item.Ma_banner || ''));
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchText = target.value;
    this.currentPage = 1;
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus = target.value as 'all' | 'active' | 'inactive';
    this.currentPage = 1;
  }

  toggleStatusDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isStatusOpen = !this.isStatusOpen;
  }

  selectStatus(status: 'all' | 'active' | 'inactive'): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.isStatusOpen = false;
  }

  get selectedStatusLabel(): string {
    return this.statusOptions.find((option) => option.value === this.selectedStatus)?.label || 'Tất cả trạng thái';
  }

  togglePageDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isPageOpen = !this.isPageOpen;
  }

  selectPage(page: string): void {
    this.selectedPage = page;
    this.currentPage = 1;
    this.isPageOpen = false;
  }

  get selectedPageLabel(): string {
    return this.pageOptions.find((option) => option.value === this.selectedPage)?.label || 'Tất cả trang';
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.isStatusOpen = false;
    this.isPageOpen = false;
  }

  setDateSort(mode: 'newest' | 'oldest'): void {
    this.sortMode = this.sortMode === mode ? '' : mode;
    this.currentPage = 1;
  }

  toggleSort(mode: 'az'): void {
    if (mode === 'az') {
      if (this.sortMode === 'az') {
        this.sortMode = 'za';
      } else if (this.sortMode === 'za') {
        this.sortMode = '';
      } else {
        this.sortMode = 'az';
      }
      this.currentPage = 1;
    }
  }

  toggleSelectPage(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.pagedBanners.forEach((banner) => {
      if (target.checked && banner.Ma_banner) {
        this.selectedIds.add(banner.Ma_banner);
      } else {
        this.selectedIds.delete(banner.Ma_banner || '');
      }
    });
  }

  toggleSelectRow(id: string | undefined, event: Event): void {
    if (!id) return;
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
  }

  requestDeleteSelected(): void {
    if (!this.selectedIds.size) {
      return;
    }

    const selectedBanners = this.banners.filter((banner) => this.selectedIds.has(banner.Ma_banner || ''));
    const selectedTitles = selectedBanners.map((banner) => banner.Tieu_de);

    if (selectedTitles.length === 1) {
      this.deleteConfirmMessage = `Bạn có chắc chắn muốn xóa banner "${selectedTitles[0]}" không?`;
    } else {
      this.deleteConfirmMessage = `Bạn có chắc chắn muốn xóa ${selectedTitles.length} banner đã chọn không?`;
    }

    this.showDeleteConfirm = true;
  }

  confirmDeleteSelected(): void {
    if (!this.selectedIds.size) {
      this.showDeleteConfirm = false;
      return;
    }

    const idsToDelete = Array.from(this.selectedIds);
    this.bannerService.deleteBannersByIds(idsToDelete).subscribe({
      next: () => {
        this.banners = this.banners.filter((banner) => !this.selectedIds.has(banner.Ma_banner || ''));
        this.updateStats();
        this.selectedIds.clear();
        this.currentPage = Math.min(this.currentPage, this.totalPages);
        this.showDeleteConfirm = false;
      },
      error: (error) => {
        console.error('Delete selected banners failed:', error);
        this.showDeleteConfirm = false;
        alert('Không thể xóa banner khỏi database. Vui lòng kiểm tra server và thử lại.');
      },
    });
  }

  cancelDeleteSelected(): void {
    this.showDeleteConfirm = false;
  }

  openCreateBanner(): void {
    this.selectedBanner = null;
  }

  openBannerDetail(banner: BannerItem): void {
    this.selectedBanner = { ...banner };
    this.showBannerModal();
  }

  onBannerSave(payload: BannerFormData): void {
    const isCreateMode = !this.selectedBanner?.Ma_banner;

    if (isCreateMode) {
      const createPayload: iBanner = {
        Tieu_de: payload.title.trim(),
        Tieu_de_chinh: payload.mainTitle?.trim() || payload.title.trim(),
        Tieu_de_phu: payload.subtitle?.trim() || '',
        Hinh_anh: payload.image.trim(),
        Anh_nen_mobile: payload.mobileImage?.trim() || '',
        Mo_ta_ngan: payload.shortDescription?.trim() || '',
        CTA_text: payload.ctaText?.trim() || 'Khám phá ngay',
        CTA_link: payload.ctaLink?.trim() || '',
        Loai_overlay: payload.overlayType,
        Mau_overlay: payload.overlayColor?.trim() || '',
        Do_mo_overlay: Number(payload.overlayOpacity ?? 0.65),
        Trang: payload.page,
        Thu_tu: Number(payload.order || 0),
        Trang_thai: payload.status === 'active',
        Ma_quan_tri_vien: 'AD01',
      };

      this.bannerService.createBanner(createPayload).subscribe({
        next: (createdBanner) => {
          const newBanner = this.mapBannerToItem(createdBanner);
          this.banners = [newBanner, ...this.banners];
          this.updateStats();
          this.currentPage = 1;
          this.hideBannerModal();
        },
        error: (error) => {
          console.error('Create banner failed:', error);
          alert('Không thể thêm banner vào database. Vui lòng kiểm tra dữ liệu hoặc server.');
        },
      });
      return;
    }

    const currentBanner = this.selectedBanner;
    if (!currentBanner || !currentBanner.Ma_banner) {
      return;
    }

    const updatePayload: Partial<iBanner> = {
      Tieu_de: payload.title.trim(),
      Tieu_de_chinh: payload.mainTitle?.trim() || payload.title.trim(),
      Tieu_de_phu: payload.subtitle?.trim() || '',
      Hinh_anh: payload.image.trim(),
      Anh_nen_mobile: payload.mobileImage?.trim() || '',
      Mo_ta_ngan: payload.shortDescription?.trim() || '',
      CTA_text: payload.ctaText?.trim() || 'Khám phá ngay',
      CTA_link: payload.ctaLink?.trim() || '',
      Loai_overlay: payload.overlayType,
      Mau_overlay: payload.overlayColor?.trim() || '',
      Do_mo_overlay: Number(payload.overlayOpacity ?? 0.65),
      Trang: payload.page,
      Thu_tu: Number(payload.order || 0),
      Trang_thai: payload.status === 'active',
    };

    this.bannerService.updateBannerById(currentBanner.Ma_banner, updatePayload).subscribe({
      next: () => {
        const updatedBannerData: iBanner = {
          ...currentBanner,
          ...updatePayload,
        };
        const updatedBanner = this.mapBannerToItem(updatedBannerData);

        const bannerIndex = this.banners.findIndex((b) => b.Ma_banner === currentBanner.Ma_banner);
        if (bannerIndex >= 0) {
          const oldStatus = this.banners[bannerIndex].Trang_thai;
          this.banners[bannerIndex] = updatedBanner;

          if (oldStatus !== updatedBanner.Trang_thai) {
            this.updateStats();
          }
        }

        this.hideBannerModal();
      },
      error: (error) => {
        console.error('Update banner failed:', error);
        alert('Không thể cập nhật banner vào database. Vui lòng kiểm tra dữ liệu hoặc server.');
      },
    });
  }

  get bannerModalTitle(): string {
    return this.selectedBanner?.Ma_banner ? 'Chỉnh sửa banner' : 'Thêm banner mới';
  }

  showBannerModal(): void {
    const modalEl = document.getElementById('bannerModal');
    if (modalEl) {
      let modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (!modal) {
        modal = new (window as any).bootstrap.Modal(modalEl);
      }
      modal.show();
    }
  }

  hideBannerModal(): void {
    const modalEl = document.getElementById('bannerModal');
    if (modalEl) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        modal.hide();
      } else {
        // Fallback for extreme cases
        modalEl.classList.remove('show');
        modalEl.style.display = 'none';
        document.querySelector('.modal-backdrop')?.remove();
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }
}
