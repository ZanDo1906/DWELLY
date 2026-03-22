import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Admin as AdminService } from '../../services/admin';
import { iAdmin } from '../../interfaces/admin';
import { Modal } from '../../components/modal/modal';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private readonly apiBaseUrl = 'http://localhost:3000';
  private readonly defaultAdminAvatar = 'assets/images/avt/avt_admin.png';
  adminInfo: iAdmin | null = null;
  adminId = '';
  password = '************';
  showPassword = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isChangingPassword = false;
  formError = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    // First, try to load from stored current_admin
    const storedAdmin = this.readStorageObject('current_admin');
    if (storedAdmin && (storedAdmin['fullName'] || storedAdmin['Ho_va_ten'])) {
      this.adminInfo = {
        Ma_quan_tri_vien: storedAdmin['maAdmin'] || storedAdmin['Ma_quan_tri_vien'] || '',
        Ho_va_ten: storedAdmin['fullName'] || storedAdmin['Ho_va_ten'] || '',
        So_dien_thoai: storedAdmin['phone'] || storedAdmin['So_dien_thoai'] || '',
        Email: storedAdmin['email'] || storedAdmin['Email'] || '',
        Mat_khau: '',
        Trang_thai: storedAdmin['status'] !== false,
        Anh_dai_dien: storedAdmin['avatar'] || storedAdmin['Anh_dai_dien'] || '',
        Ngay_tao: new Date(),
      };
      console.log('Loaded admin info from current_admin storage on init:', this.adminInfo);
    }

    this.adminId = this.resolveAdminId();
    console.log('Resolved adminId:', this.adminId);

    if (this.adminId) {
      this.loadAdminInfo();
      return;
    }

    const email = this.resolveAdminEmail();
    console.log('Resolved email:', email);
    this.loadAdminByEmailFallback(email);
  }

  loadAdminInfo(): void {
    this.adminService.getAdminById(this.adminId).subscribe({
      next: (data) => {
        console.log('Admin data loaded by ID:', data);
        this.adminInfo = data;
      },
      error: (err) => {
        console.error('Error loading admin info by ID:', err);
        // Try loading from stored adminInfo first before fallback
        const storedInfo = this.readStorageObject('adminInfo');
        if (storedInfo && storedInfo['Ho_va_ten']) {
          this.adminInfo = storedInfo as iAdmin;
          console.log('Loaded admin info from storage:', this.adminInfo);
          return;
        }
        const email = this.resolveAdminEmail();
        this.loadAdminByEmailFallback(email);
      }
    });
  }

  private resolveAdminId(): string {
    const adminInfo = this.readStorageObject('adminInfo');
    const admin = this.readStorageObject('admin');

    return String(
      localStorage.getItem('adminId') ||
      adminInfo?.['id'] ||
      adminInfo?.['maAdmin'] ||
      adminInfo?.['Ma_quan_tri_vien'] ||
      admin?.['id'] ||
      admin?.['maAdmin'] ||
      admin?.['Ma_quan_tri_vien'] ||
      ''
    ).trim();
  }

  private resolveAdminEmail(): string {
    const adminInfo = this.readStorageObject('adminInfo');
    const admin = this.readStorageObject('admin');

    return String(
      localStorage.getItem('adminEmail') ||
      adminInfo?.['Email'] ||
      adminInfo?.['email'] ||
      admin?.['Email'] ||
      admin?.['email'] ||
      ''
    ).trim();
  }

  private readStorageObject(key: string): Record<string, any> | null {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error(`Invalid ${key} in localStorage:`, error);
      return null;
    }
  }

  private loadAdminByEmailFallback(email: string): void {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      console.warn('No email provided for fallback admin lookup');
      return;
    }

    this.adminService.getAdminData().subscribe({
      next: (admins) => {
        console.log('Admin data fetched:', admins);
        this.adminInfo = admins.find(
          (admin) => String(admin.Email || '').trim().toLowerCase() === normalizedEmail
        ) || null;
        console.log('Admin info found by email:', this.adminInfo);
      },
      error: (err) => {
        console.error('Error loading admin info by email fallback:', err);
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onChangePasswordSubmit(): void {
    this.formError = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.formError = 'Vui lòng nhập đầy đủ thông tin';
      return;
    }

    if (this.newPassword.length < 6) {
      this.formError = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.formError = 'Mật khẩu xác nhận không khớp';
      return;
    }

    const activeAdminId = this.resolveActiveAdminId();
    if (!activeAdminId) {
      this.formError = 'Không xác định được tài khoản. Vui lòng đăng nhập lại.';
      return;
    }

    this.isChangingPassword = true;

    this.adminService.changePassword(activeAdminId, {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (response) => {
        alert(response?.message || 'Đổi mật khẩu thành công');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
        this.isChangingPassword = false;

        const modalEl = document.getElementById('changePasswordModal');
        const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
        modalInstance?.hide();
      },
      error: (err) => {
        this.formError = err?.error?.message || 'Đổi mật khẩu thất bại';
        this.isChangingPassword = false;
      }
    });
  }

  private resolveActiveAdminId(): string {
    const fromStorage = String(localStorage.getItem('adminId') || '').trim();
    if (fromStorage) {
      return fromStorage;
    }

    return String(this.adminInfo?.Ma_quan_tri_vien || '').trim();
  }

  onImageError(event: any): void {
    event.target.src = this.defaultAdminAvatar;
  }

  getAdminAvatarUrl(): string {
    const rawValue = String(this.adminInfo?.Anh_dai_dien || '').trim();
    if (!rawValue) {
      return this.defaultAdminAvatar;
    }

    if (rawValue === 'assets/images/avt_admin.png') {
      return this.defaultAdminAvatar;
    }

    if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
      return rawValue;
    }

    if (rawValue.startsWith('/uploads/')) {
      return `${this.apiBaseUrl}${rawValue}`;
    }

    if (rawValue.startsWith('uploads/')) {
      return `${this.apiBaseUrl}/${rawValue}`;
    }

    if (rawValue.startsWith('assets/')) {
      return rawValue;
    }

    return rawValue;
  }
}
