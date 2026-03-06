import { Component, ViewChildren, QueryList, ElementRef, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { iProduct } from '../../../interfaces/product';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../services/product';
import Swal from 'sweetalert2';

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

  constructor(
  private route: ActivatedRoute,
  private router: Router,
  public productService: Product
) {}
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
  selectedFiles: File[] = [];
  isEditMode: boolean = false;
  images: (string | null)[] = [null, null, null, null];

  async ngOnInit() {
  const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.isEditMode = true; 
    this.productService.getProductByCode(id).subscribe({
      next: (data) => {
        this.product = { ...data };
        this.images = this.product.Hinh_anh.length
          ? [...this.product.Hinh_anh]
          : [null, null, null, null];
          this.checkAndAddNewPlaceholder();
      },
      error: (err) => console.error('Không tìm thấy sản phẩm', err)
    });
  } else {
      this.isEditMode = false; 
    }
  }



showSuccess(msg: string) {
  Swal.fire({
    icon: 'success',
    title: 'Thành công',
    text: msg,
    showConfirmButton: false,
    timer: 1500
  });
}

showError(msg: string) {
  Swal.fire({
    icon: 'error',
    title: 'Thất bại',
    text: msg
  });
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
  if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
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

  if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;

  const filename = img.split('/').pop();
  if (!filename) return;

  this.productService.deleteImage(this.product.Ma_san_pham, filename).subscribe({
    next: (res) => {
      this.images.splice(index, 1);
      this.product.Hinh_anh = res.remainingImages;
      this.checkAndAddNewPlaceholder();
    },
    error: (err) => {
      console.error(err);
      this.showError('Lỗi khi xóa ảnh trên server!');
    }
  });
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
    
    const formData = new FormData();
    let hasNewFiles = this.selectedFiles.length > 0;

    this.selectedFiles.forEach(file => formData.append('images', file));

    this.product.Hinh_anh = this.images
  .filter(img => img && !img.startsWith('data:')) as string[];

    const idFromUrl = this.route.snapshot.paramMap.get('id');

    if (idFromUrl) {
      this.productService.updateProduct(idFromUrl, this.product).subscribe({
        next: () => {
          if (hasNewFiles) {
            this.uploadAfterSave(idFromUrl, formData);
          } else {
            this.showSuccess('Cập nhật thành công!');
            // this.router.navigate(['/product-list']);
          }
        },
        error: (err) => this.showError('Lỗi cập nhật: ' + err.message)
      });
    } else {
      this.productService.addProduct(this.product).subscribe({
        next: (res) => {
          const newCode = res.Ma_san_pham; 
          if (hasNewFiles) {
            this.uploadAfterSave(newCode, formData);
          } else {
            this.showSuccess('Thêm mới thành công!');
            // this.router.navigate(['/product-list']);
          }
        },
        error: (err) => this.showError('Lỗi thêm mới: ' + err.message)
      });
    }
  }

  private uploadAfterSave(code: string, formData: FormData) {
  this.productService.uploadImages(code, formData).subscribe({
    next: () => {
      this.showSuccess('Lưu sản phẩm và tải ảnh thành công!');
      localStorage.removeItem('dwelly_product_draft');
      // this.router.navigate(['/product-list']);
    this.selectedFiles = []; // clear files đã upload
      
      // Reload lại product để images cập nhật thành path thật
      this.productService.getProductByCode(code).subscribe({
        next: (data) => {
          this.product = { ...data };
          this.images = [...data.Hinh_anh];
          this.checkAndAddNewPlaceholder();
        }
      });
    },
    error: () => this.showError('Đã lưu thông tin nhưng tải ảnh thất bại!')
  });
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
