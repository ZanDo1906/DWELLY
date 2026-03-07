import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { iProduct } from '../../../interfaces/product';
import { ProductCard } from '../../../components/product-card/product-card';
import { Product } from '../../../services/product';
import { iConcept } from '../../../interfaces/concept';
import { Concept } from '../../../services/concept';

@Component({
  selector: 'app-concept-detail',
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './concept-detail.html',
  styleUrls: ['./concept-detail.css'],
})
export class ConceptDetail implements OnInit {
  product?: iProduct;
  relatedProducts: iProduct[] = [];
  selectedImage = '';
  concepts: iConcept[] = [];
  conceptName = '';
  conceptImage = '';

  sortType: string = 'newest';
  dropdownOpen: boolean = false;


  constructor(
    public productService: Product,
    private conceptService: Concept,
    private route: ActivatedRoute,
    private http: HttpClient,
    private eRef: ElementRef
  ) {}
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
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

  sortLabels: Record<string, string> = {
    newest: 'Mới nhất',
    oldest: 'Cũ nhất',
    highest: 'Giá cao',
    lowest: 'Giá thấp'
  };

  toggleDropdown() {
    
    this.dropdownOpen = !this.dropdownOpen;
  }

  getLabel(type: string): string {
    return this.sortLabels[type] || '';
  }

  setSort(type: string) {
    this.sortType = type;
    this.sortProducts();
    this.dropdownOpen = false;
  }

  sortProducts() {
    if (!this.relatedProducts.length) return;

    if (this.sortType === 'highest') {
      this.relatedProducts.sort((a, b) => b.Gia_ban - a.Gia_ban);
    }
    if (this.sortType === 'lowest') {
      this.relatedProducts.sort((a, b) => a.Gia_ban - b.Gia_ban);
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

  }
