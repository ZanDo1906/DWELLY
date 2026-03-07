import { Component, OnInit } from '@angular/core';
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

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs(): void {
    this.blogService.getBlogData().subscribe({
      next: (data: iBlog[]) => {
        this.blogs = data.map(blog => ({
          id: blog.Ma_bai_viet,
          _id: (blog as any)._id,
          code: blog.Ma_bai_viet,
          title: blog.Tieu_de,
          date: new Date(blog.Ngay_tao).toLocaleDateString('vi-VN'),
          author: blog.Ma_quan_tri_vien,
          status: blog.Trang_thai ? 'published' : 'draft',
          views: 0, 
          selected: false
        }));
      },
      error: (err) => {
        console.error('Error loading blogs:', err);
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.blogs.length / this.pageSize));
  }

  get pagedBlogs() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.blogs.slice(startIndex, startIndex + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get selectedCount(): number {
    return this.blogs.filter(blog => blog.selected).length;
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
