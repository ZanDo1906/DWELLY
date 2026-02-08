import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications {
  activeTab = 'all'; // Mặc định hiển thị tab "Tất cả"

  // Phương thức chuyển tab
  changeTab(tab: string) {
    this.activeTab = tab;
    // Logic lọc notification theo tab sẽ implement sau
  }

  // Phương thức xóa tất cả thông báo
  deleteAllNotifications() {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả thông báo?')) {
      // Logic xóa tất cả thông báo
      console.log('Đã xóa tất cả thông báo');
    }
  }

  // Phương thức đánh dấu đã đọc
  markAsRead(notificationId: string) {
    // Logic đánh dấu đã đọc
    console.log('Đánh dấu đã đọc:', notificationId);
  }
}

