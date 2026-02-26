import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  Ma_khach_hang: string;
  Ho_va_ten: string;
  So_dien_thoai: string;
  Email: string;
  Dia_chi: string | string[];
  Trang_thai: boolean;
  Anh_dai_dien: string;
  Ngay_tao: Date;
  Ma_phan_hang: string;
  Tong_diem: number;
}

interface UserFormData {
  Ngay_sinh?: string;
  Trang_thai: boolean;
  So_dien_thoai: string;
  Email: string;
  Dia_chi: string;
}

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserForm implements OnInit {
  @Input() selectedUser: User | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  user: User = {
    Ma_khach_hang: '0001',
    Ho_va_ten: 'Lê Thanh Như Ngọc',
    So_dien_thoai: '0987654321',
    Email: 'ngocltn2341@st.uel.edu.vn',
    Dia_chi: '2222 nề, Phường Bến Thành, Quận 2, Thành phố Hồ Chí Minh',
    Trang_thai: true,
    Anh_dai_dien: 'assets/images/avt/avt_client.png',
    Ngay_tao: new Date('2025-01-15'),
    Ma_phan_hang: 'KIM CƯƠNG',
    Tong_diem: 0,
  };

  userForm: UserFormData = {
    Ngay_sinh: '',
    Trang_thai: true,
    So_dien_thoai: '',
    Email: '',
    Dia_chi: '',
  };

  ngOnInit(): void {
    if (this.selectedUser) {
      this.user = { ...this.selectedUser };
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    this.userForm = {
      Ngay_sinh: '',
      Trang_thai: this.user.Trang_thai,
      So_dien_thoai: this.user.So_dien_thoai,
      Email: this.user.Email,
      Dia_chi: Array.isArray(this.user.Dia_chi) ? this.user.Dia_chi[0] : this.user.Dia_chi,
    };
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
