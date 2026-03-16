import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { Admin as AdminService } from '../../services/admin';

const API_BASE_URL = 'http://localhost:3000';
const DEFAULT_AVATAR = '';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  userName = 'Your name';
  userEmail = 'yourname@gmail.com';
  userAvatar = DEFAULT_AVATAR;
  isLoggedIn = false;
  currentUrl = '';

  constructor(
    private router: Router,
    private adminService: AdminService,
  ) {
    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl = event.url;
      });
  }

  ngOnInit(): void {
    this.refreshUserInfo();
    this.currentUrl = this.router.url;
  }

  isOrdersActive(): boolean {
      return this.currentUrl.includes('/order-list') ||
        this.currentUrl.includes('/order-detail') ||
        this.currentUrl.includes('/add-order');
  }

  @HostListener('window:admin-login')
  onAdminLogin(): void {
    this.refreshUserInfo();
  }

  @HostListener('window:admin-logout')
  onAdminLogout(): void {
    this.refreshUserInfo();
  }

  private refreshUserInfo(): void {
    const rawAdmin = localStorage.getItem('admin') || localStorage.getItem('adminInfo') || '{}';
    let parsedId = '';

    try {
      const admin = JSON.parse(rawAdmin) as {
        Ma_quan_tri_vien?: string;
        maAdmin?: string;
        id?: string;
      };
      parsedId = (admin.Ma_quan_tri_vien || admin.maAdmin || admin.id || '').trim();
    } catch {
      parsedId = '';
    }

    const adminId = (localStorage.getItem('adminId') || parsedId).trim();
    if (adminId) {
      this.userName = 'Admin';
      this.userEmail = 'admin@dwelly.com';
      this.userAvatar = DEFAULT_AVATAR;
      this.isLoggedIn = true;
      this.enrichAdminProfile(adminId);
      return;
    }

    this.userName = 'Your name';
    this.userEmail = 'yourname@gmail.com';
    this.userAvatar = DEFAULT_AVATAR;
    this.isLoggedIn = false;
  }

  private enrichAdminProfile(adminId: string): void {
    if (!adminId) {
      return;
    }

    this.adminService.getAdminById(adminId).subscribe({
      next: (admin) => {
        this.userName = (admin.Ho_va_ten || this.userName || 'Admin').trim();
        this.userEmail = (admin.Email || this.userEmail || 'admin@dwelly.com').trim();
        this.userAvatar = this.resolveAvatarUrl((admin.Anh_dai_dien || this.userAvatar || '').trim());

        const mergedAdmin = {
          Ma_quan_tri_vien: admin.Ma_quan_tri_vien,
          Ho_ten: admin.Ho_va_ten,
          Email: admin.Email,
          Anh_dai_dien: admin.Anh_dai_dien,
          id: adminId,
        };

        localStorage.setItem('admin', JSON.stringify(mergedAdmin));
        localStorage.setItem('adminInfo', JSON.stringify(mergedAdmin));
        localStorage.setItem('adminName', mergedAdmin.Ho_ten || 'Admin');
        localStorage.setItem('adminEmail', mergedAdmin.Email || 'admin@dwelly.com');
        localStorage.setItem('adminAvatar', mergedAdmin.Anh_dai_dien || '');
        localStorage.setItem('adminId', mergedAdmin.Ma_quan_tri_vien || adminId);
      },
      error: () => {
        // Keep safe fallback values if profile API fails.
        this.userAvatar = DEFAULT_AVATAR;
      },
    });
  }

  onAvatarError(): void {
    this.userAvatar = DEFAULT_AVATAR;
  }

  private resolveAvatarUrl(rawAvatar: string): string {
    const avatar = (rawAvatar || '').trim();
    if (!avatar) {
      return DEFAULT_AVATAR;
    }

    if (/^https?:\/\//i.test(avatar) || avatar.startsWith('data:') || avatar.startsWith('blob:')) {
      return avatar;
    }

    if (avatar.startsWith('/assets/')) {
      return avatar;
    }

    if (avatar.startsWith('assets/')) {
      return `/${avatar}`;
    }

    if (avatar.startsWith('/uploads/')) {
      return `${API_BASE_URL}${avatar}`;
    }

    if (avatar.startsWith('uploads/')) {
      return `${API_BASE_URL}/${avatar}`;
    }

    return avatar;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('adminInfo');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminAvatar');
    localStorage.removeItem('adminId');

    window.dispatchEvent(new Event('admin-logout'));
    this.router.navigateByUrl('/login');
  }
}
