import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Concept } from '../../../services/concept';
import { iConcept } from '../../../interfaces/concept';
import { Banner } from '../../../services/banner';
import { iBanner } from '../../../interfaces/banner';

@Component({
  selector: 'app-concept-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './concept-list.html',
  styleUrl: './concept-list.css',
})
export class ConceptList implements OnInit, OnDestroy {
  heroData: any = null;
  heroBanners: iBanner[] = [];
  currentHeroIndex = 0;
  heroInterval: any;
  concepts: iConcept[] = [];
  displayedCount: number = 6;
  itemsPerPage: number = 6;

  selectedRoomTypes: Set<string> = new Set();
  selectedStyles: Set<string> = new Set();

  openRoomDropdown: boolean = false;
  openStyleDropdown: boolean = false;

  roomTypeMap: { [key: string]: string } = {
    '01': 'Phòng khách',
    '02': 'Phòng ngủ',
    '03': 'Phòng ăn',
  };

  styleMap: { [key: string]: string } = {
    '01': 'Tối giản',
    '02': 'Hiện đại',
    '03': 'Bắc Âu',
  };

  constructor(private conceptService: Concept, private bannerService: Banner) {}

  ngOnInit(): void {
    const savedState = this.conceptService.listState;
    if (savedState) {
      this.selectedRoomTypes = new Set(savedState.selectedRoomTypes);
      this.selectedStyles = new Set(savedState.selectedStyles);
      this.displayedCount = savedState.displayedCount;
    }

    this.loadConcepts(savedState?.scrollPosition);
    this.bannerService.getBannerData().subscribe((banners: iBanner[]) => {
      this.heroBanners = banners
        .filter((b) => b.Trang_thai && (b.Trang === 'concept' || b.Trang === 'Gợi ý không gian'))
        .sort((a, b) => Number(a.Thu_tu || 0) - Number(b.Thu_tu || 0));

      if (this.heroBanners.length === 0) {
        return;
      }

      this.updateHeroData();

      if (this.heroBanners.length > 1) {
        this.startHeroSlider();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
    }
  }

  private updateHeroData(): void {
    const heroBanner = this.heroBanners[this.currentHeroIndex];
    if (!heroBanner) {
      return;
    }

    this.heroData = {
      title: (heroBanner.Tieu_de_chinh || heroBanner.Tieu_de || '').trim(),
      backgroundImage: (heroBanner.Hinh_anh || '').trim(),
    };
  }

  private startHeroSlider(): void {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
    }

    this.heroInterval = setInterval(() => {
      this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroBanners.length;
      this.updateHeroData();
    }, 5000);
  }

  setHeroIndex(index: number): void {
    this.currentHeroIndex = index;
    this.updateHeroData();

    if (this.heroBanners.length > 1) {
      this.startHeroSlider();
    }
  }

  loadConcepts(scrollTo?: number): void {
    this.conceptService.getConceptData().subscribe(
      (data: iConcept[]) => {
        this.concepts = data;
        if (scrollTo !== undefined) {
          setTimeout(() => {
            window.scrollTo({ top: scrollTo, behavior: 'instant' });
          }, 150);
          this.conceptService.listState = null;
        }
      },
      (error) => {
        console.error('Error loading concepts:', error);
      }
    );
  }

  saveState(): void {
    this.conceptService.listState = {
      selectedRoomTypes: Array.from(this.selectedRoomTypes),
      selectedStyles: Array.from(this.selectedStyles),
      displayedCount: this.displayedCount,
      scrollPosition: window.scrollY || document.documentElement.scrollTop
    };
  }

  toggleRoomType(roomTypeId: string): void {
    if (this.selectedRoomTypes.has(roomTypeId)) {
      this.selectedRoomTypes.delete(roomTypeId);
    } else {
      this.selectedRoomTypes.add(roomTypeId);
    }
    this.displayedCount = 6;
  }

  toggleStyle(styleId: string): void {
    if (this.selectedStyles.has(styleId)) {
      this.selectedStyles.delete(styleId);
    } else {
      this.selectedStyles.add(styleId);
    }
    this.displayedCount = 6;
  }

  toggleRoomDropdown(): void {
    this.openRoomDropdown = !this.openRoomDropdown;
    this.openStyleDropdown = false;
  }

  toggleStyleDropdown(): void {
    this.openStyleDropdown = !this.openStyleDropdown;
    this.openRoomDropdown = false;
  }

  selectRoom(roomTypeId: string): void {
    this.toggleRoomType(roomTypeId);
  }

  selectStyle(styleId: string): void {
    this.toggleStyle(styleId);
  }

  clearFilters(): void {
    this.selectedRoomTypes.clear();
    this.selectedStyles.clear();
    this.displayedCount = 6;
  }

  loadMore(): void {
    this.displayedCount += this.itemsPerPage;
  }

  get filteredConcepts(): iConcept[] {
    return this.concepts.filter((concept) => {
      const matchRoom =
        this.selectedRoomTypes.size === 0 ||
        this.selectedRoomTypes.has(concept.Ma_loai_phong);
      const matchStyle =
        this.selectedStyles.size === 0 ||
        this.selectedStyles.has(concept.Ma_phong_cach);
      return matchRoom && matchStyle && concept.Trang_thai;
    });
  }

  get displayedConcepts(): iConcept[] {
    return this.filteredConcepts.slice(0, this.displayedCount);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const filterSection = document.querySelector('.filter-section');
    
    if (filterSection && !filterSection.contains(target)) {
      this.openRoomDropdown = false;
      this.openStyleDropdown = false;
    }
  }
}
