import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Login } from '../../pages/auth/login/login';
import { Register } from '../../pages/auth/register/register';
import { Modal } from '../modal/modal';
import { VerifyAccount } from '../../pages/auth/verify-account/verify-account';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, Login, Register, Modal, VerifyAccount],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, AfterViewInit {
  displayName = 'Tài khoản';
  isLoggedIn = false;
  isOverHero = false;

  ngOnInit(): void {
    this.refreshDisplayName();
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeRegisterModal(): void {
    // Hook for modal close; add behavior if needed.
  }

  closeLoginModal(): void {
    // Hook for modal close; add behavior if needed.
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateHeroState());
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange(): void {
    this.updateHeroState();
  }

  @HostListener('window:user-login')
  onUserLogin(): void {
    this.refreshDisplayName();
  }

  @HostListener('window:user-logout')
  onUserLogout(): void {
    this.refreshDisplayName();
  }

  private updateHeroState(): void {
    const heroBottom = this.getHeroBottom();
    if (heroBottom === null) {
      this.isOverHero = false;
      return;
    }

    const headerHeight = this.getHeaderHeight();
    this.isOverHero = window.scrollY + headerHeight < heroBottom;
  }

  private refreshDisplayName(): void {
    const storedName = localStorage.getItem('userName');
    if (storedName && storedName.trim().length > 0) {
      this.displayName = storedName.trim();
      this.isLoggedIn = true;
      return;
    }

    this.displayName = 'Tài khoản';
    this.isLoggedIn = false;
  }

  private getHeroBottom(): number | null {
    const hero = document.querySelector('.hero-section') as HTMLElement | null;
    if (!hero) {
      return null;
    }

    const rect = hero.getBoundingClientRect();
    return rect.bottom + window.scrollY;
  }

  private getHeaderHeight(): number {
    const header = document.querySelector('.header-scale') as HTMLElement | null;
    return header ? header.getBoundingClientRect().height : 0;
  }
}
