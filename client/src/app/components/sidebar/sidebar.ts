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
}
