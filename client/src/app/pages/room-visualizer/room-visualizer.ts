import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Product } from '../../services/product';
import { Room } from '../../services/room';
import { Style } from '../../services/style';
import { iProduct } from '../../interfaces/product';

type RoomFilter = 'all' | 'living' | 'bedroom' | 'work';
type StyleFilter = 'all' | 'modern' | 'minimal' | 'japandi';

interface ProductCard {
  id: string;
  name: string;
  price: number;
  image: string;
  roomId: string;
  styleId: string;
  roomName: string;
  styleName: string;
}

@Component({
  selector: 'app-room-visualizer',
  imports: [CommonModule, FormsModule],
  templateUrl: './room-visualizer.html',
  styleUrl: './room-visualizer.css',
})
export class RoomVisualizer implements OnInit {
  search = '';
  selectedRoom: RoomFilter = 'all';
  selectedStyle: StyleFilter = 'all';

  loadingProducts = false;
  productError = '';

  imagePreview: string | null = null;
  resultImage: string | null = null;

  products: ProductCard[] = [];
  private allProducts: ProductCard[] = [];
  selectedProducts: ProductCard[] = [];

  constructor(
    private productService: Product,
    private roomService: Room,
    private styleService: Style
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productError = '';

    forkJoin({
      products: this.productService.getProductData(),
      rooms: this.roomService.getRoomData(),
      styles: this.styleService.getStyleData(),
    }).subscribe({
      next: ({ products, rooms, styles }) => {
        const roomMap = new Map(rooms.map((r) => [r.Ma_loai_phong, (r.Ten_loai_phong || '').toLowerCase()]));
        const styleMap = new Map(styles.map((s) => [s.Ma_phong_cach, (s.Ten_phong_cach || '').toLowerCase()]));

        this.allProducts = (products || [])
          .filter((p) => p?.Trang_thai !== false)
          .map((p: iProduct) => ({
            id: p.Ma_san_pham,
            name: p.Ten_san_pham,
            price: Number(p.Gia_ban) || 0,
            image: this.productService.getImgUrl(p.Hinh_anh?.[0] || ''),
            roomId: p.Ma_loai_phong,
            styleId: p.Ma_phong_cach,
            roomName: roomMap.get(p.Ma_loai_phong) || '',
            styleName: styleMap.get(p.Ma_phong_cach) || '',
          }));

        this.onFilterChange();
        this.loadingProducts = false;
      },
      error: (err: any) => {
        this.loadingProducts = false;
        this.productError = err?.message || 'Không tải được danh sách sản phẩm';
      },
    });
  }

  onFilterChange(): void {
    const keyword = this.search.trim().toLowerCase();

    this.products = this.allProducts.filter((p) => {
      const matchSearch = !keyword || p.name.toLowerCase().includes(keyword);
      const matchRoom = this.matchRoomFilter(p.roomName);
      const matchStyle = this.matchStyleFilter(p.styleName);
      return matchSearch && matchRoom && matchStyle;
    });
  }

  toggleProduct(product: ProductCard): void {
    const index = this.selectedProducts.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      this.selectedProducts.splice(index, 1);
      return;
    }

    this.selectedProducts.push(product);
  }

  isSelected(product: ProductCard): boolean {
    return this.selectedProducts.some((item) => item.id === product.id);
  }

  onUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.imagePreview = URL.createObjectURL(file);
    this.resultImage = null;
  }

  private matchRoomFilter(roomName: string): boolean {
    if (this.selectedRoom === 'all') {
      return true;
    }

    const room = (roomName || '').toLowerCase();
    const roomKeywordMap: Record<Exclude<RoomFilter, 'all'>, string[]> = {
      living: ['khach', 'living'],
      bedroom: ['ngu', 'bedroom'],
      work: ['lam viec', 'work', 'office'],
    };

    return roomKeywordMap[this.selectedRoom].some((k) => room.includes(k));
  }

  private matchStyleFilter(styleName: string): boolean {
    if (this.selectedStyle === 'all') {
      return true;
    }

    const style = (styleName || '').toLowerCase();
    const styleKeywordMap: Record<Exclude<StyleFilter, 'all'>, string[]> = {
      modern: ['modern', 'hien dai', 'hiện đại'],
      minimal: ['minimal', 'toi gian', 'tối giản'],
      japandi: ['japandi'],
    };

    return styleKeywordMap[this.selectedStyle].some((k) => style.includes(k));
  }

}
