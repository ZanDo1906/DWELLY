import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Table } from '../../../components/table/table';
import { Blog as BlogService } from '../../../services/blog';
import { iBlog } from '../../../interfaces/blog';

interface Blog {
  id: string;
  code: string;
  title: string;
  date: string;
  createdAt: number;
  author: string;
  status: 'published' | 'draft';
  views: number;
  selected?: boolean;
  _id?: string;
}

@Component({
  selector: 'app-blog-list',
  imports: [CommonModule, FormsModule, RouterLink, Table],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.css',
})
export class BlogList implements OnInit {
  pageSize = 10;
  currentPage = 1;

  blogs: Blog[] = [];
  dropdownOpen = false;
  private _searchTerm: string = '';
  private _statusFilter: string = 'Tất cả trạng thái';
  private _sortMode: string = '';

  constructor(private blogService: BlogService) {}

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('.dropdown-wrapper')) {
      return;
    }
    this.dropdownOpen = false;
  }

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs(): void {
    this.blogService.getBlogData().subscribe({
      next: (data: iBlog[]) => {
        this.blogs = data.map(blog => {
          const createdAt = new Date(blog.Ngay_tao).getTime();

          return {
          id: blog.Ma_bai_viet,
          _id: (blog as any)._id,
          code: blog.Ma_bai_viet,
          title: blog.Tieu_de,
          date: new Date(blog.Ngay_tao).toLocaleDateString('vi-VN'),
          createdAt: Number.isNaN(createdAt) ? 0 : createdAt,
          author: blog.Ma_quan_tri_vien,
          status: blog.Trang_thai ? 'published' : 'draft',
          views: 0, 
          selected: false
          };
        });
      },
      error: (err) => {
        console.error('Error loading blogs:', err);
      }
    });
  }

  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(val: string) {
    this._searchTerm = val;
    this.currentPage = 1;
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
  }

  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }

  get statusFilter(): string {
    return this._statusFilter;
  }
  set statusFilter(val: string) {
    this._statusFilter = val;
    this.currentPage = 1;
  }

  get sortMode(): string {
    return this._sortMode;
  }
  set sortMode(val: string) {
    this._sortMode = val;
    this.currentPage = 1;
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectStatus(status: string, event: Event): void {
    event.stopPropagation();
    this.statusFilter = status;
    this.dropdownOpen = false;
  }

  toggleSort(mode: 'az'): void {
    if (mode === 'az') {
      if (this.sortMode === 'az') {
        this.sortMode = 'za';
      } else if (this.sortMode === 'za') {
        this.sortMode = '';
      } else {
        this.sortMode = 'az';
      }
      this.currentPage = 1;
    }
  }

  setDateSort(mode: 'newest' | 'oldest'): void {
    this.sortMode = this.sortMode === mode ? '' : mode;
    this.currentPage = 1;
  }

  get filteredBlogs(): Blog[] {
    let list = [...this.blogs];

    if (this.statusFilter !== 'Tất cả trạng thái') {
      list = list.filter(blog => this.getStatusLabel(blog.status) === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.normalizeSearchText(this.searchTerm);
      list = list.filter(blog => {
        const statusText = this.getStatusLabel(blog.status);
        const searchTarget = this.normalizeSearchText(
          `${blog.title} ${blog.code} ${blog.author} ${statusText} ${blog.date}`
        );

        return searchTarget.includes(term);
      });
    }

    if (this.sortMode === 'newest') {
      list.sort((a, b) => b.createdAt - a.createdAt);
    } else if (this.sortMode === 'oldest') {
      list.sort((a, b) => a.createdAt - b.createdAt);
    } else if (this.sortMode === 'az') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.sortMode === 'za') {
      list.sort((a, b) => b.title.localeCompare(a.title));
    } else {
      list.sort((a, b) => a.code.localeCompare(b.code));
    }

    return list;
  }

  deleteSelected(): void {
    const selectedBlogs = this.pagedBlogs.filter(blog => blog.selected);
    if (selectedBlogs.length === 0) return;

    if (!confirm(`Bạn có chắc muốn xóa ${selectedBlogs.length} bài viết đã chọn?`)) return;

    selectedBlogs.forEach(blog => {
      this.blogService.deleteBlog(blog.code).subscribe({
        next: () => {
          this.blogs = this.blogs.filter(b => b.code !== blog.code);
        },
        error: (err) => console.error('Lỗi khi xóa bài viết:', err)
      });
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBlogs.length / this.pageSize));
  }

  get pagedBlogs() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredBlogs.slice(startIndex, startIndex + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get selectedCount(): number {
    return this.pagedBlogs.filter(blog => blog.selected).length;
  }

  getStatusLabel(status: string): string {
    const labels: {[key: string]: string} = {
      'published': 'Đã đăng',
      'draft': 'Nháp'
    };
    return labels[status] || status;
  }

  isAllSelected(): boolean {
    return this.pagedBlogs.length > 0 && this.pagedBlogs.every(blog => blog.selected);
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.pagedBlogs.forEach(blog => blog.selected = checked);
  }

  onCheckboxChange(): void {
    // Update selected count label if needed
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }
}
