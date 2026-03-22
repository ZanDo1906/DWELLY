import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { forkJoin } from 'rxjs';
import { iClient } from '../../interfaces/client';
import { iReview } from '../../interfaces/review';
import { iBlog } from '../../interfaces/blog';
import { Client as ClientService } from '../../services/client';
import { Review as ReviewService } from '../../services/review';
import { Blog as BlogService } from '../../services/blog';
import { Product as ProductService } from '../../services/product';
import { ProductCard } from '../../components/product-card/product-card';
import { iProduct } from '../../interfaces/product';
import { RouterLink } from '@angular/router';
import { Banner as BannerService } from '../../services/banner';
import { iBanner } from '../../interfaces/banner';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule,RouterLink,ProductCard],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  products: iProduct[] = [];
  displayedCount: number = 8;
  reviews: Array<{
    content: string;
    rating: number;
    name: string;
    avatar: string;
  }> = [];
  blogs: iBlog[] = [];
  currentReviewIndex = 0;
  currentBlogPage = 0;
  showBlogSlider = false;

  rooms = [
    { name: 'LIVING ROOM', img: 'assets/images/banner/livingroom.jpg' },
    { name: 'BED ROOM', img: 'assets/images/banner/bedroom.png' },
    { name: 'DINING ROOM', img: 'assets/images/banner/diningroom.jpg' },
  ];
  currentIndex = 0;
  currentReviewPage = 0;

  heroBanners: iBanner[] = [];
  currentHeroIndex = 0;
  heroInterval: any;

  heroData = {
    subtitle: 'NỘI THẤT CAO CẤP',
    title: 'Kiến Tạo Không Gian\nSống Đầy Cảm Hứng',
    description: 'Nội thất hiện đại, tinh tế trong từng chi tiết,\nmang đến sự hài hòa cho mọi không gian sống.',
    backgroundImage: 'assets/images/banner/hero.jpg',
    ctaText: 'Khám Phá Ngay',
    ctaLink: '/product-list',
    ctaIsExternal: false,
    overlayType: 'dark' as 'none' | 'dark' | 'light' | 'gradient' | 'custom',
    overlayColor: 'rgba(80, 55, 35, 0.65)',
  };

  constructor(
    private reviewService: ReviewService,
    private clientService: ClientService,
    private blogService: BlogService,
    private productService: ProductService,
    private bannerService: BannerService,
  ) {}

  ngOnInit() {
    document.body.classList.add('homepage');
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.rooms.length;
    }, 2000); // 2s mỗi lần xoay

    this.loadReviews();
    this.loadBlogs();
    this.loadProducts();
    this.loadHeroBanner();
  }

  ngAfterViewInit() {
    this.setupScrollAnimations();
  }

  ngOnDestroy() {
    document.body.classList.remove('homepage');
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
    }
  }

  setupScrollAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach((section) => observer.observe(section));
  }

  getRoomByPosition(position: number) {
    const index = (this.currentIndex + position) % this.rooms.length;
    return this.rooms[index];
  }

  getStars(rating: number) {
    return '★'.repeat(Math.max(0, Math.min(5, Math.round(rating))));
  }

  nextReview() {
    if (this.reviews.length > 0) {
      this.currentReviewPage = (this.currentReviewPage + 1) % Math.ceil(this.reviews.length / 3);
    }
  }

  prevReview() {
    if (this.reviews.length > 0) {
      const totalPages = Math.ceil(this.reviews.length / 3);
      this.currentReviewPage = (this.currentReviewPage - 1 + totalPages) % totalPages;
    }
  }

  getReviewsForPage() {
    const start = this.currentReviewPage * 3;
    return this.reviews.slice(start, start + 3);
  }

  getReviewByPageIndex(pageIndex: number) {
    const start = pageIndex * 3;
    return this.reviews.slice(start, start + 3);
  }

  getTotalPages() {
    return Math.ceil(this.reviews.length / 3);
  }

  nextBlog() {
    this.showBlogSlider = true;
    const totalPages = Math.ceil(this.blogs.length / 3);
    this.currentBlogPage = (this.currentBlogPage + 1) % totalPages;
  }

  prevBlog() {
    this.showBlogSlider = true;
    const totalPages = Math.ceil(this.blogs.length / 3);
    this.currentBlogPage = (this.currentBlogPage - 1 + totalPages) % totalPages;
  }

  getBlogsByPage() {
    const start = this.currentBlogPage * 3;
    return this.blogs.slice(start, start + 3);
  }

  private loadReviews() {
    forkJoin({
      reviews: this.reviewService.getReviewData(),
      clients: this.clientService.getClientData(),
    }).subscribe(({ reviews, clients }) => {
      const clientMap = new Map<string, iClient>();
      clients.forEach((client) => clientMap.set(client.Ma_khach_hang, client));

      this.reviews = reviews
        .filter((review: iReview) => review.Diem_danh_gia >= 4)
        .slice(0, 9)
        .map((review: iReview) => {
          const client = clientMap.get(review.Ma_khach_hang);
          return {
            content: review.Noi_dung,
            rating: review.Diem_danh_gia,
            name: client?.Ho_va_ten ?? 'Khách hàng',
            avatar: client?.Anh_dai_dien ?? 'assets/images/avatar.png',
          };
        });
    });
  }

  private loadBlogs() {
    this.blogService.getBlogData().subscribe((blogs: iBlog[]) => {
      this.blogs = blogs.filter((blog) => blog.Trang_thai);
    });
  }

  private loadProducts() {
    forkJoin({
      products: this.productService.getProductData(),
      reviews: this.reviewService.getReviewData(),
    }).subscribe(({ products, reviews }) => {
      const ratingMap = new Map<string, { sum: number; count: number }>();
      reviews.forEach((review: iReview) => {
        const current = ratingMap.get(review.Ma_san_pham) ?? { sum: 0, count: 0 };
        current.sum += review.Diem_danh_gia;
        current.count += 1;
        ratingMap.set(review.Ma_san_pham, current);
      });

      const activeProducts = products.filter((product) => product.Trang_thai);
      const highRatedProducts = activeProducts.filter((product) => {
        const stats = ratingMap.get(product.Ma_san_pham);
        if (!stats || stats.count === 0) {
          return false;
        }
        const average = stats.sum / stats.count;
        return average >= 4.5;
      });

      const source = highRatedProducts.length ? highRatedProducts : activeProducts;
      this.products = this.shuffleProducts(source);
    });
  }

  private loadHeroBanner() {
    this.bannerService.getBannerData().subscribe((banners: iBanner[]) => {
      this.heroBanners = banners
        .filter((banner) => banner.Trang_thai && (banner.Trang === 'home' || banner.Trang === 'Trang chủ'))
        .sort((a, b) => Number(a.Thu_tu || 0) - Number(b.Thu_tu || 0));

      if (this.heroBanners.length === 0) {
        return;
      }
      
      this.updateHeroData();

      if (this.heroBanners.length > 1) {
        this.startHeroSlider();
      }
    });
  }

  private updateHeroData() {
    const heroBanner = this.heroBanners[this.currentHeroIndex];
    if (!heroBanner) return;

    const title = (heroBanner.Tieu_de_chinh || heroBanner.Tieu_de || '').trim();
    const description = (heroBanner.Mo_ta_ngan || heroBanner.Mo_ta || '').trim();
    const ctaLink = (heroBanner.CTA_link || heroBanner.Duong_dan || '').trim();
    const overlayColor = this.resolveOverlayColor(heroBanner);

    this.heroData = {
      subtitle: (heroBanner.Tieu_de_phu || '').trim(),
      title: title || this.heroData.title,
      description: description || this.heroData.description,
      backgroundImage: (heroBanner.Hinh_anh || '').trim() || this.heroData.backgroundImage,
      ctaText: (heroBanner.CTA_text || '').trim() || this.heroData.ctaText,
      ctaLink: ctaLink || this.heroData.ctaLink,
      ctaIsExternal: /^(https?:)?\/\//i.test(ctaLink),
      overlayType: heroBanner.Loai_overlay || 'dark',
      overlayColor,
    };
  }

  private startHeroSlider() {
    if (this.heroInterval) clearInterval(this.heroInterval);
    this.heroInterval = setInterval(() => {
      this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroBanners.length;
      this.updateHeroData();
    }, 5000);
  }

  setHeroIndex(index: number) {
    this.currentHeroIndex = index;
    this.updateHeroData();
    this.startHeroSlider(); // Reset interval
  }

  private resolveOverlayColor(heroBanner: iBanner): string {
    if (heroBanner.Loai_overlay === 'none') {
      return 'transparent';
    }

    if (heroBanner.Loai_overlay === 'light') {
      return 'rgba(255, 255, 255, 0.35)';
    }

    if (heroBanner.Loai_overlay === 'gradient') {
      return 'linear-gradient(135deg, rgba(80, 55, 35, 0.72), rgba(108, 82, 52, 0.45))';
    }

    if (heroBanner.Loai_overlay === 'custom' && heroBanner.Mau_overlay) {
      return heroBanner.Mau_overlay;
    }

    return 'rgba(80, 55, 35, 0.65)';
  }

  private shuffleProducts(items: iProduct[]): iProduct[] {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  get displayedProducts(): iProduct[] {
    return this.products.slice(0, this.displayedCount);
  }
}
