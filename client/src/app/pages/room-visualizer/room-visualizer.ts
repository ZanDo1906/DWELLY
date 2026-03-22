import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomVisualizerService } from '../../services/room-visualizer';
import { Product as ProductService } from '../../services/product';
import { Category as CategoryService } from '../../services/category';
import { Room as RoomService } from '../../services/room';
import { Style as StyleService } from '../../services/style';
import { Client as ClientService } from '../../services/client';
import { Cart as CartService } from '../../services/cart';
import { iProduct } from '../../interfaces/product';
import { iCategory } from '../../interfaces/category';
import { iRoom } from '../../interfaces/room';
import { iStyle } from '../../interfaces/style';

@Component({
  selector: 'app-room-visualizer',
  standalone: true,
  templateUrl: './room-visualizer.html',
  styleUrls: ['./room-visualizer.css'],
  imports: [CommonModule]
})
export class RoomVisualizer implements OnInit {

  selectedFile!: File;
  resultImage: string = '';
  loading = false;
  previewUrl: string = '';
  products: iProduct[] = [];
  categories: iCategory[] = [];
  rooms: iRoom[] = [];
  styles: iStyle[] = [];
  loadingProducts = false;
  productError = '';
  selectedProductCodes: string[] = [];
  activePreview: 'original' | 'generated' = 'generated';
  searchTerm = '';
  selectedRoomCode = 'all';
  selectedCategoryCode = 'all';
  selectedStyleCode = 'all';
  openDropdown: 'room' | 'category' | 'style' | null = null;
  notifiedProductId: string | null = null;
  private categoryNameByCode: Record<string, string> = {};
  private vndFormatter = new Intl.NumberFormat('vi-VN');

  constructor(
    private visualizerService: RoomVisualizerService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private roomService: RoomService,
    private styleService: StyleService,
    private clientService: ClientService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadRooms();
    this.loadStyles();
    this.loadProducts();
  }

  loadCategories() {
    this.categoryService.getCategoryData().subscribe({
      next: (res) => {
        this.categories = res || [];
        this.categoryNameByCode = this.categories.reduce((acc, item) => {
          acc[item.Ma_danh_muc] = item.Ten_danh_muc;
          return acc;
        }, {} as Record<string, string>);
      },
      error: () => {
        this.categoryNameByCode = {};
      }
    });
  }

  loadRooms() {
    this.roomService.getRoomData().subscribe({
      next: (res) => {
        this.rooms = res || [];
      },
      error: () => {
        this.rooms = [];
      }
    });
  }

  loadStyles() {
    this.styleService.getStyleData().subscribe({
      next: (res) => {
        this.styles = res || [];
      },
      error: () => {
        this.styles = [];
      }
    });
  }

