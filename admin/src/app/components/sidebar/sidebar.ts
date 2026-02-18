import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  userName = 'Your name';
  userEmail = 'yourname@gmail.com';
  userAvatar = 'https://i.pravatar.cc/100';
  isLoggedIn = false;
  currentUrl = '';

  constructor(private router: Router) {
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

  @HostListener('window:user-login')
  onUserLogin(): void {
    this.refreshUserInfo();
  }

  @HostListener('window:user-logout')
  onUserLogout(): void {
    this.refreshUserInfo();
  }

  private refreshUserInfo(): void {
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    const storedAvatar = localStorage.getItem('userAvatar');

    // Debug logging
    // console.log('=== Sidebar User Info Debug ===');
    // console.log('storedName:', storedName);
    // console.log('storedEmail:', storedEmail);
    // console.log('storedAvatar:', storedAvatar);

    if (storedName && storedName.trim().length > 0) {
      this.userName = storedName.trim();
      this.userEmail = storedEmail?.trim() || 'yourname@gmail.com';
      this.userAvatar = storedAvatar || 'https://i.pravatar.cc/100';
      this.isLoggedIn = true;
      // console.log('User logged in, avatar set to:', this.userAvatar);
      return;
    }

    this.userName = 'Your name';
    this.userEmail = 'yourname@gmail.com';
    this.userAvatar = 'https://i.pravatar.cc/100';
    this.isLoggedIn = false;
    // console.log('No user logged in, using default avatar');
  }

  logout(): void {
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userAvatar');

    window.dispatchEvent(new Event('user-logout'));
    this.router.navigateByUrl('/');
  }
}
