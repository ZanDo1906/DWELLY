import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { Client } from '../../services/client';
import { iClient } from '../../interfaces/client';
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
  private readonly avatarFallback = 'https://i.pravatar.cc/100';

  constructor(private router: Router, private clientService: Client) {
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
    } else {
      this.refreshUserInfo();
    }
    this.currentUrl = this.router.url;
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

  isOrdersActive(): boolean {
    return this.currentUrl.includes('/user-layout/orders') || 
           this.currentUrl.includes('/user-layout/order-detail');
  }

  @HostListener('window:user-login')
  onUserLogin(): void {
    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadUserInfo();
    } else {
      this.refreshUserInfo();
    }
  }

  @HostListener('window:user-logout')
  onUserLogout(): void {
    this.userInfo = null;
    this.userId = '';
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

  confirmLogout(): void {
    this.closeLogoutModal();
    this.logout();
  }

  private closeLogoutModal(): void {
    const modalEl = document.getElementById('logoutConfirmModal');
    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    modalInstance?.hide();
  }
}