  loadProducts() {
    this.loadingProducts = true;
    this.productError = '';

    this.productService.getProductData().subscribe({
      next: (res) => {
        this.products = (res || []).filter((item) => item.Trang_thai !== false);

        this.loadingProducts = false;
      },
      error: () => {
        this.productError = 'Khong tai duoc danh sach san pham';
        this.loadingProducts = false;
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (!this.selectedFile) return;
    this.previewUrl = URL.createObjectURL(this.selectedFile);
    this.resultImage = '';
    this.activePreview = 'original';
  }

  onChangeImage(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  downloadResult() {
    if (!this.resultImage) return;

    const link = document.createElement('a');
    link.href = this.resultImage;
    link.download = `room-visualized-${Date.now()}.png`;
    link.click();
  }

  toggleFurniture(productCode: string) {
    const existingIndex = this.selectedProductCodes.indexOf(productCode);

    if (existingIndex >= 0) {
      this.selectedProductCodes.splice(existingIndex, 1);
      return;
    }

    this.selectedProductCodes.push(productCode);
  }

  isFurnitureSelected(productCode: string) {
    return this.selectedProductCodes.includes(productCode);
  }

  isFavorite(productId: string): boolean {
    const user = this.clientService.getCurrentUser();
    if (!user || !user.favorites) return false;
    return user.favorites.includes(productId);
  }

  toggleFavorite(event: Event, productId: string) {
    event.preventDefault();
    event.stopPropagation();
    const user = this.clientService.getCurrentUser();
    if (!user) {
      alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích');
      return;
    }
    const maKhachHang = user.customerCode ?? user.Ma_khach_hang;
    this.clientService.toggleFavorite(maKhachHang, productId)
      .subscribe({
        next: (res: any) => {
          user.favorites = res.favorites;
          localStorage.setItem('current_user', JSON.stringify(user));
        },
        error: (err) => console.error(err)
      });
  }

  goToCart(event: Event, productId: string) {
    event.preventDefault();
    event.stopPropagation();
    this.cartService.addItem(productId);
    
    this.notifiedProductId = productId;
    setTimeout(() => {
      if (this.notifiedProductId === productId) {
        this.notifiedProductId = null;
      }
    }, 1500);
  }

  getSelectedProducts(): iProduct[] {
    return this.products.filter((item) => this.selectedProductCodes.includes(item.Ma_san_pham));
  }

  getProductImage(product: iProduct): string {
    const firstImage = product.Hinh_anh?.[0] || '';
    return this.productService.getImgUrl(firstImage);
  }

  getProductPrice(product: iProduct): string {
    return `${this.vndFormatter.format(product.Gia_ban || 0)}đ`;
  }

  getCategoryName(product: iProduct): string {
    return this.categoryNameByCode[product.Ma_danh_muc] || 'Danh muc';
  }

  setSearchTerm(value: string) {
    this.searchTerm = value || '';
  }

  setRoomFilter(value: string) {
    this.selectedRoomCode = value || 'all';
  }

  setCategoryFilter(value: string) {
    this.selectedCategoryCode = value || 'all';
  }

  setStyleFilter(value: string) {
    this.selectedStyleCode = value || 'all';
  }

  toggleDropdown(type: 'room' | 'category' | 'style', event: Event) {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === type ? null : type;
  }

  closeDropdown() {
    this.openDropdown = null;
  }

  getSelectedRoomLabel(): string {
    if (this.selectedRoomCode === 'all') return 'Loại phòng';
    return this.rooms.find((item) => item.Ma_loai_phong === this.selectedRoomCode)?.Ten_loai_phong || 'Loại phòng';
  }

  getSelectedCategoryLabel(): string {
    if (this.selectedCategoryCode === 'all') return 'Loại sản phẩm';
    return this.categories.find((item) => item.Ma_danh_muc === this.selectedCategoryCode)?.Ten_danh_muc || 'Loại sản phẩm';
  }

  getSelectedStyleLabel(): string {
    if (this.selectedStyleCode === 'all') return 'Phong cách';
    return this.styles.find((item) => item.Ma_phong_cach === this.selectedStyleCode)?.Ten_phong_cach || 'Phong cách';
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.openDropdown = null;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedRoomCode = 'all';
    this.selectedCategoryCode = 'all';
    this.selectedStyleCode = 'all';
  }

  get filteredProducts(): iProduct[] {
    const keyword = this.searchTerm.trim().toLowerCase();

    return this.products.filter((item) => {
      const matchKeyword =
        !keyword ||
        item.Ten_san_pham.toLowerCase().includes(keyword) ||
        this.getCategoryName(item).toLowerCase().includes(keyword);

      const matchRoom =
        this.selectedRoomCode === 'all' ||
        item.Ma_loai_phong === this.selectedRoomCode;

      const matchCategory =
        this.selectedCategoryCode === 'all' ||
        item.Ma_danh_muc === this.selectedCategoryCode;

      const matchStyle =
        this.selectedStyleCode === 'all' ||
        item.Ma_phong_cach === this.selectedStyleCode;

      return matchKeyword && matchRoom && matchCategory && matchStyle;
    }).sort((a, b) => {
      const aSelected = this.isFurnitureSelected(a.Ma_san_pham);
      const bSelected = this.isFurnitureSelected(b.Ma_san_pham);

      if (aSelected === bSelected) {
        return 0;
      }

      return aSelected ? -1 : 1;
    });
  }

  getMainImage(): string {
    if (this.activePreview === 'original') {
      return this.previewUrl;
    }

    return this.resultImage || this.previewUrl;
  }

  setPreviewMode(mode: 'original' | 'generated') {
    if (mode === 'generated' && !this.resultImage) {
      return;
    }
    this.activePreview = mode;
  }

  generate() {
    if (!this.selectedFile) return;
    if (!this.selectedProductCodes.length) {
      alert('Hay chon it nhat 1 san pham noi that');
      return;
    }

    const selectedNames = this.getSelectedProducts()
      .map((item) => item.Ten_san_pham)
      .filter(Boolean);

    if (!selectedNames.length) {
      alert('Khong lay duoc ten san pham de gui cho AI');
      return;
    }

    this.loading = true;
    this.resultImage = '';

    this.visualizerService
      .generateRoom(this.selectedFile, selectedNames)
      .subscribe({
        next: (res) => {
          this.resultImage = res.image; // URL ảnh trả về
          this.activePreview = 'generated';
          this.loading = false;
        },
        error: () => {
          alert('Loi generate anh!');
          this.loading = false;
        }
      });
  }
}