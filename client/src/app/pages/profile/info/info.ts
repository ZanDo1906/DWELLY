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
  isEditing = false;
  showPassword = false;
  userInfo: iClient | null = null;
  userId: string = '';
  isSaving = false;
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
      alert('Số điện thoại không hợp lệ hoặc là dãy số yếu (lặp/liên tiếp).');
      return;
    }

    this.isSaving = true;

    const updateData: Partial<iClient> = {
      Ho_va_ten: this.userInfo.Ho_va_ten,
      So_dien_thoai: normalizedPhone,
      Anh_dai_dien: this.userInfo.Anh_dai_dien,
    };

    this.clientService.updateClient(this.userId, updateData).subscribe({
      next: (response) => {
        console.log('Update successful:', response);
        alert('Cập nhật thông tin thành công!');
        this.isEditing = false;
        this.isSaving = false;
        // Reload user info to get updated data
        this.loadUserInfo();
      },
      error: (err) => {
        console.error('Error updating user info:', err);
        alert('Cập nhật thông tin thất bại!');
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
          }
        },
        error: (err) => {
          console.error('Error uploading avatar:', err);
          alert('Upload ảnh thất bại!');
        }
      });
    }
  }
}
