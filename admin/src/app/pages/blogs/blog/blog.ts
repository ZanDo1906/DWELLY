import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Blog as BlogService } from '../../../services/blog';
import { Admin as AdminService } from '../../../services/admin';
import { iBlog } from '../../../interfaces/blog';

interface TextBlock {
  Loai: 'text';
  Noi_dung: string;
}

interface ImageBlock {
  Loai: 'image';
  Url: string;
  Mo_ta: string;
}

type ContentBlock = TextBlock | ImageBlock;

@Component({
  selector: 'app-blog-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './blog.html',
  styleUrls: ['./blog.css']
})
export class Blog implements OnInit {
  isEditMode = false;
  blogId: string | null = null;

  maBaiViet = 'BV' + Date.now().toString().slice(-6);
  today = new Date().toLocaleDateString('vi-VN');
  tieuDe = '';
  tomTat = '';
  hinhAnh = '';
  trangThai = true;
  adminId = '';
  adminName = '';

  blocks: ContentBlock[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.adminId = localStorage.getItem('adminId') || '';
    this.adminName = localStorage.getItem('adminName') || 'Admin';

    this.blogId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.blogId;

    const restoreParam = this.route.snapshot.queryParamMap.get('restore');

    if (restoreParam) {
      // restoreParam có thể là '1' (nếu là bài viết cũ) hoặc 'BVxxx' (nếu là bài viết mới)
      const previewId = restoreParam === '1' ? this.blogId : restoreParam;
      const previewRaw = sessionStorage.getItem(`blog_preview_${previewId}`);
      if (previewRaw) {
        try {
          const blockData = JSON.parse(previewRaw);
          this.maBaiViet = blockData.Ma_bai_viet;
          this.tieuDe = blockData.Tieu_de;
          this.tomTat = blockData.Tom_tat;
          this.hinhAnh = blockData.Hinh_anh;
          this.trangThai = blockData.Trang_thai;
          this.blocks = blockData.Noi_dung || [];

          if (blockData.Ma_quan_tri_vien) {
            this.adminId = blockData.Ma_quan_tri_vien;
            if (this.adminId === localStorage.getItem('adminId')) {
              this.adminName = localStorage.getItem('adminName') || '';
            } else {
              this.adminName = 'Đang tải tên...';
              this.adminService.getAdminById(this.adminId).subscribe({
                next: (adminInfo) => {
                  this.adminName = adminInfo.Ho_va_ten || adminInfo.Email || '';
                },
                error: (err) => {
                  console.error('Không thể lấy thông tin Admin:', err);
                  this.adminName = '';
                }
              });
            }
          }
          
          // Sau khi restore, có thể xóa session data đi nếu không cần dùng nữa
          // sessionStorage.removeItem(`blog_preview_${previewId}`);
          return; // Skip loading from backend
        } catch (e) {
          console.error("Lỗi parse preview data:", e);
        }
      }
    }

    if (this.isEditMode && this.blogId) {
      this.loadBlogData(this.blogId);
    }
  }

  loadBlogData(id: string): void {
    this.blogService.getBlogById(id).subscribe({
      next: (blog: iBlog) => {
        console.log('Loaded blog:', blog);
        
        this.maBaiViet = blog.Ma_bai_viet;
        this.tieuDe = blog.Tieu_de;
        this.tomTat = blog.Tom_tat;
        this.hinhAnh = blog.Hinh_anh;
        this.trangThai = blog.Trang_thai;
        this.today = new Date(blog.Ngay_tao).toLocaleDateString('vi-VN');

        // Phục hồi thông tin người tạo từ backend
        const creator = (blog as any).Ma_quan_tri_vien;
        if (creator && typeof creator === 'object') {
          this.adminId = creator.Ma_quan_tri_vien || creator._id || '';
          this.adminName = creator.Ho_va_ten || creator.fullName || '';
        } else if (creator) {
          this.adminId = creator as string;
          
          if (this.adminId === localStorage.getItem('adminId')) {
            this.adminName = localStorage.getItem('adminName') || '';
          } else {
            this.adminName = 'Đang tải tên...';
            // Gọi API để lấy tên người quản trị này
            this.adminService.getAdminById(this.adminId).subscribe({
              next: (adminInfo) => {
                this.adminName = adminInfo.Ho_va_ten || adminInfo.Email || '';
              },
              error: (err) => {
                console.error('Không thể lấy thông tin Admin:', err);
                this.adminName = '';
              }
            });
          }
        }
        
        // Load Noi_dung blocks
        if (blog.Noi_dung) {
          if (typeof blog.Noi_dung === 'string') {
            // If Noi_dung is still a string, create a single text block
            this.blocks = [{
              Loai: 'text',
              Noi_dung: blog.Noi_dung
            }];
          } else if (Array.isArray(blog.Noi_dung)) {
            // If Noi_dung is an array, load each block
            this.blocks = blog.Noi_dung.map((block: any) => {
              if (block.Loai === 'text') {
                return {
                  Loai: 'text',
                  Noi_dung: block.Noi_dung || ''
                } as TextBlock;
              } else {
                return {
                  Loai: 'image',
                  Url: block.Url || '',
                  Mo_ta: block.Mo_ta || ''
                } as ImageBlock;
              }
            });
          }
        }
      },
      error: (err) => {
        console.error('Error loading blog:', err);
        alert('Không thể tải bài viết!');
        this.router.navigate(['/blog-list']);
      }
    });
  }

