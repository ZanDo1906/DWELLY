import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Table } from '../../../components/table/table';

interface Blog {
  id: number;
  code: string;
  title: string;
  date: string;
  author: string;
  status: 'published' | 'draft' | 'hidden';
  views: number;
  selected?: boolean;
}

@Component({
  selector: 'app-blog-list',
  imports: [CommonModule, FormsModule, RouterLink, Table],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.css',
})
export class BlogList {
  pageSize = 10;
  currentPage = 1;

  blogs: Blog[] = [
    { id: 1, code: 'B01', title: '3 cách vệ sinh sofa nỉ tại nhà', date: '20/10/2026', author: 'Quyen Nguyen', status: 'published', views: 1820, selected: false },
    { id: 2, code: 'B01', title: '3 cách vệ sinh sofa nỉ tại nhà', date: '10/01/2026', author: 'Quyen Nguyen', status: 'draft', views: 1820, selected: false },
    { id: 3, code: 'B01', title: '3 cách vệ sinh sofa nỉ tại nhà', date: '10/01/2026', author: 'Quyen Nguyen', status: 'draft', views: 1820, selected: true },
    { id: 4, code: 'B01', title: '3 cách vệ sinh sofa nỉ tại nhà', date: '10/01/2026', author: 'Quyen Nguyen', status: 'draft', views: 1820, selected: false },
    { id: 5, code: 'B01', title: '3 cách vệ sinh sofa nỉ tại nhà', date: '20/01/2026', author: 'Quyen Nguyen', status: 'draft', views: 1820, selected: true },
    { id: 6, code: 'B01', title: '3 cách vệ sinh sofa nỉ tại nhà', date: '20/01/2026', author: 'Quyen Nguyen', status: 'hidden', views: 568, selected: false },
    { id: 7, code: 'B01', title: '3 cách vệ sinh sofa nỉ tại nhà', date: '20/01/2026', author: 'Quyen Nguyen', status: 'published', views: 112, selected: false },
    { id: 8, code: 'B01', title: '3 cách vệ sinh sofa nỉ tại nhà', date: '20/01/2026', author: 'Quyen Nguyen', status: 'hidden', views: 1200, selected: false },
    { id: 9, code: 'B01', title: '3 cách vệ sinh sofa nỉ tại nhà', date: '20/01/2026', author: 'Quyen Nguyen', status: 'published', views: 180, selected: true },
  ];

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
      'draft': 'Nháp',
      'hidden': 'Đã ẩn'
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
