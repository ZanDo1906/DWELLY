import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Voucher } from '../../../services/voucher';
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

  constructor(private voucherService: Voucher) { }

  ngOnInit(): void {
    // Load vouchers
    this.voucherService.getVoucherData().subscribe({
      next: (data) => {
        // Filter only active vouchers
        this.vouchers = data.filter(v => {
          const today = new Date();
          const startDate = new Date(v.Ngay_bat_dau);
          const endDate = new Date(v.Ngay_het_han);
          return v.Trang_thai === true &&
            v.So_luong_con_lai > 0 &&
            today >= startDate &&
            today <= endDate;
        });
        this.filteredVouchers = [...this.vouchers];

        // Set current voucher if exists
        if (this.currentVoucher) {
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
    this.selectedVoucher = voucher;
  }

  clearSelection(): void {
    this.selectedVoucher = null;
    this.selectedVoucherCode = '';
  }

  applyVoucher(): void {
    if (this.selectedVoucher) {
      this.voucherSelected.emit(this.selectedVoucher);
      this.closeModal.emit();
    }
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
