import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-maintenance-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance-modal.html',
  styleUrl: './maintenance-modal.css'
})
export class MaintenanceModal implements OnInit {
  @Input() data: any; // Nhận object từ care_instruction.json
  @Output() close = new EventEmitter<void>();

  activeTab: string = 'overview';
  safeVideoUrl?: SafeResourceUrl;
  currentVideoTitle: string = 'Sổ tay bảo dưỡng sản phẩm';
  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    if (this.data && this.data.Link_video) {
      const idx = this.data.selectedVideoIndex ?? 0;
      this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.Link_video[idx]);
      this.currentVideoTitle = this.getVideoTitle(idx); 
    }
  }

  setVideo(url: string, index: number) {
  this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  this.currentVideoTitle = this.getVideoTitle(index);
}


  onClose() {
    this.close.emit();
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }


getVideoTitle(index: number): string { const titlesMap: Record<string, string[]> = { 'HD01': ['Cách vệ sinh Sofa vải đơn giản', 'Hướng dẫn làm sạch ghế Sofa nỉ như chuyên gia', '3 phương pháp vệ sinh Sofa tại nhà'], 'HD02': ['Cách vệ sinh và bảo quản đồ nội thất gỗ', 'Mẹo bảo trì đồ gỗ bền đẹp lâu dài', 'Hướng dẫn phục hồi độ bóng bề mặt gỗ'], 'HD03': ['Hướng dẫn vệ sinh đèn chùm và đèn trang trí', 'Các lưu ý bảo trì hệ thống chiếu sáng an toàn'], 'HD04': ['Cách giặt gối đúng cách không bị biến dạng', 'Cẩm nang chăm sóc chăn ga gối nệm định kỳ'], 'HD05': ['Cách vệ sinh thảm trải sàn cỡ lớn tại nhà', 'Quy trình làm sạch thảm chuyên nghiệp'], }; return titlesMap[this.data?.Ma_huong_dan]?.[index] || `Video ${index+1}`; }}
