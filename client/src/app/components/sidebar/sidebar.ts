import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { Client } from '../../services/client';
import { iClient } from '../../interfaces/client';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  isLoggedIn = false;
  currentUrl = '';
  userInfo: iClient | null = null;
  userId: string = '';

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

  private refreshUserInfo(): void {
    // Fallback to default values when no user is logged in
    this.userInfo = null;
    this.isLoggedIn = false;
  }

  logout(): void {
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userAvatar');

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
}
