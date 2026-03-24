import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserForm } from '../user-form/user-form';
import { Modal } from '../../../components/modal/modal';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';
import { Client } from '../../../services/client';
import { iClient } from '../../../interfaces/client';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, FormsModule, UserForm, Modal, ConfirmDialogComponent],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit, AfterViewInit {
  pageSize = 3;
  currentPage = 1;
  searchTerm = '';
  sortMode: 'a-z' | 'za' | 'newest' | 'oldest' | '' = '';
  statusFilter: 'all' | 'active' | 'inactive' | null = null;
  statusFilterLabel = 'Tất cả trạng thái';
  dropdownOpen = false;
  filteredUsers: iClient[] = [];
  users: iClient[] = [];
  showUserForm = false;
  showStatusConfirm = false;
  confirmTitle = 'Xác nhận';
  confirmMessage = '';
  selectedUser: iClient | null = null;
  pendingStatusUser: iClient | null = null;

  constructor(private clientService: Client) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    // Empty - will be used for modal opening
  }

  private loadUsers(): void {
    this.clientService.getClientData().subscribe({
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

  get sortedUsers(): iClient[] {
    let sorted = [...this.filteredUsers];
    
    if (this.sortMode === 'a-z') {
      sorted.sort((a, b) => a.Ho_va_ten.localeCompare(b.Ho_va_ten));
    } else if (this.sortMode === 'za') {
      sorted.sort((a, b) => b.Ho_va_ten.localeCompare(a.Ho_va_ten));
    } else if (this.sortMode === 'newest') {
      sorted.sort((a, b) => new Date(b.Ngay_tao).getTime() - new Date(a.Ngay_tao).getTime());
    } else if (this.sortMode === 'oldest') {
      sorted.sort((a, b) => new Date(a.Ngay_tao).getTime() - new Date(b.Ngay_tao).getTime());
    } else {
      // Default sort by customer code: C01, C02, C03...
      sorted.sort((a, b) => this.compareCustomerCode(a.Ma_khach_hang, b.Ma_khach_hang));
    }
    
    return sorted;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedUsers.length / this.pageSize));
  }

  get pagedUsers(): iClient[] {
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

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm = target?.value || '';
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleSort(mode: 'a-z'): void {
    if (mode === 'a-z') {
      if (this.sortMode === 'a-z') {
        this.sortMode = 'za';
      } else if (this.sortMode === 'za') {
        this.sortMode = '';
      } else {
        this.sortMode = 'a-z';
      }
      this.currentPage = 1;
    }
  }

  setSortMode(mode: 'newest' | 'oldest'): void {
    this.sortMode = this.sortMode === mode ? '' : (mode as any);
    this.currentPage = 1;
  }

  setStatusFilter(filter: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectStatus(filter: 'all' | 'active' | 'inactive' | null, label: string, event: Event): void {
    event.stopPropagation();
    if (this.statusFilter === filter) {
      this.statusFilter = null;
      this.statusFilterLabel = 'Tất cả trạng thái';
    } else {
      this.statusFilter = filter;
      this.statusFilterLabel = label;
    }
    this.currentPage = 1;
    this.applyFilters();
    this.dropdownOpen = false;
  }

  @HostListener('document:click')
  closeDropdownOnOutsideClick(): void {
    this.dropdownOpen = false;
  }

  private applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = this.searchTerm === '' || 
        user.Ho_va_ten.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.Email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.So_dien_thoai.includes(this.searchTerm) ||
        user.Ma_khach_hang.includes(this.searchTerm);

      const matchesStatus =
        this.statusFilter === null ||
        this.statusFilter === 'all' ||
        (this.statusFilter === 'active' && user.Trang_thai) ||
        (this.statusFilter === 'inactive' && !user.Trang_thai);
      
      return matchesSearch && matchesStatus;
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

  openUserForm(user: iClient): void {
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

  requestToggleUserStatus(user: iClient): void {
    this.pendingStatusUser = user;
    const actionLabel = user.Trang_thai ? 'vô hiệu hóa' : 'khôi phục';
    this.confirmTitle = user.Trang_thai ? 'Xác nhận vô hiệu hóa' : 'Xác nhận khôi phục';
    this.confirmMessage = `Bạn có chắc muốn ${actionLabel} tài khoản ${user.Ho_va_ten}?`;
    this.showStatusConfirm = true;
  }

  confirmToggleUserStatus(): void {
    if (!this.pendingStatusUser) {
      this.showStatusConfirm = false;
      return;
    }

    this.toggleUserStatus(this.pendingStatusUser);
    this.showStatusConfirm = false;
    this.pendingStatusUser = null;
  }

  cancelToggleUserStatus(): void {
    this.showStatusConfirm = false;
    this.pendingStatusUser = null;
  }

  toggleUserStatus(user: iClient): void {
    const nextStatus = !user.Trang_thai;

    this.clientService.updateClient(user.Ma_khach_hang, { Trang_thai: nextStatus }).subscribe({
      next: (response) => {
        const updatedUser = response.client;
        this.users = this.users.map(item =>
          item.Ma_khach_hang === updatedUser.Ma_khach_hang
            ? { ...updatedUser, Ngay_tao: new Date(updatedUser.Ngay_tao) }
            : item
        );
        this.applyFilters();
        this.closeUserFormModal();
      },
      error: (error) => {
        console.error('Error disabling user:', error);
      }
    });
  }

  private compareCustomerCode(codeA: string, codeB: string): number {
    const matchA = codeA.match(/^([a-zA-Z]*)(\d+)$/);
    const matchB = codeB.match(/^([a-zA-Z]*)(\d+)$/);

    if (!matchA || !matchB) {
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    }

    const [, prefixA, numberA] = matchA;
    const [, prefixB, numberB] = matchB;

    const prefixCompare = prefixA.localeCompare(prefixB, undefined, { sensitivity: 'base' });
    if (prefixCompare !== 0) {
      return prefixCompare;
    }

    return Number(numberA) - Number(numberB);
  }
}
