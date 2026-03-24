import { Component, OnDestroy, OnInit, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { iProduct } from '../../../interfaces/product';
import { ProductCard } from '../../../components/product-card/product-card';
import { Product } from '../../../services/product';
import { iConcept } from '../../../interfaces/concept';
import { Concept } from '../../../services/concept';
import { Cart } from '../../../services/cart';

@Component({
  selector: 'app-concept-detail',
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './concept-detail.html',
  styleUrls: ['./concept-detail.css'],
})
export class ConceptDetail implements OnInit, OnDestroy {
  @ViewChild('sortDropdown') sortDropdown?: ElementRef<HTMLElement>;

  product?: iProduct;
  relatedProducts: iProduct[] = [];
  selectedImage = '';
  concepts: iConcept[] = [];
  conceptName = '';
  conceptImage = '';

  sortType: string = 'highest';
  dropdownOpen: boolean = false;
  isAddingAll = false;
  addAllStatusMessage = '';
  private addAllStatusTimer: ReturnType<typeof setTimeout> | null = null;


  constructor(
    public productService: Product,
    private conceptService: Concept,
    private route: ActivatedRoute,
    private cartService: Cart
  ) {}
  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    if (!this.dropdownOpen) return;
    const dropdownElement = this.sortDropdown?.nativeElement;
    if (!dropdownElement) return;

    if (event.target instanceof Node && !dropdownElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  ngOnInit(): void {
    const conceptId = this.route.snapshot.paramMap.get('id');

    this.productService.getProductData().subscribe({
      next: (list: iProduct[]) => {
        if (!list || list.length === 0) return;

        const productsByConcept = conceptId
          ? list.filter((p) => p.Ma_khong_gian === conceptId)
          : list;

        if (productsByConcept.length === 0) {
          this.product = undefined;
          this.relatedProducts = [];

          this.conceptService.getConceptData().subscribe({
            next: (data: iConcept[]) => {
              this.concepts = data;
              const concept = conceptId
                ? data.find((c) => c.Ma_khong_gian === conceptId)
                : undefined;
              this.conceptName = concept?.Ten_khong_gian ?? '';
              this.conceptImage = concept?.Hinh_anh ?? '';
            },
            error: (err: unknown) => console.error('Failed to load concepts', err),
          });
          return;
        }

        this.product = productsByConcept[0];

        this.selectedImage = this.product.Hinh_anh?.[0] ?? '';

        this.relatedProducts = this.getRelatedProducts(this.product, productsByConcept);
        this.sortProducts(); 

        this.conceptService.getConceptData().subscribe({
          next: (data: iConcept[]) => {
            this.concepts = data;
            const resolvedConceptId = conceptId ?? this.product?.Ma_khong_gian;
            const cat = data.find(c => c.Ma_khong_gian === resolvedConceptId);
            this.conceptName = cat?.Ten_khong_gian ?? '';
            this.conceptImage = cat?.Hinh_anh ?? '';
          },
          error: (err: unknown) => console.error('Failed to load concepts', err),
        });
      },
      error: (err: unknown) => console.error('Failed to load products', err),
    });
}

  ngOnDestroy(): void {
    if (this.addAllStatusTimer) {
      clearTimeout(this.addAllStatusTimer);
      this.addAllStatusTimer = null;
    }
  }

  sortLabels: Record<string, string> = {
    highest: 'Giá cao',
    lowest: 'Giá thấp'
  };

  toggleDropdown() {
    
    this.dropdownOpen = !this.dropdownOpen;
  }

  getLabel(type: string): string {
    return this.sortLabels[type] || this.sortLabels['highest'];
  }

  setSort(type: string, event?: Event) {
    event?.stopPropagation();
    this.sortType = type;
    this.sortProducts();
    this.dropdownOpen = false;
  }

  getFinalPrice(product: iProduct): number {
    if (!product?.Gia_ban) return 0;
    const discount = product.Phan_tram_giam_gia ?? 0;
    return product.Gia_ban * (1 - discount / 100);
  }

  sortProducts() {
    if (!this.relatedProducts.length) return;

    if (this.sortType === 'highest') {
      this.relatedProducts.sort((a, b) => this.getFinalPrice(b) - this.getFinalPrice(a));
    }
    if (this.sortType === 'lowest') {
      this.relatedProducts.sort((a, b) => this.getFinalPrice(a) - this.getFinalPrice(b));
    }
  }

  getRelatedProducts(current: iProduct, all: iProduct[]): iProduct[] {
    return all.filter(
      p => p.Ma_khong_gian === current.Ma_khong_gian
    );
  }

  hovered: string|null = null;
  currentIndex: Record<string, number> = {};

  prevImage(p: iProduct) {
    const len = p.Hinh_anh?.length || 0;
    if (!len) return;
    const idx = this.currentIndex[p.Ma_san_pham] ?? 0;
    this.currentIndex[p.Ma_san_pham] = (idx - 1 + len) % len;
  }

  nextImage(p: iProduct) {
    const len = p.Hinh_anh?.length || 0;
    if (!len) return;
    const idx = this.currentIndex[p.Ma_san_pham] ?? 0;
    this.currentIndex[p.Ma_san_pham] = (idx + 1) % len;
  }

  addAllToCart(): void {
    if (this.isAddingAll || this.relatedProducts.length === 0) {
      return;
    }

    this.isAddingAll = true;

    const uniqueProductIds = Array.from(
      new Set(
        this.relatedProducts
          .map((product) => product.Ma_san_pham)
          .filter((productId) => Boolean(productId))
      )
    );

    uniqueProductIds.forEach((productId) => {
      this.cartService.addItem(productId, 1);
    });

    this.showAddAllStatus(`Đã thêm ${uniqueProductIds.length} sản phẩm vào giỏ hàng`);
    this.isAddingAll = false;
  }

  private showAddAllStatus(message: string): void {
    this.addAllStatusMessage = message;

    if (this.addAllStatusTimer) {
      clearTimeout(this.addAllStatusTimer);
    }

    this.addAllStatusTimer = setTimeout(() => {
      this.addAllStatusMessage = '';
      this.addAllStatusTimer = null;
    }, 1800);
  }

  }
