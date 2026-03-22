import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal } from '../../../components/modal/modal';
import { AddAddressModal } from './add-address-modal/add-address-modal';
import { Client } from '../../../services/client';

interface AddressDisplayItem {
  sourceIndex: number;
  fullName: string;
  phone: string;
  address: string;
  isDefault: boolean;
  rawData: any;
}

interface AddressSavedEvent {
  message: string;
}

@Component({
  selector: 'app-address',
  imports: [CommonModule, Modal, AddAddressModal],
  templateUrl: './address.html',
  styleUrl: './address.css',
})
export class Address implements OnInit {
  userId: string = '';
  customerName: string = 'Khách hàng';
  customerPhone: string = '';
  rawAddresses: any[] = [];
  addresses: AddressDisplayItem[] = [];
  isLoading = false;
  addressModalTitle = 'Địa chỉ mới';
  addressModalMode: 'add' | 'edit' = 'add';
  editingAddressIndex: number | null = null;
  editingAddressData: any = null;
  pendingDeleteIndex: number | null = null;
  deletingAddressIndex: number | null = null;
  isDeletingAddress = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private clientService: Client) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';

    if (this.userId) {
      this.loadClientInfo();
      this.loadAddresses();
    }
  }

  loadClientInfo(): void {
    this.clientService.getClientById(this.userId).subscribe({
      next: (client) => {
        this.customerName = client?.Ho_va_ten || 'Khách hàng';
        this.customerPhone = client?.So_dien_thoai || '';
        this.buildAddressDisplay();
      },
      error: (err) => {
        console.error('Error loading customer info:', err);
      }
    });
  }

  loadAddresses(): void {
    this.isLoading = true;

    this.clientService.getClientAddress(this.userId).subscribe({
      next: (response) => {
        this.rawAddresses = response?.address || [];
        this.buildAddressDisplay();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading address list:', err);
        this.rawAddresses = [];
        this.addresses = [];
        this.isLoading = false;
      }
    });
  }

  openAddAddressModal(): void {
    this.addressModalTitle = 'Địa chỉ mới';
    this.addressModalMode = 'add';
    this.editingAddressIndex = null;
    this.editingAddressData = null;
  }

  openEditAddress(address: AddressDisplayItem): void {
    this.addressModalTitle = 'Cập nhật địa chỉ';
    this.addressModalMode = 'edit';
    this.editingAddressIndex = address.sourceIndex;
    this.editingAddressData = address.rawData;
  }

  onAddressSaved(event: AddressSavedEvent): void {
    this.loadAddresses();
    this.pushToast(event?.message || 'Thêm địa chỉ thành công', 'success');
  }

  deleteAddress(index: number): void {
    this.pendingDeleteIndex = index;
  }

  confirmDeleteAddress(): void {
    if (this.pendingDeleteIndex === null) {
      return;
    }

    this.deleteAddressConfirmed(this.pendingDeleteIndex);
  }

  private deleteAddressConfirmed(index: number): void {
    if (!this.userId) {
      this.pushToast('Không xác định được tài khoản. Vui lòng đăng nhập lại.', 'error');
      this.pendingDeleteIndex = null;
      return;
    }

    this.isDeletingAddress = true;
    this.deletingAddressIndex = index;

    this.clientService.deleteClientAddress(this.userId, index).subscribe({
      next: (response) => {
        this.pushToast(response?.message || 'Xóa địa chỉ thành công', 'success');
        this.closeDeleteAddressModal();
        this.loadAddresses();
        this.isDeletingAddress = false;
        this.deletingAddressIndex = null;
        this.pendingDeleteIndex = null;
      },
      error: (err) => {
        this.pushToast(err?.error?.message || err?.message || 'Xóa địa chỉ thất bại', 'error');
        this.isDeletingAddress = false;
        this.deletingAddressIndex = null;
        this.pendingDeleteIndex = null;
      }
    });
  }

  private closeDeleteAddressModal(): void {
    const modalEl = document.getElementById('deleteAddressConfirmModal');
    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    modalInstance?.hide();
  }

  setDefaultAddress(address: AddressDisplayItem): void {
    if (!this.userId) {
      alert('Không xác định được tài khoản. Vui lòng đăng nhập lại.');
      return;
    }

    const raw = address.rawData || {};
    const payload = {
      FullName: String(raw.FullName || address.fullName || '').trim(),
      Phone: String(raw.Phone || address.phone || '').trim(),
      Province: String(raw.Province || '').trim(),
      District: String(raw.District || '').trim(),
      Ward: String(raw.Ward || '').trim(),
      DetailAddress: String(raw.DetailAddress || '').trim(),
      IsDefault: true,
    };

    this.clientService.updateClientAddress(this.userId, address.sourceIndex, payload).subscribe({
      next: (response) => {
        alert(response?.message || 'Thiết lập địa chỉ mặc định thành công');
        this.loadAddresses();
      },
      error: (err) => {
        alert(err?.error?.message || err?.message || 'Thiết lập mặc định thất bại');
      }
    });
  }

  private buildAddressDisplay(): void {
    const mappedAddresses = this.rawAddresses
      .map((item, index) => this.mapAddressItem(item, index))
      .filter((item): item is AddressDisplayItem => item !== null);

    this.addresses = mappedAddresses;
  }

  private mapAddressItem(item: any, index: number): AddressDisplayItem | null {
    if (typeof item === 'string') {
      const addressText = item.trim();
      if (!addressText) return null;

      return {
        sourceIndex: index,
        fullName: this.customerName,
        phone: this.customerPhone,
        address: addressText,
        isDefault: index === 0,
        rawData: {
          FullName: this.customerName,
          Phone: this.customerPhone,
          Province: '',
          District: '',
          Ward: '',
          DetailAddress: addressText,
          IsDefault: index === 0,
        },
      };
    }

    if (item && typeof item === 'object') {
      const fullName = item.FullName || item.fullName || item.name || item.ten_nguoi_nhan || this.customerName;
      const phone = item.Phone || item.phone || item.so_dien_thoai || item.soDienThoai || this.customerPhone;
      const address = item.address
        || item.dia_chi
        || item.fullAddress
        || [item.DetailAddress, item.Ward, item.District, item.Province].filter(Boolean).join(', ')
        || '';

      if (!String(address).trim()) return null;

      return {
        sourceIndex: index,
        fullName,
        phone,
        address: String(address).trim(),
        isDefault: Boolean(item.IsDefault),
        rawData: item,
      };
    }

    return null;
  }

  private pushToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.toastTimer = null;
    }, 2500);
  }

}
