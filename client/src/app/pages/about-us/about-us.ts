import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Banner } from '../../services/banner';
import { iBanner } from '../../interfaces/banner';

@Component({
  selector: 'app-about-us',
  imports: [CommonModule],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs implements OnInit, AfterViewInit {
  heroData: any = null;

  constructor(private bannerService: Banner) {}

  ngOnInit() {
    this.bannerService.getBannerData().subscribe((banners: iBanner[]) => {
      const banner = banners
        .filter((b) => b.Trang_thai && (b.Trang === 'about' || b.Trang === 'Giới thiệu'))
        .sort((a, b) => Number(a.Thu_tu || 0) - Number(b.Thu_tu || 0))[0];

      if (banner) {
        this.heroData = {
          title: banner.Tieu_de_chinh || banner.Tieu_de,
          subtitle: banner.Tieu_de_phu,
          backgroundImage: banner.Hinh_anh
        };
      }
    });
  }

  // annimation banner
  ngAfterViewInit() {
    const sections = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.25 }
    );

    sections.forEach(section => observer.observe(section));

    /* ===============================
       COUNTER NUMBER ANIMATION (STAT)
    =============================== */
    const counters = document.querySelectorAll<HTMLElement>('.stat-item h3');

    const animateCounter = (el: HTMLElement) => {
      const target = Number(el.dataset['target']);
      const suffix = el.dataset['suffix'] || '';
      const duration = 1800; // ms (càng lớn càng chậm)
      const startTime = performance.now();

      const update = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const value = Math.floor(progress * target);

        el.innerText = value.toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.innerText = target.toLocaleString() + suffix;
        }
      };

  requestAnimationFrame(update);
};


    const counterObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target as HTMLElement);
            obs.unobserve(entry.target); // chỉ chạy 1 lần
          }
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach(counter => counterObserver.observe(counter));

  }

}
