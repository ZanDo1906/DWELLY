import { Component, ViewChildren, QueryList, ElementRef, Input, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { iProduct } from '../../../interfaces/product';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../services/product';
import { Category } from '../../../services/category';
import { Room } from '../../../services/room';
import { Style } from '../../../services/style';
import { Concept } from '../../../services/concept';
import { iCategory } from '../../../interfaces/category';
import { iRoom } from '../../../interfaces/room';
import { iStyle } from '../../../interfaces/style';
import { iConcept } from '../../../interfaces/concept';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';

type ClassificationType = 'category' | 'room' | 'style' | 'concept';
type PopupDropdownType = 'roomCode' | 'styleCode';
type ConfirmActionType = 'delete-product' | 'cancel-form' | 'save-product' | 'delete-classification';

interface ClassificationListItem {
  code: string;
  name: string;
}

interface ClassificationFormState {
  code: string;
  name: string;
  description: string;
  roomCode: string;
  styleCode: string;
  image: string;
  status: boolean;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css'],
})
export class ProductForm implements OnInit {
  @Input() productData?: iProduct;
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public productService: Product,
    private categoryService: Category,
    private roomService: Room,
    private styleService: Style,
    private conceptService: Concept
  ) { }
  product: iProduct = {
    Ma_san_pham: '',
    Ten_san_pham: '',
    Gia_ban: 0,
    Mo_ta: '',
    Kich_thuoc: '',
    Chat_lieu: '',
    Hinh_anh: [],
    So_luong_ton_kho: 0,
    Ma_loai_phong: '',
    Ma_phong_cach: '',
    Ma_danh_muc: '',
    Ma_khong_gian: '',
    Trang_thai: true
  };
  private originalProduct: iProduct | null = null;
  private originalImages: (string | null)[] = [null, null, null, null];
  selectedFiles: File[] = [];
  isEditMode: boolean = false;
  images: (string | null)[] = [null, null, null, null];
  categories: iCategory[] = [];
  rooms: iRoom[] = [];
  styles: iStyle[] = [];
  concepts: iConcept[] = [];
  openDropdown: ClassificationType | null = null;
  openPopupDropdown: PopupDropdownType | null = null;

  showClassificationPopup = false;
  activeClassificationType: ClassificationType = 'category';
  selectedClassificationCode = '';
  classificationForm: ClassificationFormState = this.createEmptyClassificationForm();
  isConceptImageUploading = false;
  showActionConfirm = false;
  confirmTitle = 'Xác nhận';
  confirmMessage = 'Bạn có chắc muốn thực hiện hành động này?';
  pendingConfirmAction: ConfirmActionType | null = null;

  openActionConfirm(action: ConfirmActionType): void {
    this.pendingConfirmAction = action;

    if (action === 'delete-product') {
      this.confirmTitle = 'Xác nhận xóa';
      this.confirmMessage = 'Bạn có chắc muốn xóa sản phẩm này?';
    } else if (action === 'cancel-form') {
      this.confirmTitle = 'Xác nhận hủy';
      this.confirmMessage = 'Bạn có chắc muốn hủy các thay đổi hiện tại?';
    } else if (action === 'save-product') {
      this.confirmTitle = 'Xác nhận lưu';
      this.confirmMessage = this.isEditMode
        ? 'Bạn có chắc muốn lưu cập nhật sản phẩm này?'
        : 'Bạn có chắc muốn lưu mới sản phẩm này?';
    } else {
      this.confirmTitle = 'Xác nhận xóa';
      this.confirmMessage = 'Bạn có chắc muốn xóa mục này không?';
    }

    this.showActionConfirm = true;
  }

  closeActionConfirm(): void {
    this.showActionConfirm = false;
    this.pendingConfirmAction = null;
  }

  handleActionConfirm(): void {
    const action = this.pendingConfirmAction;
    this.closeActionConfirm();

    if (action === 'delete-product') {
      this.performDeleteProduct();
      return;
    }

    if (action === 'cancel-form') {
      this.restoreFormState();
      return;
    }

    if (action === 'save-product') {
      this.saveProduct();
      return;
    }

    if (action === 'delete-classification') {
      this.performDeleteClassificationItem();
    }
  }

  async ngOnInit() {
    this.loadClassificationData();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productService.getProductByCode(id).subscribe({
        next: (data) => {
          this.product = { ...data };
          this.product.Ma_khong_gian = this.product.Ma_khong_gian || '';
          this.images = this.product.Hinh_anh.length
            ? [...this.product.Hinh_anh]
            : [null, null, null, null];
          this.checkAndAddNewPlaceholder();
          this.syncOriginalState();
        },
        error: (err) => console.error('Không tìm thấy sản phẩm', err)
      });
    } else {
      this.isEditMode = false;
      // Lấy mã sản phẩm tiếp theo khi tạo mới
      this.productService.getNextProductCode().subscribe({
        next: (res) => {
          this.product.Ma_san_pham = res.nextCode;
        },
        error: (err) => {
          console.error('Không lấy được mã sản phẩm tiếp theo', err);
        }
      });
    }
  }

  private loadClassificationData(): void {
    this.categoryService.getCategoryData().subscribe({
      next: (data) => {
        this.categories = data || [];
      },
      error: (err) => console.error('Lỗi load danh mục', err)
    });

    this.roomService.getRoomData().subscribe({
      next: (data) => {
        this.rooms = data || [];
        this.syncFormDefaultsForConcept();
      },
      error: (err) => console.error('Lỗi load loại phòng', err)
    });

    this.styleService.getStyleData().subscribe({
      next: (data) => {
        this.styles = data || [];
        this.syncFormDefaultsForConcept();
      },
      error: (err) => console.error('Lỗi load phong cách', err)
    });

    this.conceptService.getConceptData().subscribe({
      next: (data) => {
        this.concepts = data || [];
      },
      error: (err) => console.error('Lỗi load concept', err)
    });
  }

  private createEmptyClassificationForm(): ClassificationFormState {
    return {
      code: '',
      name: '',
      description: '',
      roomCode: '',
      styleCode: '',
      image: '',
      status: true
    };
  }

  private syncFormDefaultsForConcept(): void {
    if (this.activeClassificationType !== 'concept') return;

    if (!this.classificationForm.roomCode && this.rooms.length > 0) {
      this.classificationForm.roomCode = this.rooms[0]?.Ma_loai_phong ?? '';
    }

    if (!this.classificationForm.styleCode && this.styles.length > 0) {
      this.classificationForm.styleCode = this.styles[0]?.Ma_phong_cach ?? '';
    }
  }

  openClassificationPopup(type: ClassificationType): void {
    this.openDropdown = null;
    this.openPopupDropdown = null;
    this.showClassificationPopup = true;
    this.activeClassificationType = type;
    this.startCreateClassificationItem();
  }

  closeClassificationPopup(): void {
    this.showClassificationPopup = false;
    this.openPopupDropdown = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.openDropdown = null;
      this.openPopupDropdown = null;
    }
  }

  toggleDropdown(type: ClassificationType, event: Event): void {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === type ? null : type;
  }

  isDropdownOpen(type: ClassificationType): boolean {
    return this.openDropdown === type;
  }

  selectCategory(value: string, event: Event): void {
    event.stopPropagation();
    this.product.Ma_danh_muc = value;
    this.openDropdown = null;
  }

  selectRoom(value: string, event: Event): void {
    event.stopPropagation();
    this.product.Ma_loai_phong = value;
    this.openDropdown = null;
  }

  selectStyle(value: string, event: Event): void {
    event.stopPropagation();
    this.product.Ma_phong_cach = value;
    this.openDropdown = null;
  }

  selectConcept(value: string, event: Event): void {
    event.stopPropagation();
    this.product.Ma_khong_gian = value;
    this.openDropdown = null;
  }

  openClassificationPopupFromDropdown(type: ClassificationType, event: Event): void {
    event.stopPropagation();
    this.openDropdown = null;
    this.openClassificationPopup(type);
  }

  togglePopupDropdown(type: PopupDropdownType, event: Event): void {
    event.stopPropagation();
    this.openPopupDropdown = this.openPopupDropdown === type ? null : type;
  }

  isPopupDropdownOpen(type: PopupDropdownType): boolean {
    return this.openPopupDropdown === type;
  }

  selectPopupRoom(value: string, event: Event): void {
    event.stopPropagation();
    this.classificationForm.roomCode = value;
    this.openPopupDropdown = null;
  }

  selectPopupStyle(value: string, event: Event): void {
    event.stopPropagation();
    this.classificationForm.styleCode = value;
    this.openPopupDropdown = null;
  }

  getPopupRoomText(): string {
    if (!this.classificationForm.roomCode) return 'Chọn mã loại phòng';
    const item = this.rooms.find((r) => r.Ma_loai_phong === this.classificationForm.roomCode);
    return item ? `${item.Ma_loai_phong} - ${item.Ten_loai_phong}` : this.classificationForm.roomCode;
  }

  getPopupStyleText(): string {
    if (!this.classificationForm.styleCode) return 'Chọn mã phong cách';
    const item = this.styles.find((s) => s.Ma_phong_cach === this.classificationForm.styleCode);
    return item ? `${item.Ma_phong_cach} - ${item.Ten_phong_cach}` : this.classificationForm.styleCode;
  }

  switchClassificationType(type: ClassificationType): void {
    this.activeClassificationType = type;
    this.openPopupDropdown = null;
    this.startCreateClassificationItem();
  }

  getClassificationTypeLabel(type: ClassificationType): string {
    switch (type) {
      case 'category':
        return 'Danh mục';
      case 'room':
        return 'Loại phòng';
      case 'style':
        return 'Phong cách';
      case 'concept':
        return 'Không gian';
      default:
        return '';
    }
  }

  getClassificationCodeLabel(): string {
    switch (this.activeClassificationType) {
      case 'category':
        return 'Mã danh mục';
      case 'room':
        return 'Mã loại phòng';
      case 'style':
        return 'Mã phong cách';
      case 'concept':
        return 'Mã không gian';
      default:
        return 'Mã';
    }
  }

  getClassificationNameLabel(): string {
    switch (this.activeClassificationType) {
      case 'category':
        return 'Tên danh mục';
      case 'room':
        return 'Tên loại phòng';
      case 'style':
        return 'Tên phong cách';
      case 'concept':
        return 'Tên không gian';
      default:
        return 'Tên';
    }
  }

  getActiveClassificationItems(): ClassificationListItem[] {
    switch (this.activeClassificationType) {
      case 'category':
        return this.categories.map((item) => ({
          code: item.Ma_danh_muc,
          name: item.Ten_danh_muc
        }));
      case 'room':
        return this.rooms.map((item) => ({
          code: item.Ma_loai_phong,
          name: item.Ten_loai_phong
        }));
      case 'style':
        return this.styles.map((item) => ({
          code: item.Ma_phong_cach,
          name: item.Ten_phong_cach
        }));
      case 'concept':
        return this.concepts.map((item) => ({
          code: item.Ma_khong_gian,
          name: item.Ten_khong_gian
        }));
      default:
        return [];
    }
  }

  startCreateClassificationItem(): void {
    this.selectedClassificationCode = '';
    this.openPopupDropdown = null;
    this.classificationForm = this.createEmptyClassificationForm();
    this.syncFormDefaultsForConcept();

    if (this.activeClassificationType === 'category') {
      this.categoryService.getNextCategoryCode().subscribe({
        next: (res) => this.classificationForm.code = res.nextCode,
        error: (err) => console.error('Không lấy được mã danh mục', err)
      });
    } else if (this.activeClassificationType === 'room') {
      this.roomService.getNextRoomCode().subscribe({
        next: (res) => this.classificationForm.code = res.nextCode,
        error: (err) => console.error('Không lấy được mã loại phòng', err)
      });
    } else if (this.activeClassificationType === 'style') {
      this.styleService.getNextStyleCode().subscribe({
        next: (res) => this.classificationForm.code = res.nextCode,
        error: (err) => console.error('Không lấy được mã phong cách', err)
      });
    } else if (this.activeClassificationType === 'concept') {
      this.conceptService.getNextConceptCode().subscribe({
        next: (res) => this.classificationForm.code = res.nextCode,
        error: (err) => console.error('Không lấy được mã concept', err)
      });
    }
  }

  selectClassificationItem(code: string): void {
    this.selectedClassificationCode = code;
    this.openPopupDropdown = null;

    if (this.activeClassificationType === 'category') {
      const item = this.categories.find((it) => it.Ma_danh_muc === code);
      if (!item) return;
      this.classificationForm = {
        ...this.createEmptyClassificationForm(),
        code: item.Ma_danh_muc,
        name: item.Ten_danh_muc,
        description: item.Mo_ta
      };
      return;
    }

    if (this.activeClassificationType === 'room') {
      const item = this.rooms.find((it) => it.Ma_loai_phong === code);
      if (!item) return;
      this.classificationForm = {
        ...this.createEmptyClassificationForm(),
        code: item.Ma_loai_phong,
        name: item.Ten_loai_phong,
        description: item.Mo_ta
      };
      return;
    }

    if (this.activeClassificationType === 'style') {
      const item = this.styles.find((it) => it.Ma_phong_cach === code);
      if (!item) return;
      this.classificationForm = {
        ...this.createEmptyClassificationForm(),
        code: item.Ma_phong_cach,
        name: item.Ten_phong_cach,
        description: item.Mo_ta
      };
      return;
    }

    const item = this.concepts.find((it) => it.Ma_khong_gian === code);
    if (!item) return;
    this.classificationForm = {
      ...this.createEmptyClassificationForm(),
      code: item.Ma_khong_gian,
      name: item.Ten_khong_gian,
      description: item.Mo_ta,
      roomCode: item.Ma_loai_phong,
      styleCode: item.Ma_phong_cach,
      image: item.Hinh_anh,
      status: item.Trang_thai
    };
    this.syncFormDefaultsForConcept();
  }

  private replaceProductClassificationCode(type: ClassificationType, oldCode: string, newCode: string): void {
    if (!oldCode || oldCode === newCode) {
      return;
    }

    if (type === 'category' && this.product.Ma_danh_muc === oldCode) {
      this.product.Ma_danh_muc = newCode;
    }

    if (type === 'room' && this.product.Ma_loai_phong === oldCode) {
      this.product.Ma_loai_phong = newCode;
    }

    if (type === 'style' && this.product.Ma_phong_cach === oldCode) {
      this.product.Ma_phong_cach = newCode;
    }

    if (type === 'concept' && this.product.Ma_khong_gian === oldCode) {
      this.product.Ma_khong_gian = newCode;
    }
  }

  private assignClassificationToProduct(code: string): void {
    if (this.activeClassificationType === 'category') {
      this.product.Ma_danh_muc = code;
      return;
    }

    if (this.activeClassificationType === 'room') {
      this.product.Ma_loai_phong = code;
      return;
    }

    if (this.activeClassificationType === 'style') {
      this.product.Ma_phong_cach = code;
      return;
    }

    this.product.Ma_khong_gian = code;
  }

  assignCurrentClassificationToProduct(): void {
    const code = this.classificationForm.code.trim();

    if (this.activeClassificationType === 'concept' && !code) {
      this.product.Ma_khong_gian = '';
      this.showSuccess('Đã chọn Không concept cho sản phẩm.');
      this.closeClassificationPopup();
      return;
    }

    if (!code) {
      this.showError('Vui lòng nhập hoặc chọn mã trước khi gán cho sản phẩm.');
      return;
    }

    this.assignClassificationToProduct(code);
    this.showSuccess('Đã cập nhật phân loại cho sản phẩm.');
    this.closeClassificationPopup();
  }

  selectNoConcept(): void {
    this.product.Ma_khong_gian = '';
    this.showSuccess('Đã chọn Không concept cho sản phẩm.');
    this.closeClassificationPopup();
  }

  getConceptImagePreviewUrl(): string {
    if (!this.classificationForm.image) return '';
    return this.productService.getImgUrl(this.classificationForm.image);
  }

  private extractConceptUploadFilename(imagePath: string): string | null {
    if (!imagePath || !imagePath.includes('/uploads/concepts/')) {
      return null;
    }

    const cleanPath = imagePath.split('?')[0]?.split('#')[0] ?? imagePath;
    const rawFilename = cleanPath.split('/').pop();

    if (!rawFilename) {
      return null;
    }

    const filename = rawFilename.trim();
    if (!filename || filename.includes('..') || filename.includes('\\') || filename.includes('/')) {
      return null;
    }

    return filename;
  }

  onConceptImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const previousImagePath = this.classificationForm.image;

    const formData = new FormData();
    formData.append('image', file);

    this.isConceptImageUploading = true;

    this.conceptService.uploadConceptImage(formData).subscribe({
      next: (res) => {
        this.classificationForm.image = res.relativePath || res.filePath;
        this.isConceptImageUploading = false;

        const oldFilename = this.extractConceptUploadFilename(previousImagePath);
        if (oldFilename) {
          this.conceptService.deleteConceptImage(oldFilename).subscribe({
            next: () => { },
            error: () => { }
          });
        }

        this.showSuccess('Tải ảnh không gian thành công!');
        input.value = '';
      },
      error: (err) => {
        this.isConceptImageUploading = false;
        this.showError('Lỗi tải ảnh không gian: ' + err.message);
        input.value = '';
      }
    });
  }

  removeConceptImage(): void {
    const currentImagePath = this.classificationForm.image;
    if (!currentImagePath) return;

    const filename = this.extractConceptUploadFilename(currentImagePath);
    if (!filename) {
      this.classificationForm.image = '';
      return;
    }

    this.isConceptImageUploading = true;
    this.conceptService.deleteConceptImage(filename).subscribe({
      next: () => {
        this.classificationForm.image = '';
        this.isConceptImageUploading = false;
        this.showSuccess('Đã xóa ảnh không gian trên máy chủ.');
      },
      error: (err) => {
        this.isConceptImageUploading = false;
        this.showError('Lỗi xóa ảnh không gian: ' + err.message);
      }
    });
  }

  saveClassificationItem(): void {
    const code = this.classificationForm.code.trim();
    const name = this.classificationForm.name.trim();
    const description = this.classificationForm.description.trim() || 'Không có mô tả';
    const previousCode = this.selectedClassificationCode;

    if (!code || !name) {
      this.showError('Vui lòng nhập đầy đủ mã và tên.');
      return;
    }

    if (this.activeClassificationType === 'category') {
      const payload: iCategory = {
        Ma_danh_muc: code,
        Ten_danh_muc: name,
        Mo_ta: description
      };

      const request = previousCode
        ? this.categoryService.updateCategory(previousCode, payload)
        : this.categoryService.addCategory(payload);

      request.subscribe({
        next: (saved) => {
          this.replaceProductClassificationCode('category', previousCode, saved.Ma_danh_muc);
          this.selectedClassificationCode = saved.Ma_danh_muc;
          this.loadClassificationData();
          this.showSuccess(previousCode ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!');
        },
        error: (err) => this.showError('Lỗi lưu danh mục: ' + err.message)
      });
      return;
    }

    if (this.activeClassificationType === 'room') {
      const payload: iRoom = {
        Ma_loai_phong: code,
        Ten_loai_phong: name,
        Mo_ta: description
      };

      const request = previousCode
        ? this.roomService.updateRoom(previousCode, payload)
        : this.roomService.addRoom(payload);

      request.subscribe({
        next: (saved) => {
          this.replaceProductClassificationCode('room', previousCode, saved.Ma_loai_phong);
          this.selectedClassificationCode = saved.Ma_loai_phong;
          this.loadClassificationData();
          this.showSuccess(previousCode ? 'Cập nhật loại phòng thành công!' : 'Thêm loại phòng thành công!');
        },
        error: (err) => this.showError('Lỗi lưu loại phòng: ' + err.message)
      });
      return;
    }

    if (this.activeClassificationType === 'style') {
      const payload: iStyle = {
        Ma_phong_cach: code,
        Ten_phong_cach: name,
        Mo_ta: description
      };

      const request = previousCode
        ? this.styleService.updateStyle(previousCode, payload)
        : this.styleService.addStyle(payload);

      request.subscribe({
        next: (saved) => {
          this.replaceProductClassificationCode('style', previousCode, saved.Ma_phong_cach);
          this.selectedClassificationCode = saved.Ma_phong_cach;
          this.loadClassificationData();
          this.showSuccess(previousCode ? 'Cập nhật phong cách thành công!' : 'Thêm phong cách thành công!');
        },
        error: (err) => this.showError('Lỗi lưu phong cách: ' + err.message)
      });
      return;
    }

    const roomCode = this.classificationForm.roomCode.trim();
    const styleCode = this.classificationForm.styleCode.trim();

    if (!roomCode || !styleCode) {
      this.showError('Vui lòng chọn mã loại phòng và mã phong cách cho không gian.');
      return;
    }

    const payload: iConcept = {
      Ma_khong_gian: code,
      Ten_khong_gian: name,
      Ma_loai_phong: roomCode,
      Ma_phong_cach: styleCode,
      Hinh_anh: this.classificationForm.image.trim() || 'concept-default.jpg',
      Mo_ta: description,
      Trang_thai: this.classificationForm.status
    };

    const request = previousCode
      ? this.conceptService.updateConcept(previousCode, payload)
      : this.conceptService.addConcept(payload);

    request.subscribe({
      next: (saved) => {
        this.replaceProductClassificationCode('concept', previousCode, saved.Ma_khong_gian);
        this.selectedClassificationCode = saved.Ma_khong_gian;
        this.loadClassificationData();
        this.showSuccess(previousCode ? 'Cập nhật không gian thành công!' : 'Thêm không gian thành công!');
      },
      error: (err) => this.showError('Lỗi lưu không gian: ' + err.message)
    });
  }

  deleteClassificationItem(): void {
    const code = (this.selectedClassificationCode || this.classificationForm.code).trim();

    if (!code) {
      this.showError('Vui lòng chọn mục cần xóa.');
      return;
    }

    this.openActionConfirm('delete-classification');
  }

  private performDeleteClassificationItem(): void {
    const code = (this.selectedClassificationCode || this.classificationForm.code).trim();

    if (!code) {
      this.showError('Vui lòng chọn mục cần xóa.');
      return;
    }

    if (this.activeClassificationType === 'category') {
      this.categoryService.deleteCategory(code).subscribe({
        next: () => {
          if (this.product.Ma_danh_muc === code) this.product.Ma_danh_muc = '';
          this.loadClassificationData();
          this.startCreateClassificationItem();
          this.showSuccess('Đã xóa danh mục thành công!');
        },
        error: (err) => this.showError('Lỗi xóa danh mục: ' + err.message)
      });
      return;
    }

    if (this.activeClassificationType === 'room') {
      this.roomService.deleteRoom(code).subscribe({
        next: () => {
          if (this.product.Ma_loai_phong === code) this.product.Ma_loai_phong = '';
          this.loadClassificationData();
          this.startCreateClassificationItem();
          this.showSuccess('Đã xóa loại phòng thành công!');
        },
        error: (err) => this.showError('Lỗi xóa loại phòng: ' + err.message)
      });
      return;
    }

    if (this.activeClassificationType === 'style') {
      this.styleService.deleteStyle(code).subscribe({
        next: () => {
          if (this.product.Ma_phong_cach === code) this.product.Ma_phong_cach = '';
          this.loadClassificationData();
          this.startCreateClassificationItem();
          this.showSuccess('Đã xóa phong cách thành công!');
        },
        error: (err) => this.showError('Lỗi xóa phong cách: ' + err.message)
      });
      return;
    }

    this.conceptService.deleteConcept(code).subscribe({
      next: () => {
        if (this.product.Ma_khong_gian === code) this.product.Ma_khong_gian = '';
        this.loadClassificationData();
        this.startCreateClassificationItem();
        this.showSuccess('Đã xóa không gian thành công!');
      },
      error: (err) => this.showError('Lỗi xóa không gian: ' + err.message)
    });
  }

  getCategoryText(): string {
    if (!this.product.Ma_danh_muc) return 'Chọn mã danh mục';
    const item = this.categories.find(c => c.Ma_danh_muc === this.product.Ma_danh_muc);
    return item ? `${item.Ma_danh_muc} - ${item.Ten_danh_muc}` : this.product.Ma_danh_muc;
  }

  getRoomText(): string {
    if (!this.product.Ma_loai_phong) return 'Chọn mã loại phòng';
    const item = this.rooms.find(r => r.Ma_loai_phong === this.product.Ma_loai_phong);
    return item ? `${item.Ma_loai_phong} - ${item.Ten_loai_phong}` : this.product.Ma_loai_phong;
  }

  getStyleText(): string {
    if (!this.product.Ma_phong_cach) return 'Chọn mã phong cách';
    const item = this.styles.find(s => s.Ma_phong_cach === this.product.Ma_phong_cach);
    return item ? `${item.Ma_phong_cach} - ${item.Ten_phong_cach}` : this.product.Ma_phong_cach;
  }

  getConceptText(): string {
    if (!this.product.Ma_khong_gian) return 'Không concept';
    const item = this.concepts.find(c => c.Ma_khong_gian === this.product.Ma_khong_gian);
    return item ? `${item.Ma_khong_gian} - ${item.Ten_khong_gian}` : this.product.Ma_khong_gian;
  }

  showSuccess(msg: string): void {
    alert(msg);
  }

  showError(msg: string): void {
    alert(msg);
  }

  uploadImages(id: string): void {
    const formData = new FormData();
    this.fileInputs.forEach((input) => {
      const files = input.nativeElement.files;
      if (files && files.length > 0) {
        Array.from(files).forEach(file => {
          formData.append('images', file);
        });
      }
    });

    this.productService.uploadImages(id, formData).subscribe({
      next: () => console.log('Ảnh đã upload'),
      error: (err) => console.error('Lỗi upload ảnh', err)
    });
  }


  previewImage(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    const files = input?.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (idx === 0) {
          this.images[index] = e.target.result;
        } else {

          this.images.splice(index + idx, 0, e.target.result);
        }
        this.checkAndAddNewPlaceholder();
      };
      reader.readAsDataURL(file);
    });
  }

  private checkAndAddNewPlaceholder(): void {
    if (!this.images.some(img => img === null)) {
      this.images.push(null);
    }

    const lastIndex = this.images.lastIndexOf(null);
    this.images = this.images.filter((img, idx) => img !== null || idx === lastIndex);
  }



  triggerFileInput(index: number): void {
    const input = this.fileInputs.toArray()[index];
    input?.nativeElement.click();
  }

  deleteProduct(): void {
    if (!this.product.Ma_san_pham) {
      alert('Không có mã sản phẩm để xóa!');
      return;
    }

    this.openActionConfirm('delete-product');
  }

  private performDeleteProduct(): void {
    if (!this.product.Ma_san_pham) {
      alert('Không có mã sản phẩm để xóa!');
      return;
    }

    this.productService.deleteProduct(this.product.Ma_san_pham).subscribe({
      next: () => {
        alert('Sản phẩm đã được xóa!');
        this.router.navigate(['/product-list']);
      },
      error: (err) => {
        console.error(err);
        alert('Lỗi khi xóa sản phẩm!');
      }
    });
  }

  removeImage(index: number, event: Event): void {
    event.stopPropagation();

    const img = this.images[index];
    if (!img) return;

    if (img.startsWith('data:')) {
      const base64Index = this.images
        .slice(0, index)
        .filter(i => i && i.startsWith('data:')).length;
      this.selectedFiles.splice(base64Index, 1);

      this.images.splice(index, 1);
      this.checkAndAddNewPlaceholder();
      return;
    }

    this.images.splice(index, 1);
    this.checkAndAddNewPlaceholder();
    this.showSuccess('Bấm "Lưu sản phẩm" để cập nhật thay đổi!');
  }


  private isFormEmpty(): boolean {
    const allTextEmpty =
      !this.product.Ma_san_pham.trim() &&
      !this.product.Ten_san_pham.trim() &&
      !this.product.Mo_ta.trim() &&
      !this.product.Kich_thuoc.trim() &&
      !this.product.Chat_lieu.trim() &&
      !this.product.Ma_loai_phong &&
      !this.product.Ma_phong_cach &&
      !this.product.Ma_danh_muc &&
      !this.product.Ma_khong_gian;

    const numberNotChanged =
      this.product.Gia_ban === 0 &&
      this.product.So_luong_ton_kho === 0;

    const noImage = !this.images.some(img => img !== null);

    return allTextEmpty && numberNotChanged && noImage;
  }

  cancelForm(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isFormEmpty()) {
      alert('Bạn chưa nhập nội dung nào!');
      return;
    }

    this.openActionConfirm('cancel-form');
  }

  saveDraft(): void {
    if (this.isFormEmpty()) {
      alert('Bạn chưa nhập thông tin nào nên không thể lưu nháp!');
      return;
    }

    console.log('Lưu nháp:', this.product);
    alert('Đã lưu nháp thành công!');
  }

  requestSaveProduct(event?: Event): void {
    if (this.showActionConfirm) {
      return;
    }

    event?.preventDefault();
    event?.stopPropagation();
    this.openActionConfirm('save-product');
  }

  saveProduct(): void {
    const missingFields: string[] = [];
    const priceValue = Number(this.product.Gia_ban);

    if (!this.product.Ma_san_pham.trim())
      missingFields.push('Mã sản phẩm');

    if (!this.product.Ten_san_pham.trim())
      missingFields.push('Tên sản phẩm');

    if (this.product.Gia_ban === null || this.product.Gia_ban === undefined || Number.isNaN(priceValue))
      missingFields.push('Giá bán');

    if (!this.product.Mo_ta.trim())
      missingFields.push('Mô tả chi tiết');

    if (!this.product.Kich_thuoc.trim())
      missingFields.push('Kích thước');

    if (!this.product.Chat_lieu.trim())
      missingFields.push('Chất liệu');

    if (!this.product.Ma_danh_muc)
      missingFields.push('Danh mục');

    if (!this.product.Ma_phong_cach)
      missingFields.push('Phong cách');

    if (!this.product.Ma_loai_phong)
      missingFields.push('Loại phòng');

    const hasImage = this.images.some(img => img !== null);
    if (!hasImage)
      missingFields.push('Ít nhất 1 hình minh họa');

    if (missingFields.length > 0) {
      alert(
        'Vui lòng nhập đầy đủ:\n- ' +
        missingFields.join('\n- ')
      );
      return;
    }

    const formData = new FormData();
    let hasNewFiles = this.selectedFiles.length > 0;

    this.selectedFiles.forEach(file => formData.append('images', file));

    this.product.Hinh_anh = this.images
      .filter(img => img && !img.startsWith('data:')) as string[];

    const payload: any = {
      ...this.product,
      Ma_khong_gian: this.product.Ma_khong_gian || null
    };

    const idFromUrl = this.route.snapshot.paramMap.get('id');

    if (idFromUrl) {
      this.productService.updateProduct(idFromUrl, payload).subscribe({
        next: () => {
          if (hasNewFiles) {
            this.uploadAfterSave(idFromUrl, formData);
          } else {
            this.showSuccess('Cập nhật thành công!');
            this.router.navigate(['/product-list']);
          }
        },
        error: (err) => this.showError('Lỗi cập nhật: ' + err.message)
      });
    } else {
      this.productService.addProduct(payload).subscribe({
        next: (res) => {
          const newCode = res.Ma_san_pham;
          if (hasNewFiles) {
            this.uploadAfterSave(newCode, formData);
          } else {
            this.showSuccess('Thêm mới thành công!');
            this.router.navigate(['/product-list']);
          }
        },
        error: (err) => this.showError('Lỗi thêm mới: ' + err.message)
      });
    }
  }

  private uploadAfterSave(code: string, formData: FormData): void {
    this.productService.uploadImages(code, formData).subscribe({
      next: () => {
        this.showSuccess('Lưu sản phẩm và tải ảnh thành công!');
        localStorage.removeItem('dwelly_product_draft');
        this.selectedFiles = [];

        this.router.navigate(['/product-list']);
      },
      error: () => this.showError('Đã lưu thông tin nhưng tải ảnh thất bại!')
    });
  }

  private syncOriginalState(): void {
    this.originalProduct = {
      ...this.product,
      Hinh_anh: [...(this.product.Hinh_anh || [])]
    };
    this.originalImages = this.images.length ? [...this.images] : [null, null, null, null];
  }

  private restoreFormState(): void {
    if (this.isEditMode && this.originalProduct) {
      this.product = {
        ...this.originalProduct,
        Hinh_anh: [...(this.originalProduct.Hinh_anh || [])]
      };
      this.images = this.originalImages.length ? [...this.originalImages] : [null, null, null, null];
      this.selectedFiles = [];
      this.checkAndAddNewPlaceholder();
      return;
    }

    this.resetForm();
  }


  private resetForm(): void {
    this.product = {
      Ma_san_pham: '',
      Ten_san_pham: '',
      Gia_ban: 0,
      Mo_ta: '',
      Kich_thuoc: '',
      Chat_lieu: '',
      Hinh_anh: [],
      So_luong_ton_kho: 0,
      Ma_loai_phong: '',
      Ma_phong_cach: '',
      Ma_danh_muc: '',
      Ma_khong_gian: '',
      Trang_thai: true
    };
    this.selectedFiles = [];

    this.images = [null, null, null, null];
  }
}
