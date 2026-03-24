import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, INotification } from '../../../services/notification';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  activeTab: string = 'all'; 
  notifications: INotification[] = [];
  userId: string = '';

  constructor(
      private notificationService: NotificationService, 
      private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationService.getNotificationsByUser(this.userId).subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: (err) => console.error('Error loading notifications', err)
    });
  }

  changeTab(tab: string): void {
    this.activeTab = tab;
  }

  get filteredNotifications(): INotification[] {
    if (this.activeTab === 'all') return this.notifications;
    return this.notifications.filter(n => n.Loai === this.activeTab);
  }

  getTabCount(tab: string): number {
    if (tab === 'all') return this.notifications.length;
    return this.notifications.filter(n => n.Loai === tab).length;
  }

  deleteAllNotifications(): void {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả thông báo?')) {
      this.notificationService.deleteAllUserNotifications(this.userId).subscribe({
        next: () => {
          this.notifications = [];
          window.dispatchEvent(new Event('notifications-updated'));
        },
        error: (err) => console.error('Delete failed', err)
      });
    }
  }

  markAsRead(notification: INotification): void {
    if (!notification.Da_doc) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.Da_doc = true;
          window.dispatchEvent(new Event('notifications-updated'));
          if (notification.Lien_ket) {
            this.router.navigateByUrl(notification.Lien_ket);
          }
        },
        error: (err) => console.error('Read failed', err)
      });
    } else if (notification.Lien_ket) {
      this.router.navigateByUrl(notification.Lien_ket);
    }
  }
}
