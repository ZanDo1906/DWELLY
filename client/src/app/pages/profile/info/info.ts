import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Modal } from '../../../components/modal/modal';
import { ChangePasswordModal } from './change-password-modal/change-password-modal';
import { Client } from '../../../services/client';
import { iClient } from '../../../interfaces/client';
import { phoneValidator } from '../../../validator/check.validator';

@Component({
  selector: 'app-info',
  imports: [CommonModule, FormsModule, Modal, ChangePasswordModal],
  templateUrl: './info.html',
  styleUrl: './info.css',
})
export class Info implements OnInit {
    private updateHeaderDisplayNameFromServer() {
      this.clientService.getClientById(this.userId).subscribe({
        next: (data) => {
          this.userInfo = data;
          localStorage.setItem('userName', this.userInfo?.Ho_va_ten || '');
          localStorage.setItem('userAvatar', this.userInfo?.Anh_dai_dien || '');
          window.dispatchEvent(new Event('user-displayname-updated'));
        }
      });
    }
  isEditing = false;
  showPassword = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  userInfo: iClient | null = null;
  userId: string = '';
  isSaving = false;
  private readonly avatarFallback = 'https://i.pravatar.cc/100';
  private readonly phoneControlValidator = phoneValidator();

  constructor(private clientService: Client) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadUserInfo();
    }
  }

  loadUserInfo(): void {
    this.clientService.getClientById(this.userId).subscribe({
      next: (data) => {
        this.userInfo = data;
      },
      error: (err) => {
        console.error('Error loading user info:', err);
      }
    });
  }

  toggleEdit() {
    if (this.isEditing && this.userInfo) {
      // Save changes when switching from edit mode to view mode
      this.saveUserInfo();
    } else {
      this.isEditing = !this.isEditing;
    }
  }

  isValidPhone(phone: string): boolean {
    const validationResult = this.phoneControlValidator({ value: phone } as any);
    return validationResult === null;
  }

  saveUserInfo(): void {
    if (!this.userInfo || !this.userId) {
      console.error('No user info to save');
      return;
    }

    const normalizedPhone = (this.userInfo.So_dien_thoai || '').trim();
    if (!this.isValidPhone(normalizedPhone)) {
      this.pushToast('Số điện thoại không hợp lệ hoặc là dãy số yếu (lặp/liên tiếp).', 'error');
      return;
    }

    this.isSaving = true;

    const updateData: Partial<iClient> = {
      Ho_va_ten: this.userInfo.Ho_va_ten,
      So_dien_thoai: normalizedPhone,
      Anh_dai_dien: this.userInfo.Anh_dai_dien,
    };

    this.clientService.updateClient(this.userId, updateData).subscribe({
      next: () => {
        this.isEditing = false;
        this.isSaving = false;
        // Cập nhật lại header từ server (tránh undefined)
        this.updateHeaderDisplayNameFromServer();
        // Emit user-updated event cho sidebar
        window.dispatchEvent(new Event('user-updated'));
        // Show success toast
        this.pushToast('Cập nhật thông tin thành công!', 'success');
        // Reload user info để cập nhật giao diện
        this.loadUserInfo();
      },
      error: (err) => {
        console.error('Error updating user info:', err);
        this.pushToast('Cập nhật thông tin thất bại!', 'error');
        this.isSaving = false;
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Upload to server
      const formData = new FormData();
      formData.append('avatar', file);
      
      this.clientService.uploadAvatar(formData).subscribe({
        next: (response: any) => {
          if (this.userInfo && response.filePath) {
            this.userInfo.Anh_dai_dien = response.filePath;
            // Update localStorage
            localStorage.setItem('userAvatar', response.filePath);
            // Emit user-updated event for sidebar to reload
            const event = new Event('user-updated');
            window.dispatchEvent(event);
          }
        },
        error: (err) => {
          console.error('Error uploading avatar:', err);
          this.pushToast(err?.error?.message || err?.message || 'Upload ảnh thất bại!', 'error');
        }
      });
    }
  }

  getAvatarUrl(rawPath?: string | null): string {
    if (!rawPath) {
      return this.avatarFallback;
    }

    const normalizedPath = String(rawPath).trim().replace(/\\/g, '/');
    if (!normalizedPath) {
      return this.avatarFallback;
    }

    if (/^https?:\/\//i.test(normalizedPath)) {
      return encodeURI(normalizedPath);
    }

    if (normalizedPath.startsWith('/uploads/')) {
      return encodeURI(`http://localhost:3000${normalizedPath}`);
    }

    if (normalizedPath.startsWith('uploads/')) {
      return encodeURI(`http://localhost:3000/${normalizedPath}`);
    }

    if (normalizedPath.startsWith('assets/')) {
      return encodeURI(normalizedPath);
    }

    if (/^[^/]+\.(png|jpg|jpeg|gif|webp|bmp|svg|avif|jfif|heic|heif|tif|tiff)$/i.test(normalizedPath)) {
      return encodeURI(`http://localhost:3000/uploads/avatars/${normalizedPath}`);
    }

    return encodeURI(normalizedPath);
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.avatarFallback) {
      img.src = this.avatarFallback;
    }
  }

  private pushToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.toastTimer = null;
    }, 2500);
  }
}
