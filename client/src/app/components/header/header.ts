import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, AfterViewInit {
  displayName = 'Tài khoản';
  isOverHero = false;

  ngOnInit(): void {
    const storedName = localStorage.getItem('userName');
    if (storedName && storedName.trim().length > 0) {
      this.displayName = storedName.trim();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateHeroState());
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange(): void {
    this.updateHeroState();
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
