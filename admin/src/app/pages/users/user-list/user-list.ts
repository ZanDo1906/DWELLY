import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserForm } from '../user-form/user-form';
import { Modal } from '../../../components/modal/modal';

interface User {
  Ma_khach_hang: string;
  Ho_va_ten: string;
  So_dien_thoai: string;
  Email: string;
  Dia_chi: string[];
  Trang_thai: boolean;
  Anh_dai_dien: string;
  Ngay_tao: Date;
  Ma_phan_hang: string;
  Tong_diem: number;
}

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, FormsModule, UserForm, Modal],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit, AfterViewInit {
  pageSize = 3;
  currentPage = 1;
  searchTerm = '';
  sortType: 'a-z' | 'newest' | 'oldest' = 'a-z';
  filteredUsers: User[] = [];
  users: User[] = [];
  showUserForm = false;
  selectedUser: User | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    // Empty - will be used for modal opening
  }

  private loadUsers(): void {
    this.http.get<any[]>('assets/data/client.json').subscribe({
      next: (data) => {
        this.users = data.map(user => ({
          ...user,
          Ngay_tao: new Date(user.Ngay_tao),
        }));
        this.filteredUsers = [...this.users];
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  get sortedUsers(): User[] {
    let sorted = [...this.filteredUsers];
    
    if (this.sortType === 'a-z') {
      sorted.sort((a, b) => a.Ho_va_ten.localeCompare(b.Ho_va_ten));
    } else if (this.sortType === 'newest') {
      sorted.sort((a, b) => new Date(b.Ngay_tao).getTime() - new Date(a.Ngay_tao).getTime());
    } else if (this.sortType === 'oldest') {
      sorted.sort((a, b) => new Date(a.Ngay_tao).getTime() - new Date(b.Ngay_tao).getTime());
    }
    
    return sorted;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedUsers.length / this.pageSize));
  }

  get pagedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.sortedUsers.slice(startIndex, startIndex + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  setSortType(type: 'a-z' | 'newest' | 'oldest'): void {
    this.sortType = type;
  }

  private applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = this.searchTerm === '' || 
        user.Ho_va_ten.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.Email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.So_dien_thoai.includes(this.searchTerm) ||
        user.Ma_khach_hang.includes(this.searchTerm);
      
      return matchesSearch;
    });
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

  openUserForm(user: User): void {
    this.selectedUser = user;
    this.showUserForm = true;
    setTimeout(() => {
      this.openModal();
    }, 0);
  }

  private openModal(): void {
    setTimeout(() => {
      const modal = document.getElementById('userFormModal');
      if (modal) {
        try {
          const bootstrapModal = (window as any).bootstrap.Modal.getOrCreateInstance(modal);
          bootstrapModal.show();
        } catch (error) {
          console.error('Error opening modal:', error);
        }
      }
    }, 100);
  }

  closeUserFormModal(): void {
    const modal = document.getElementById('userFormModal');
    if (modal) {
      const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    }
    this.showUserForm = false;
    this.selectedUser = null;
  }

  submitUserForm(): void {
    console.log('Update user:', this.selectedUser);
    this.closeUserFormModal();
  }
}
