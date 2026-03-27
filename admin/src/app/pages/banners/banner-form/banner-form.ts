import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Banner } from '../../../services/banner';

export interface BannerFormData {
  subtitle: string;
  title: string;
  mainTitle: string;
  image: string;
  mobileImage: string;
  shortDescription: string;
  ctaText: string;
  ctaLink: string;
  page: string;
  overlayType: 'none' | 'dark' | 'light' | 'gradient' | 'custom';
  overlayColor: string;
  overlayOpacity: number;
  order: number;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-banner-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './banner-form.html',
  styleUrl: './banner-form.css',
})
export class BannerForm implements OnChanges {
  @Input() banner: any = null;
  @Output() saveConfirmed = new EventEmitter<BannerFormData>();

  constructor(private bannerService: Banner) {}

  get isEditMode(): boolean {
    return !!(this.banner?.Ma_banner || this.banner?.id);
  }

  pageOptions: Array<{ label: string; value: string }> = [
    { label: 'Trang chủ', value: 'Trang chủ' },
    { label: 'Giới thiệu', value: 'Giới thiệu' },
    { label: 'Gợi ý không gian', value: 'Gợi ý không gian' },
  ];
  overlayOptions: Array<{ label: string; value: 'none' | 'dark' | 'light' | 'gradient' | 'custom' }> = [
    { label: 'Nâu đậm (mặc định)', value: 'dark' },
    { label: 'Sáng', value: 'light' },
    { label: 'Gradient', value: 'gradient' },
    { label: 'Không overlay', value: 'none' },
    { label: 'Tùy chỉnh', value: 'custom' },
  ];

  formValue: BannerFormData = this.createEmptyFormValue();
  imagePreview: string | null = null;
  mobileImagePreview: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['banner']) {
      return;
    }

    if (!this.banner) {
      this.formValue = this.createEmptyFormValue();
      this.imagePreview = null;
      this.mobileImagePreview = null;
      return;
    }

    this.formValue = {
      subtitle: this.banner.Tieu_de_phu || '',
      title: this.banner.Tieu_de || '',
      mainTitle: this.banner.Tieu_de_chinh || this.banner.Tieu_de || '',
      image: this.banner.Hinh_anh || '',
      mobileImage: this.banner.Anh_nen_mobile || '',
      shortDescription: this.banner.Mo_ta_ngan || this.banner.Mo_ta || '',
      ctaText: this.banner.CTA_text || 'Khám phá ngay',
      ctaLink: this.banner.CTA_link || this.banner.Duong_dan || '',
      page: this.banner.Trang || 'home',
      overlayType: this.banner.Loai_overlay || 'dark',
      overlayColor: this.banner.Mau_overlay || '',
      overlayOpacity: this.banner.Do_mo_overlay ?? 0.65,
      order: this.banner.Thu_tu || 0,
      status: this.banner.Trang_thai ? 'active' : 'inactive',
    };

    this.imagePreview = this.formValue.image;
    this.mobileImagePreview = this.formValue.mobileImage;
  }

  isUploadingDesktop = false;
  isUploadingMobile = false;

  onImageChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      this.isUploadingDesktop = true;
      this.bannerService.uploadBannerImage(file).subscribe({
        next: (res) => {
          this.formValue.image = res.filePath;
          this.imagePreview = res.filePath;
          this.isUploadingDesktop = false;
        },
        error: (err) => {
          console.error(err);
          this.isUploadingDesktop = false;
          alert('Upload ảnh Desktop thất bại!');
        }
      });
    }
  }

  onImageUrlChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.formValue.image = target.value;
    this.imagePreview = target.value;
  }

  onMobileImageChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      this.isUploadingMobile = true;
      this.bannerService.uploadBannerImage(file).subscribe({
        next: (res) => {
          this.formValue.mobileImage = res.filePath;
          this.mobileImagePreview = res.filePath;
          this.isUploadingMobile = false;
        },
        error: (err) => {
          console.error(err);
          this.isUploadingMobile = false;
          alert('Upload ảnh Mobile thất bại!');
        }
      });
    }
  }

  onMobileImageUrlChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.formValue.mobileImage = target.value;
    this.mobileImagePreview = target.value;
  }

  toggleBannerStatus(): void {
    this.formValue.status = this.formValue.status === 'active' ? 'inactive' : 'active';
  }

  openConfirm(): void {
    if (!this.validateForm()) {
      return;
    }
    // Emit directly without needing a separate confirm dialog for now
    this.confirmSave();
  }

  confirmSave(): void {
    this.saveConfirmed.emit({ ...this.formValue });
  }

  private validateForm(): boolean {
    if (!this.formValue.title.trim()) {
      alert('Vui lòng nhập tiêu đề banner');
      return false;
    }
    if (!this.formValue.image.trim()) {
      alert('Vui lòng nhập URL ảnh hoặc tải lên ảnh');
      return false;
    }
    if (!this.formValue.page) {
      alert('Vui lòng chọn trang');
      return false;
    }
    return true;
  }

  private createEmptyFormValue(): BannerFormData {
    return {
      subtitle: '',
      title: '',
      mainTitle: '',
      image: '',
      mobileImage: '',
      shortDescription: '',
      ctaText: 'Khám phá ngay',
      ctaLink: '',
      page: '',
      overlayType: 'dark',
      overlayColor: '',
      overlayOpacity: 0.65,
      order: 0,
      status: 'active',
    };
  }

  isFieldVisible(fieldName: string): boolean {
    const page = this.formValue.page;
    if (!page) { // Default state before selecting a page
       return ['title', 'page', 'order', 'image', 'status'].includes(fieldName);
    }
    
    // Always visible basic fields
    if (['title', 'page', 'order', 'image', 'status'].includes(fieldName)) return true;

    // Home page needs everything
    if (page === 'Trang chủ' || page === 'home') return true;

    // All other pages need: mobileImage, subtitle, mainTitle
    if (['mobileImage', 'subtitle', 'mainTitle'].includes(fieldName)) return true;

    return false;
  }

  isPageDropdownOpen = false;
  isOverlayDropdownOpen = false;

  @HostListener('document:click')
  closeDropdowns(): void {
    this.isPageDropdownOpen = false;
    this.isOverlayDropdownOpen = false;
  }

  togglePageDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isOverlayDropdownOpen = false; 
    this.isPageDropdownOpen = !this.isPageDropdownOpen;
  }

  selectPage(value: string): void {
    this.formValue.page = value;
    this.isPageDropdownOpen = false;
  }

  getPageLabel(): string {
    return this.pageOptions.find(o => o.value === this.formValue.page)?.label || '';
  }

  toggleOverlayDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isPageDropdownOpen = false; 
    this.isOverlayDropdownOpen = !this.isOverlayDropdownOpen;
  }

  selectOverlay(value: any): void {
    this.formValue.overlayType = value;
    this.isOverlayDropdownOpen = false;
  }

  getOverlayLabel(): string {
    return this.overlayOptions.find(o => o.value === this.formValue.overlayType)?.label || '';
  }
}
