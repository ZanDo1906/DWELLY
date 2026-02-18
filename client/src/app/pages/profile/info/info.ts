import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../../../components/modal/modal';
import { ChangePasswordModal } from './change-password-modal/change-password-modal';

@Component({
  selector: 'app-info',
  imports: [CommonModule, Modal, ChangePasswordModal],
  templateUrl: './info.html',
  styleUrl: './info.css',
})
export class Info {
  isEditing = false;

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }
}
