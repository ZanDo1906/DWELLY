import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Login } from '../../pages/auth/login/login';
import { Register } from '../../pages/auth/register/register';
import { Modal } from '../modal/modal';
import { VerifyAccount } from '../../pages/auth/verify-account/verify-account';
import { Cart } from '../../services/cart';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink,Login, Register, Modal, VerifyAccount],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, AfterViewInit, OnDestroy {
  displayName = 'Tài khoản';
  isLoggedIn = false;
  isOverHero = false;
  cartCount = 0;
  private routeSubscription?: Subscription;
  private cartSubscription?: Subscription;

  constructor(
    private router: Router,
    private cartService: Cart,
  ) {}

  ngOnInit(): void {
    this.refreshDisplayName();
    this.cartService.loadCart();
    this.cartSubscription = this.cartService.cart$.subscribe((items) => {
      const uniqueProductIds = new Set(items.map((item) => item.productId));
      this.cartCount = uniqueProductIds.size;
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngAfterViewInit(): void {
    this.scheduleHeroStateUpdate();

    this.routeSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.scheduleHeroStateUpdate());
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.cartSubscription?.unsubscribe();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange(): void {
    this.updateHeroState();
  }

  @HostListener('window:load')
  onWindowLoad(): void {
    this.updateHeroState();
  }

  @HostListener('window:user-login')
  onUserLogin(): void {
    this.refreshDisplayName();
    this.cartService.loadCart();
  }

  @HostListener('window:user-logout')
  onUserLogout(): void {
    this.refreshDisplayName();
  }

  private updateHeroState(): void {
    if (!document.body.classList.contains('homepage')) {
      this.isOverHero = false;
      return;
    }

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

  private scheduleHeroStateUpdate(): void {
    requestAnimationFrame(() => this.updateHeroState());
    setTimeout(() => this.updateHeroState(), 0);
  }
}
