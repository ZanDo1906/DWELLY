import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { iProduct } from '../../interfaces/product';
import { ProductCard } from '../product-card/product-card';
import { Product } from '../../services/product';
import { iConcept } from '../../interfaces/concept';
import { Concept } from '../../services/concept';

@Component({
  selector: 'app-product-detail-concept',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './product-detail-concept.html',
  styleUrls: ['./product-detail-concept.css'],
})
export class ProductDetailConcept implements OnInit {
  product?: iProduct;
  relatedProducts: iProduct[] = [];
  selectedImage = '';
  concepts: iConcept[] = [];
  conceptName = '';
  conceptImage = '';

  // thêm biến cho dropdown
  sortType: string = 'newest';
  dropdownOpen: boolean = false;


  constructor(
    private productService: Product,
    private conceptService: Concept,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.productService.getProductData().subscribe({
      next: (list: iProduct[]) => {
        if (!list || list.length === 0) return;

        this.product = id
          ? list.find(p => p.Ma_san_pham === id) ?? list[0]
          : list[0];

        this.selectedImage = this.product.Hinh_anh?.[0] ?? '';

        // lấy sản phẩm liên quan
        this.relatedProducts = this.getRelatedProducts(this.product, list);
        this.sortProducts(); // sắp xếp ngay khi load

        // load concept
        this.conceptService.getConceptData().subscribe({
          next: (data: iConcept[]) => {
            this.concepts = data;
            const cat = data.find(c => c.Ma_khong_gian === this.product?.Ma_khong_gian);
            this.conceptName = cat?.Ten_khong_gian ?? '';
            this.conceptImage = cat?.Hinh_anh ?? '';
          },
          error: (err: unknown) => console.error('Failed to load concepts', err),
        });
      },
      error: (err: unknown) => console.error('Failed to load products', err),
    });
  }

  // logic lọc/sắp xếp
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
      p => p.Ma_khong_gian === current.Ma_khong_gian && p.Ma_san_pham !== current.Ma_san_pham
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