  // ADD
  addTextBlock() {
    this.blocks.push({
      Loai: 'text',
      Noi_dung: ''
    });
  }

  addImageBlock() {
    this.blocks.push({
      Loai: 'image',
      Url: '',
      Mo_ta: ''
    });
  }

  // REMOVE
  removeBlock(index: number) {
    this.blocks.splice(index, 1);
  }

  // MOVE
  moveBlock(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= this.blocks.length) return;

    const temp = this.blocks[index];
    this.blocks[index] = this.blocks[newIndex];
    this.blocks[newIndex] = temp;
  }

  // SUBMIT
  savePost() {
    // Validate required fields
    if (!this.tieuDe.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết!');
      return;
    }
    
    if (!this.tomTat.trim()) {
      alert('Vui lòng nhập tóm tắt!');
      return;
    }
    
    if (!this.hinhAnh.trim()) {
      alert('Vui lòng chọn ảnh đại diện!');
      return;
    }

    const postData: any = {
      Ma_bai_viet: this.maBaiViet,
      Tieu_de: this.tieuDe,
      Tom_tat: this.tomTat,
      Noi_dung: this.blocks,
      Hinh_anh: this.hinhAnh,
      Trang_thai: this.trangThai,
      Ma_quan_tri_vien: this.adminId || 'ADM001'
    };

    if (this.isEditMode) {
      // Update existing blog
      this.blogService.updateBlog(this.maBaiViet, postData).subscribe({
        next: (response) => {
          console.log('Updated blog:', response);
          alert('Đã cập nhật bài viết thành công!');
          this.router.navigate(['/blog-list']);
        },
        error: (err) => {
          console.error('Error updating blog:', err);
          alert('Lỗi khi cập nhật bài viết: ' + err.message);
        }
      });
    } else {
      // Create new blog
      postData.Ngay_tao = new Date().toISOString();
      
      this.blogService.createBlog(postData).subscribe({
        next: (response) => {
          console.log('Created blog:', response);
          alert('Đã tạo bài viết thành công!');
          this.router.navigate(['/blog-list']);
        },
        error: (err) => {
          console.error('Error creating blog:', err);
          alert('Lỗi khi tạo bài viết: ' + err.message);
        }
      });
    }
  }

  // PREVIEW
  previewBlog() {
    if (this.maBaiViet) {
      const previewData = {
        Ma_bai_viet: this.maBaiViet,
        Tieu_de: this.tieuDe,
        Tom_tat: this.tomTat,
        Noi_dung: this.blocks,
        Hinh_anh: this.hinhAnh,
        Trang_thai: this.trangThai,
        Ngay_tao: this.isEditMode && this.blogId ? new Date(this.today.split('/').reverse().join('-')).toISOString() : new Date().toISOString(),
        Ma_quan_tri_vien: this.adminId || 'ADM001',
        isEditMode: this.isEditMode
      };

      sessionStorage.setItem(`blog_preview_${this.maBaiViet}`, JSON.stringify(previewData));

      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/blog-form', this.maBaiViet], {
          queryParams: { preview: '1' }
        })
      );
      window.open(url, '_blank');
    }
  }

  // IMAGE UPLOAD
  triggerFileInput(inputId: string) {
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onImageSelected(event: Event, blockIndex: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh!');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB!');
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const block = this.blocks[blockIndex] as ImageBlock;
        block.Url = e.target?.result as string;
        
        // Auto-fill alt text with filename if empty
        if (!block.Mo_ta) {
          block.Mo_ta = file.name.replace(/\.[^/.]+$/, '');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh!');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB!');
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        this.hinhAnh = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(blockIndex: number) {
    const block = this.blocks[blockIndex] as ImageBlock;
    block.Url = '';
  }

  removeThumbnail() {
    this.hinhAnh = '';
  }
}