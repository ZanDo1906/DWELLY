import { Component, ViewChildren, QueryList, ElementRef, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { iProduct } from '../../../interfaces/product';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css'],
})
export class ProductForm implements OnInit {
  @Input() productData?: iProduct;
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(private route: ActivatedRoute, private router: Router) {} get currentRoute(): string { return this.router.url; }


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

  images: (string | null)[] = [null, null, null, null];

  async ngOnInit() {
    // Nếu có Input truyền vào thì ưu tiên dùng
    if (this.productData) {
      this.product = { ...this.productData };
      this.images = this.product.Hinh_anh.length
        ? this.product.Hinh_anh
        : [null, null, null, null];
      return;
    }

    // Nếu không có Input thì kiểm tra id từ route
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const res = await fetch('/assets/data/product.json');
      const data: iProduct[] = await res.json();
      const found = data.find(p => p.Ma_san_pham === id);
      if (found) {
        this.product = { ...found };
        if (this.product.Hinh_anh.length) {
  this.images = [...this.product.Hinh_anh];

  // đảm bảo ít nhất luôn có 4 ô ban đầu
  while (this.images.length < 4) {
    this.images.push(null);
  }

  this.checkAndAddNewPlaceholder();
} else {
  this.images = [null, null, null, null];
}
      }
    }
    // Nếu không có id thì giữ form rỗng để thêm sản phẩm
  }

  previewImage(event: any, index: number): void {
  const input = event.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e: any) => {
    this.images[index] = e.target.result;

    this.checkAndAddNewPlaceholder();
  };
  reader.readAsDataURL(file);
}

private checkAndAddNewPlaceholder(): void {
  const allFilled = this.images.every(img => img !== null);

  if (allFilled) {
    this.images.push(null);
  }
}

  triggerFileInput(index: number): void {
    const input = this.fileInputs.toArray()[index];
    input?.nativeElement.click();
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

  cancelForm(): void {
    if (this.isFormEmpty()) {
      alert('Bạn chưa nhập nội dung nào!');
      return;
    }

    if (confirm('Bạn có chắc muốn hủy không?')) {
      this.resetForm();
    }
  }

  saveDraft(): void {
    if (this.isFormEmpty()) {
      alert('Bạn chưa nhập thông tin nào nên không thể lưu nháp!');
      return;
    }

    console.log('Lưu nháp:', this.product);
    alert('Đã lưu nháp thành công!');
  }

  saveProduct(): void {
    const missingFields: string[] = [];

    if (!this.product.Ma_san_pham.trim())
      missingFields.push('Mã sản phẩm');

    if (!this.product.Ten_san_pham.trim())
      missingFields.push('Tên sản phẩm');

    if (this.product.Gia_ban === 0)
      missingFields.push('Giá bán');

    if (this.product.So_luong_ton_kho === 0)
      missingFields.push('Tồn kho');

    if (!this.product.Ma_danh_muc)
      missingFields.push('Danh mục');

    if (!this.product.Ma_phong_cach)
      missingFields.push('Phong cách');

    if (!this.product.Ma_loai_phong)
      missingFields.push('Loại phòng');

    if (!this.product.Ma_khong_gian)
      missingFields.push('Không gian');

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

    this.product.Hinh_anh = this.images.filter(img => img !== null) as string[];

    console.log('Lưu sản phẩm:', JSON.stringify(this.product, null, 2));
    alert('Sản phẩm đã được lưu!');
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

    this.images = [null, null, null, null];
  }
}
