import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { iClient } from '../../../interfaces/client';

interface AddressInfo {
  FullName?: string;
  Phone?: string;
  Province?: string;
  District?: string;
  Ward?: string;
  DetailAddress?: string;
  IsDefault?: boolean;
}

@Component({
  selector: 'app-user-form',
  imports: [CommonModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserForm implements OnInit {
  @Input() selectedUser: iClient | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() disable = new EventEmitter<void>();

  user: iClient = {
    Ma_khach_hang: '0001',
    Ho_va_ten: 'Lê Thanh Như Ngọc',
    So_dien_thoai: '0987654321',
    Email: 'ngocltn2341@st.uel.edu.vn',
    Dia_chi: ['2222 nề, Phường Bến Thành, Quận 2, Thành phố Hồ Chí Minh'],
    Trang_thai: true,
    Anh_dai_dien: 'assets/images/avt/avt_client.png',
    Ngay_tao: new Date('2025-01-15'),
    Ma_phan_hang: 'KIM CƯƠNG',
    Tong_diem: 0,
    Mat_khau: '',
    favorites: [],
  };

  ngOnInit(): void {
    if (this.selectedUser) {
      this.user = { ...this.selectedUser };
    }
  }

  get displayAddress(): string {
    const address = Array.isArray(this.user.Dia_chi)
      ? this.user.Dia_chi[0]
      : this.user.Dia_chi;

    if (!address) {
      return 'Chưa có địa chỉ';
    }

    if (typeof address === 'string') {
      return address;
    }

    const structuredAddress = address as AddressInfo;

    return [
      structuredAddress.DetailAddress,
      structuredAddress.Ward,
      structuredAddress.District,
      structuredAddress.Province,
    ]
      .filter(Boolean)
      .join(', ');
  }

  disableUser(): void {
    this.disable.emit();
  }

  getMembershipRank(code: string): string {
    const rankMap: { [key: string]: string } = {
      'DONG': 'Hạng đồng',
      'BAC': 'Hạng bạc',
      'VANG': 'Hạng vàng',
      'KIMCUONG': 'Hạng kim cương'
    };
    return rankMap[code] || 'Không xác định';
  }
}
