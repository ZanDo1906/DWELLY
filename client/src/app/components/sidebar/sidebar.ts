import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { Client } from '../../services/client';
import { iClient } from '../../interfaces/client';
import { NotificationService } from '../../services/notification';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule, Modal],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  isLoggedIn = false;
  currentUrl = '';
  userInfo: iClient | null = null;
  userId: string = '';
  unreadCount: number = 0;
  private readonly avatarFallback = 'https://i.pravatar.cc/100';

  constructor(
    private router: Router, 
    private clientService: Client,
    private notificationService: NotificationService
  ) {
    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl = event.url;
      });
  }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadUserInfo();
      this.loadUnreadCount();
    } else {
      this.refreshUserInfo();
    }
    this.currentUrl = this.router.url;

    // Listen to notification updates globally
    if (typeof window !== 'undefined') {
      window.addEventListener('notifications-updated', () => {
        if (this.userId) {
          this.loadUnreadCount();
        }
      });
    }
  }

   loadUserInfo(): void {
    this.clientService.getClientById(this.userId).subscribe({
      next: (data) => {
        this.userInfo = data;
        this.isLoggedIn = true;
      },
      error: (err) => {
        console.error('Error loading user info:', err);
        this.refreshUserInfo();
      }
    });
  }

  loadUnreadCount(): void {
    if (!this.userId) return;
    this.notificationService.getNotificationsByUser(this.userId).subscribe({
      next: (notifications) => {
        this.unreadCount = notifications.filter(n => !n.Da_doc).length;
      },
      error: (err) => console.error('Error fetching notifications:', err)
    });
  }

  isOrdersActive(): boolean {
    return this.currentUrl.includes('/user-layout/orders') || 
           this.currentUrl.includes('/user-layout/order-detail');
  }

  @HostListener('window:user-login')
  onUserLogin(): void {
    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadUserInfo();
      this.loadUnreadCount();
    } else {
      this.refreshUserInfo();
    }
  }

  @HostListener('window:user-logout')
  onUserLogout(): void {
    this.userInfo = null;
    this.userId = '';
    this.unreadCount = 0;
    this.isLoggedIn = false;
  }

  @HostListener('window:user-updated')
  onUserUpdated(): void {
    if (this.userId) {
      this.loadUserInfo();
    }
  }

  private refreshUserInfo(): void {
    // Fallback to default values when no user is logged in
    this.userInfo = null;
    this.isLoggedIn = false;
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

  logout(): void {
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');

    window.dispatchEvent(new Event('user-logout'));
    this.router.navigateByUrl('/');
  }

  getMemberBadgeLabel(): string {
    const memberCode = (this.userInfo?.Ma_phan_hang || '').toUpperCase();
    const normalizedCode = memberCode.replace(/[\s_-]+/g, '');

    if (normalizedCode === 'DONG') return 'Đồng';
    if (normalizedCode === 'BAC') return 'Bạc';
    if (normalizedCode === 'VANG') return 'Vàng';
    if (normalizedCode === 'KIMCUONG') return 'Kim cương';

    if (normalizedCode === 'PH01') return 'Đồng';
    if (normalizedCode === 'PH02') return 'Bạc';
    if (normalizedCode === 'PH03') return 'Vàng';
    if (normalizedCode === 'PH04') return 'Kim cương';

    return 'Thành viên';
  }

  getMemberBadgeIcon(): string {
    const label = this.getMemberBadgeLabel();

    if (label === 'Kim cương') return 'bi-gem';
    if (label === 'Vàng') return 'bi-award';
    if (label === 'Bạc') return 'bi-shield-check';
    if (label === 'Đồng') return 'bi-patch-check';

    return 'bi-person-badge';
  }

  getMemberBadgeClass(): string {
    const label = this.getMemberBadgeLabel();

    if (label === 'Kim cương') return 'badge-diamond';
    if (label === 'Vàng') return 'badge-gold';
    if (label === 'Bạc') return 'badge-silver';
    if (label === 'Đồng') return 'badge-bronze';

    return 'badge-default';
  }
  
    confirmLogout(): void {
      this.logout();
      // Đóng modal xác nhận nếu dùng Bootstrap hoặc custom modal
      const modal = document.getElementById('logoutConfirmModal');
      if (modal) {
        // Nếu dùng Bootstrap 5 modal
        // @ts-ignore
        if (window.bootstrap && window.bootstrap.Modal) {
          // @ts-ignore
          const bsModal = window.bootstrap.Modal.getInstance(modal) || new window.bootstrap.Modal(modal);
          bsModal.hide();
        } else {
          // Nếu là custom modal, có thể ẩn bằng cách thêm class hoặc thuộc tính
          modal.style.display = 'none';
        }
      }
    }
}
