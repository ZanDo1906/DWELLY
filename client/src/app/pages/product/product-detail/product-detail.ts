import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../../services/product';
import { iProduct } from '../../../interfaces/product';
import { iReview } from '../../../interfaces/review';
import { ProductCard } from '../../../components/product-card/product-card';
import { MaintenanceModal } from '../maintenance-modal/maintenance-modal';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, ProductCard, MaintenanceModal],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail implements OnInit {
  product?: iProduct;
  selectedImage: string = '';
  quantity = 1;
  slots: number[] = [0,1,2,3,4];
  allReviews: iReview[] = [];
  productReviews: iReview[] = [];
  activeTab: string = 'description';

  clients: any[] = [];
  sortType = 'newest';
  dropdownOpen = false;

  isMaintenanceOpen = false;
  selectedCareData: any = null;
  allCareInstructions: any[] = [];

  constructor(
    private productService: Product,
    private route: ActivatedRoute,
    private http: HttpClient,
    private eRef: ElementRef
  ) {}

 @ViewChild('scrollRow') scrollRow!: ElementRef<HTMLDivElement>;

 @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  @ViewChild('careList') careList!: ElementRef<HTMLDivElement>;

scrollCareLeft() {
  const item = this.careList.nativeElement.querySelector('.care-item') as HTMLElement;
  const itemWidth = item ? item.offsetWidth + 20 : 200;
  this.careList.nativeElement.scrollBy({ left: -itemWidth, behavior: 'smooth' });
}

scrollCareRight() {
  const item = this.careList.nativeElement.querySelector('.care-item') as HTMLElement;
  const itemWidth = item ? item.offsetWidth + 20 : 200;
  this.careList.nativeElement.scrollBy({ left: itemWidth, behavior: 'smooth' });
}

scrollLeft() {
  const card = this.scrollRow.nativeElement.querySelector('.product-item') as HTMLElement;
  const cardWidth = card ? card.offsetWidth + 25 : 300; 
  this.scrollRow.nativeElement.scrollBy({ left: -cardWidth, behavior: 'smooth' });
}

scrollRight() {
  const card = this.scrollRow.nativeElement.querySelector('.product-item') as HTMLElement;
  const cardWidth = card ? card.offsetWidth + 25 : 300;
  this.scrollRow.nativeElement.scrollBy({ left: cardWidth, behavior: 'smooth' });
}

  ngOnInit(): void {
  const id = this.route.snapshot.paramMap.get('id');
  this.productService.getProductData().subscribe({
    next: (list) => {
      if (!list || list.length === 0) return;
      if (id) {
        this.product = list.find((p) => p.Ma_san_pham === id) ?? list[0];
      } else {
        this.product = list[0];
      }
      this.selectedImage = this.product.Hinh_anh?.[0] ?? '';
      this.filterReviews();

      this.relatedProducts = this.getRelatedProducts(this.product, list);
      this.loadCareInstructions();
    },
    error: (err) => console.error('Failed to load products', err),
  });

 
  this.http.get<iReview[]>('assets/data/review.json')
    .subscribe({
      next: (data) => {
        this.allReviews = data;
        this.filterReviews();
      },
      error: (err) => console.error('Failed to load reviews', err),
    });

    this.http.get<any[]>('assets/data/client.json').subscribe({
  next: (data) => {
    this.clients = data;
    this.filterReviews(); 
  },
  error: (err) => console.error('Failed to load clients', err),
});

}
getClientName(maKhachHang: string): string {
  const client = this.clients.find(c => c.Ma_khach_hang === maKhachHang);
  return client ? client.Ho_va_ten : maKhachHang; 
}

productCareInstruction: any = null;
loadCareInstructions() {
  this.http.get<any[]>('assets/data/care_instruction.json').subscribe({
    next: (data) => {
      if (this.product) {
        this.productCareInstruction = data.find(item =>
          item.Ma_danh_muc.includes(this.product!.Ma_danh_muc)
        );

        if (this.productCareInstruction?.Link_video) {
          this.productCareInstruction.Link_video.forEach((v: string, i: number) => {
          });
        }
      }
    },
    error: (err) => console.error('Failed to load care instructions', err)
  });
}

openMaintenanceModal(videoIndex: number) {
  this.selectedCareData = { ...this.productCareInstruction, selectedVideoIndex: videoIndex };
  this.isMaintenanceOpen = true;
  document.body.style.overflow = 'hidden';
}

  closeMaintenanceModal() {
    this.isMaintenanceOpen = false;
    document.body.style.overflow = 'auto'; 
  }

getVideoTitle(index: number): string {
  const titlesMap: Record<string, string[]> = {
    'HD01': ['Cách vệ sinh Sofa vải đơn giản', 'Hướng dẫn làm sạch ghế Sofa nỉ như chuyên gia', '3 phương pháp vệ sinh Sofa tại nhà'],
    'HD02': ['Cách vệ sinh và bảo quản đồ nội thất gỗ', 'Mẹo bảo trì đồ gỗ bền đẹp lâu dài', 'Hướng dẫn phục hồi độ bóng bề mặt gỗ'],
    'HD03': ['Hướng dẫn vệ sinh đèn chùm và đèn trang trí', 'Các lưu ý bảo trì hệ thống chiếu sáng an toàn'],
    'HD04': ['Cách giặt gối đúng cách không bị biến dạng', 'Cẩm nang chăm sóc chăn ga gối nệm định kỳ'],
    'HD05': ['Cách vệ sinh thảm trải sàn cỡ lớn tại nhà', 'Quy trình làm sạch thảm chuyên nghiệp'],
  };
  return titlesMap[this.productCareInstruction?.Ma_huong_dan]?.[index] || `Video ${index+1}`;
}

  getVideoThumbnail(url: string): string {
  const match = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match 
    ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` 
    : 'assets/default-thumb.png';
}
  getVideoDuration(index: number): string {
  const durationsMap: Record<string, string[]> = {
    'HD01': ['4 phút', '2 phút', '4 phút'],
    'HD02': ['3 phút', '4 phút', '5 phút'],
    'HD03': ['2 phút', '4 phút'],
    'HD04': ['4 phút', '3 phút'],
    'HD05': ['2 phút', '5 phút']
  };
  return durationsMap[this.productCareInstruction?.Ma_huong_dan]?.[index] || '5 phút';
}


  thumbImage(i: number): string | null {
    return this.product?.Hinh_anh?.[i] ?? null;
  }

  onThumbClick(i: number) {
    const img = this.thumbImage(i);
    if (img) this.selectedImage = img;
  }

  emptySlots(): number[] {
    const have = this.product?.Hinh_anh?.length || 0;
    const n = Math.max(0, 5 - have);
    return Array.from({ length: n }, (_, i) => i);
  }

  increase() {
    if (!this.product) return;
    if (this.quantity < this.product.So_luong_ton_kho) this.quantity++;
  }

  decrease() {
    if (this.quantity > 1) this.quantity--;
  }

  sortLabels: Record<string, string> = { newest: 'Mới nhất', oldest: 'Cũ nhất', highest: 'Đánh giá cao nhất', lowest: 'Đánh giá thấp nhất' }; toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; } getLabel(type: string): string { return this.sortLabels[type] || ''; } setSort(type: string) { this.sortType = type; this.sortReviews(); this.dropdownOpen = false; }

  get moTaChinh(): string {
  const text = this.product?.Mo_ta || '';
  const key = 'Chi tiết kỹ thuật:';
  const index = text.indexOf(key);
  if (index === -1) return text;
  return text.substring(0, index).trim();
}

  get moTaKyThuat(): string {
    const text = this.product?.Mo_ta || '';
    const key = 'Chi tiết kỹ thuật:';
    const index = text.indexOf(key);
    if (index === -1) return '';
    return text.substring(index + key.length).trim();
  }
filterReviews() {
  if (!this.product || !this.allReviews.length) return;

  this.productReviews = this.allReviews
    .filter(r => r.Ma_san_pham === this.product?.Ma_san_pham);

  this.sortReviews();
  this.calcAverage();
}

  sortReviews() {
    if (this.sortType === 'newest') {
      this.productReviews.sort(
        (a, b) =>
          new Date(b.Thoi_gian_gui).getTime()
        - new Date(a.Thoi_gian_gui).getTime()
      );
    }

    if (this.sortType === 'oldest') {
      this.productReviews.sort(
        (a, b) =>
          new Date(a.Thoi_gian_gui).getTime()
        - new Date(b.Thoi_gian_gui).getTime()
      );
    }

    if (this.sortType === 'highest') {
      this.productReviews.sort(
        (a, b) => b.Diem_danh_gia - a.Diem_danh_gia
      );
    }

    if (this.sortType === 'lowest') {
      this.productReviews.sort(
        (a, b) => a.Diem_danh_gia - b.Diem_danh_gia
      );
    }
  }

  getCount(star: number): number {
    return this.productReviews.filter(r => r.Diem_danh_gia === star).length;
  }

  getPercent(star: number): number {
    const total = this.productReviews.length;
    if (!total) return 0;

    return (this.getCount(star) * 100) / total;
  }

  getOldPrice(p: iProduct | undefined): string {
  if (!p?.Gia_ban) return '';
  const giaCu = p.Gia_ban / 0.75;
  return giaCu.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VNĐ';
}

  averageRating = 0;
  Math = Math;

calcAverage() {
  if (!this.productReviews.length) {
    this.averageRating = 0;
    return;
  }

  const total = this.productReviews.reduce(
    (sum, r) => sum + r.Diem_danh_gia, 0
  );

  this.averageRating = total / this.productReviews.length;
}

get fullStars() {
  return Math.floor(this.averageRating);
}

get hasHalfStar() {
  return this.averageRating % 1 >= 0.5;
}
getRelatedProducts(current: iProduct, all: iProduct[]): iProduct[] {
  return all.filter(p => String(p.Ma_danh_muc) === String(current.Ma_danh_muc)
                      && p.Ma_san_pham !== current.Ma_san_pham);
}

relatedProducts: iProduct[] = [];

buyClicked = false;

onBuyClick() {
  this.buyClicked = true;
}

zoomImage: string | null = null;

openModal(img: string) {
  this.zoomImage = img;
}

closeModal() {
  this.zoomImage = null;
}

}

