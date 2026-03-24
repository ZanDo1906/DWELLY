import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../services/product';
import { Client } from '../../../services/client';
import { CareInstruction } from '../../../services/care_instruction';
import { Review } from '../../../services/review';
import { Order_Details } from '../../../services/order_details';
import { Cart } from '../../../services/cart';
import { iProduct } from '../../../interfaces/product';
import { iReview } from '../../../interfaces/review';
import { ProductCard } from '../../../components/product-card/product-card';
import { MaintenanceModal } from '../maintenance-modal/maintenance-modal';
import { Modal } from '../../../components/modal/modal';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, 
    DecimalPipe, 
    DatePipe, 
    ProductCard, 
    MaintenanceModal,
    Modal
  ],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css'],
})
export class ProductDetail implements OnInit, OnDestroy {
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
  totalFavorites: number = 0;
  isFavorite: boolean = false;
  soldCount: number = 0;
  showCartNotification = false;
  isMaintenanceOpen = false;
  selectedCareData: any = null;
  allCareInstructions: any[] = [];
  productCareInstruction: any = null;
  
  stockErrorMessage: string = '';
  private routeSub: Subscription | null = null;
  private cartNotificationTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public productService: Product,
    private reviewService: Review, 
    private careService: CareInstruction,     
    private clientService: Client, 
    private route: ActivatedRoute,
    private router: Router,
    private orderDetailsService: Order_Details,
    private cartService: Cart
  ) {}

 @ViewChild('scrollRow') scrollRow!: ElementRef<HTMLDivElement>;
 @ViewChild('reviewSortDropdown') reviewSortDropdown?: ElementRef<HTMLElement>;

 @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    if (!this.dropdownOpen) return;

    const dropdownElement = this.reviewSortDropdown?.nativeElement;
    if (!dropdownElement) {
      this.dropdownOpen = false;
      return;
    }

    if (event.target instanceof Node && !dropdownElement.contains(event.target)) {
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
    this.routeSub = this.route.paramMap.subscribe((pm) => {
      const code = pm.get('id'); 

      if (code) {
        // Gọi API lấy trực tiếp sản phẩm theo mã
        this.productService.getProductByCode(code).subscribe({
          next: (data) => {
            this.product = data;
            this.selectedImage = this.product.Hinh_anh?.[0] ?? '';
            this.checkIfFavorite();
            this.loadExtraData();
          },
          error: (err) => console.error('Không tìm thấy sản phẩm này!', err),
        });
      }
    });
    this.loadClientsFromDB();
  }

  loadClientsFromDB() {
    this.clientService.getClientData().subscribe({
      next: (data) => (this.clients = data),
      error: (err) => console.error('Lỗi load danh sách khách hàng', err),
    });
  }

    loadExtraData() {
    if (!this.product) return;

    this.loadSoldCount(this.product.Ma_san_pham);

    this.clientService.getFavoriteCount(this.product.Ma_san_pham).subscribe({
      next: (res) => {
        this.totalFavorites = res.count;
      },
      error: (err) => (this.totalFavorites = 0)
    });

    this.reviewService.getReviewsByProduct(this.product.Ma_san_pham).subscribe({
      next: (data) => {
        this.productReviews = data;
        this.sortReviews();
        this.calcAverage();
      }
    });

    this.careService.getCareByCategory(this.product.Ma_danh_muc).subscribe({
      next: (data) => {
        this.productCareInstruction = data;
      },
      error: (err) => console.error('Lỗi load bảo dưỡng', err)
    });

    this.productService.getProductData().subscribe({
      next: (list) => {
        this.relatedProducts = this.getRelatedProducts(this.product!, list);
      }
    });
  }

  private loadSoldCount(productId: string): void {
    this.orderDetailsService.getOrderDetailsData().subscribe({
      next: (orderDetails) => {
        this.soldCount = orderDetails
          .filter((detail) => String(detail.Ma_san_pham) === String(productId))
          .reduce((sum, detail) => sum + Number(detail.So_luong || 0), 0);
      },
      error: () => {
        this.soldCount = 0;
      }
    });
  }

  checkIfFavorite() {
  if (!this.product) return;

  const user = this.clientService.getCurrentUser();

  if (!user || !user.favorites) {
    this.isFavorite = false;
    return;
  }

  this.isFavorite = user.favorites.includes(this.product.Ma_san_pham);
}

  toggleLike() {

  if (!this.clientService.isLoggedIn()) {
    alert('Vui lòng đăng nhập để yêu thích sản phẩm!');
    return;
  }

  if (!this.product) return;

  const user = this.clientService.getCurrentUser();
  const maKhachHang = user?.customerCode;

  if (!maKhachHang) {
    console.error("Không tìm thấy mã khách hàng");
    return;
  }

  this.clientService.toggleFavorite(maKhachHang, this.product.Ma_san_pham)
    .subscribe({
      next: (res: any) => {

        user.favorites = res.favorites;

        this.isFavorite = user.favorites.includes(this.product!.Ma_san_pham);

        this.totalFavorites = res.favoritesCount ?? this.totalFavorites;

        localStorage.setItem('current_user', JSON.stringify(user));
      },
      error: (err) => console.error('Lỗi khi yêu thích:', err)
    });
}
  getClientName(maKhachHang: string): string {
    const client = this.clients.find(c => c.Ma_khach_hang === maKhachHang);
    return client ? client.Ho_va_ten : maKhachHang;
  }

  getClientAvatar(maKhachHang: string): string {
    const client = this.clients.find(c => c.Ma_khach_hang === maKhachHang);
    const avatar = String(client?.Anh_dai_dien || '').trim();

    if (!avatar) return 'assets/images/avatar.png';
    if (avatar.startsWith('http') || avatar.startsWith('assets')) return avatar;
    if (avatar.startsWith('/uploads')) return `http://localhost:3000${avatar}`;
    if (avatar.startsWith('uploads/')) return `http://localhost:3000/${avatar}`;

    return avatar;
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    img.src = 'assets/images/avatar.png';
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
    if (this.quantity < this.product.So_luong_ton_kho) {
      this.quantity++;
    } else {
      this.openStockErrorModal(`Rất tiếc, sản phẩm này chỉ còn ${this.product.So_luong_ton_kho} sản phẩm trong kho.`);
    }
  }

  decrease() {
    if (this.quantity > 1) this.quantity--;
  }

  sortLabels: Record<string, string> = { newest: 'Mới nhất', oldest: 'Cũ nhất', highest: 'Đánh giá cao nhất', lowest: 'Đánh giá thấp nhất' }; 
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  getLabel(type: string) {
  switch (type) {
    case 'newest': return 'Mới nhất';
    case 'oldest': return 'Cũ nhất';
    case 'highest': return 'Đánh giá cao nhất';
    case 'lowest': return 'Đánh giá thấp nhất';
    default: return 'Mới nhất';
  }
}
  setSort(type: string) {
  this.sortType = type;
  this.sortReviews();
  this.dropdownOpen = false;
}
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
  switch (this.sortType) {

    case 'newest':
      this.productReviews.sort(
        (a, b) => new Date(b.Thoi_gian_gui).getTime() - new Date(a.Thoi_gian_gui).getTime()
      );
      break;

    case 'oldest':
      this.productReviews.sort(
        (a, b) => new Date(a.Thoi_gian_gui).getTime() - new Date(b.Thoi_gian_gui).getTime()
      );
      break;

    case 'highest':
      this.productReviews.sort(
        (a, b) => b.Diem_danh_gia - a.Diem_danh_gia
      );
      break;

    case 'lowest':
      this.productReviews.sort(
        (a, b) => a.Diem_danh_gia - b.Diem_danh_gia
      );
      break;
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

  getDiscountPercent(p: iProduct | undefined): number {
    if (!p) return 0;
    return (p as any).Phan_tram_giam_gia ?? 0;
  }

  getOldPrice(p: iProduct | undefined): string {
    if (!p?.Gia_ban) return '';
    return p.Gia_ban.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VNĐ';
  }
  
  getFinalPrice(p: iProduct | undefined): number {
    if (!p?.Gia_ban) return 0;
    const discount = this.getDiscountPercent(p);
    return p.Gia_ban * (1 - discount / 100);
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
    if (!this.product) return;

    if (this.product.So_luong_ton_kho === 0 || this.quantity > this.product.So_luong_ton_kho) {
      this.openStockErrorModal(`Rất tiếc, sản phẩm này chỉ còn ${this.product.So_luong_ton_kho} sản phẩm trong kho.`);
      return;
    }

    this.buyClicked = true;

    const checkoutQuantity = Math.max(1, this.quantity);
    const finalPrice = this.getFinalPrice(this.product);
    const totalAmount = finalPrice * checkoutQuantity;

    localStorage.setItem('checkoutItems', JSON.stringify({
      items: [{ product: this.product, quantity: checkoutQuantity }],
      voucherCode: '',
      appliedVoucher: null,
      summary: {
        selectedCount: 1,
        totalAmount,
        discountAmount: 0,
        finalTotal: totalAmount,
      }
    }));

    const targetRoute = this.clientService.isLoggedIn()
      ? '/payment-member'
      : '/payment-non-member';

    this.router.navigate([targetRoute]);
  }

  addToCart(): void {
    if (!this.product) return;

    if (this.product.So_luong_ton_kho === 0 || this.quantity > this.product.So_luong_ton_kho) {
      this.openStockErrorModal(`Rất tiếc, sản phẩm này chỉ còn ${this.product.So_luong_ton_kho} sản phẩm trong kho.`);
      return;
    }

    this.cartService.addItem(this.product.Ma_san_pham, this.quantity);
    this.router.navigate(['/cart-page']);
  }

  openStockErrorModal(message: string): void {
    this.stockErrorMessage = message;
    const modalEl = document.getElementById('stockErrorModalProduct');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const existingModal = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);
      existingModal.show();
    }
  }

  closeStockErrorModal(): void {
    const modalEl = document.getElementById('stockErrorModalProduct');
    if (modalEl && (window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal?.hide();
    }
  }

  zoomImage: string | null = null;

  openModal(img: string) {
    this.zoomImage = img;
  }

  closeModal() {
    this.zoomImage = null;
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();

    if (this.cartNotificationTimer) {
      clearTimeout(this.cartNotificationTimer);
      this.cartNotificationTimer = null;
    }
  }
}

