import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-about-us',
  imports: [],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {
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
