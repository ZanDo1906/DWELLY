import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Voucher } from '../../../services/voucher';
import { Client } from '../../../services/client';
import { iVoucher } from '../../../interfaces/voucher';

@Component({
  selector: 'app-voucher-popup',
  imports: [CommonModule, FormsModule],
  templateUrl: './voucher-popup.html',
  styleUrl: './voucher-popup.css',
})
export class VoucherPopup implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  @Output() voucherSelected = new EventEmitter<iVoucher>();
  @Input() currentVoucher: iVoucher | null = null;

  vouchers: iVoucher[] = [];
  filteredVouchers: iVoucher[] = [];
  searchCode: string = '';
  selectedVoucher: iVoucher | null = null;
  selectedVoucherCode: string = '';
  currentUserRankCode: string = '';

  private readonly rankOrder: Record<string, number> = {
    DONG: 1,
    PH01: 1,
    BAC: 2,
    PH02: 2,
    VANG: 3,
    PH03: 3,
    KIMCUONG: 4,
    PH04: 4,
  };

  constructor(
    private voucherService: Voucher,
    private clientService: Client
  ) { }

  ngOnInit(): void {
    this.currentUserRankCode = this.getCurrentUserRankCode();
    this.syncCurrentUserRankFromClient();

    // Load vouchers
    this.voucherService.getVoucherData().subscribe({
      next: (data) => {
        // Chỉ hiển thị voucher đang hoạt động (Trang_thai === true)
        this.vouchers = data.filter(v => v.Trang_thai === true);
        this.filteredVouchers = [...this.vouchers];

        // Set current voucher if exists
        if (this.currentVoucher && this.isVoucherUsable(this.currentVoucher)) {
          this.selectedVoucher = this.currentVoucher;
          this.selectedVoucherCode = this.currentVoucher.Ma_so;
        }
      },
      error: (err) => {
        console.error('Error loading vouchers:', err);
      }
    });
  }

  searchVoucher(): void {
    if (!this.searchCode.trim()) {
      this.filteredVouchers = [...this.vouchers];
      return;
    }

    const searchTerm = this.searchCode.toLowerCase().trim();
    this.filteredVouchers = this.vouchers.filter(v =>
      v.Ma_so.toLowerCase().includes(searchTerm) ||
      v.Mo_ta.toLowerCase().includes(searchTerm)
    );
  }

  selectVoucher(voucher: iVoucher): void {
    if (!this.isVoucherUsable(voucher)) {
      return;
    }

    this.selectedVoucher = voucher;
  }

  clearSelection(): void {
    this.selectedVoucher = null;
    this.selectedVoucherCode = '';
  }

  applyVoucher(): void {
    if (this.selectedVoucher && this.isVoucherUsable(this.selectedVoucher)) {
      this.voucherSelected.emit(this.selectedVoucher);
      this.closeModal.emit();
    }
  }

  isVoucherUsable(voucher: iVoucher): boolean {
    return this.isVoucherEligible(voucher) && this.isVoucherCurrentlyValid(voucher);
  }

  isVoucherEligible(voucher: iVoucher): boolean {
    const requiredRankLevel = this.getRankLevel(voucher.Ma_phan_hang_toi_thieu);
    if (requiredRankLevel === 0) {
      return true;
    }

    const currentRankLevel = this.getRankLevel(this.currentUserRankCode);
    return currentRankLevel >= requiredRankLevel;
  }

  getVoucherMinRankLabel(voucher: iVoucher): string {
    const normalized = this.normalizeRank(voucher.Ma_phan_hang_toi_thieu);
    if (normalized === 'DONG' || normalized === 'PH01') return 'Đồng';
    if (normalized === 'BAC' || normalized === 'PH02') return 'Bạc';
    if (normalized === 'VANG' || normalized === 'PH03') return 'Vàng';
    if (normalized === 'KIMCUONG' || normalized === 'PH04') return 'Kim cương';
    return voucher.Ma_phan_hang_toi_thieu || 'Thành viên phù hợp';
  }

  private isVoucherCurrentlyValid(voucher: iVoucher): boolean {
    const today = new Date();
    const startDate = new Date(voucher.Ngay_bat_dau);
    const endDate = new Date(voucher.Ngay_het_han);

    return voucher.Trang_thai === true
      && voucher.So_luong_con_lai > 0
      && today >= startDate
      && today <= endDate;
  }

  private getCurrentUserRankCode(): string {
    try {
      const userRaw = localStorage.getItem('current_user');
      if (!userRaw) {
        return '';
      }

      const user = JSON.parse(userRaw);
      return user?.Ma_phan_hang || '';
    } catch {
      return '';
    }
  }

  private syncCurrentUserRankFromClient(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      return;
    }

    this.clientService.getClientById(userId).subscribe({
      next: (client) => {
        const rankCode = client?.Ma_phan_hang || '';
        if (!rankCode) {
          return;
        }

        this.currentUserRankCode = rankCode;

        if (this.selectedVoucher && !this.isVoucherUsable(this.selectedVoucher)) {
          this.clearSelection();
        }
      },
      error: () => {
        // Keep fallback rank from localStorage when client API is unavailable.
      }
    });
  }

  private getRankLevel(rankCode: string): number {
    const normalized = this.normalizeRank(rankCode);
    return this.rankOrder[normalized] || 0;
  }

  private normalizeRank(value: string): string {
    return (value || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[\s_-]+/g, '');
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }
}
