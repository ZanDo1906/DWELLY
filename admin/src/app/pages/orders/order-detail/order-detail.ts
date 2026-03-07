import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { iClient } from '../../../interfaces/client';
import { iOrder } from '../../../interfaces/order';
import { iOrderDetail } from '../../../interfaces/order_details';
import { iProduct } from '../../../interfaces/product';
import { iRoom } from '../../../interfaces/room';
import { Client as ClientService } from '../../../services/client';
import { Order_Details as OrderDetailsService } from '../../../services/order_details';
import { Order as OrderService } from '../../../services/order';
import { Product as ProductService } from '../../../services/product';
import { Room as RoomService } from '../../../services/room';

interface CartItem {
  product: iProduct;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail implements OnInit {
  rooms: iRoom[] = [];
  cartItems: CartItem[] = [];
  showStatusDropdown = false;

  currentOrder: iOrder | null = null;
  orderDisplayCode = '--';
  orderDateDisplay = '--:-- --/--/----';

  customerName = 'Khách hàng';
  customerPhone = 'Chưa có';
  customerEmail = 'Chưa có';
  customerAddress = 'Chưa có';

  subtotal = 0;
  shippingFee = 0;
  discountAmount = 0;
  grandTotal = 0;
  selectedPaymentMode: 'deposit' | 'full' = 'full';

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private orderDetailsService: OrderDetailsService,
    private productService: ProductService,
    private roomService: RoomService,
    private clientService: ClientService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const routeOrderId = this.route.snapshot.paramMap.get('id')?.trim();

    forkJoin({
      rooms: this.roomService.getRoomData(),
      products: this.productService.getProductData(),
      orders: this.orderService.getOrderData(),
      orderDetails: this.orderDetailsService.getOrderDetailsData(),
      clients: this.clientService.getClientData(),
    }).subscribe(({ rooms, products, orders, orderDetails, clients }) => {
      this.rooms = rooms;

      const targetOrder = routeOrderId
        ? orders.find((order) => order.Ma_don_mua === routeOrderId)
        : orders[0];

      if (!targetOrder) {
        this.resetOrderState();
        return;
      }

      this.currentOrder = targetOrder;
      this.orderDisplayCode = targetOrder.Ma_don_mua;
      this.orderDateDisplay = this.formatOrderDate(targetOrder.Ngay_dat);

      this.resolveCustomerInfo(targetOrder, clients);

      const productMap = new Map(products.map((product) => [product.Ma_san_pham, product]));
      const detailsForOrder = orderDetails.filter((detail) => detail.Ma_don_mua === targetOrder.Ma_don_mua);

      this.cartItems = detailsForOrder.map((detail) => {
        const product = productMap.get(detail.Ma_san_pham);
        return {
          product: product || this.createEmptyProduct(detail.Ma_san_pham),
          quantity: Number(detail.So_luong || 0),
          unitPrice: Number(detail.Don_gia || product?.Gia_ban || 0),
        };
      });

      this.subtotal = this.cartItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      this.shippingFee = Number(targetOrder.Phi_van_chuyen || 0);
      this.grandTotal = Number(targetOrder.Tong_tien || 0);
      this.discountAmount = Math.max(0, this.subtotal + this.shippingFee - this.grandTotal);

      const normalizedPaymentMethod = this.normalizeText(targetOrder.Hinh_thuc_thanh_toan || '');
      this.selectedPaymentMode = normalizedPaymentMethod.includes('coc') ? 'deposit' : 'full';
    });
  }

  private resetOrderState(): void {
    this.currentOrder = null;
    this.orderDisplayCode = '--';
    this.orderDateDisplay = '--:-- --/--/----';
    this.customerName = 'Khách hàng';
    this.customerPhone = 'Chưa có';
    this.customerEmail = 'Chưa có';
    this.customerAddress = 'Chưa có';
    this.cartItems = [];
    this.subtotal = 0;
    this.shippingFee = 0;
    this.discountAmount = 0;
    this.grandTotal = 0;
    this.selectedPaymentMode = 'full';
  }

  private resolveCustomerInfo(order: iOrder, clients: iClient[]): void {
    const orderRecord = order as unknown as Record<string, unknown>;
    const shippingInfo = order.Thong_tin_giao_hang;
    const guestInfo = order.Thong_tin_khach_vang_lai as {
      Ho_va_ten?: string;
      So_dien_thoai?: string;
      Dia_chi_cu_the?: string;
      Email?: string;
      Tinh_thanh?: string;
      Quan_huyen?: string;
      Phuong_xa?: string;
    };

    const client = order.Ma_khach_hang
      ? clients.find((item) => item.Ma_khach_hang === order.Ma_khach_hang)
      : undefined;

    const preferredEmail = (client?.Email || guestInfo?.Email || '').trim();

    const shippingComposedAddress = this.composeAddressFrom4Parts(
      shippingInfo?.Dia_chi_cu_the,
      shippingInfo?.Phuong_xa,
      shippingInfo?.Quan_huyen,
      shippingInfo?.Tinh_thanh,
    );

    const guestComposedAddress = this.composeAddressFrom4Parts(
      guestInfo?.Dia_chi_cu_the,
      guestInfo?.Phuong_xa,
      guestInfo?.Quan_huyen,
      guestInfo?.Tinh_thanh,
    );

    const shippingAddress = this.resolveAddress(
      shippingComposedAddress,
      orderRecord['Dia_chi'],
    );

    const addressFromOrder = this.resolveAddress(
      shippingAddress,
      guestComposedAddress,
      guestInfo?.Dia_chi_cu_the,
    );

    const shippingName = (shippingInfo?.Ho_ten_nguoi_nhan || '').trim();
    const shippingPhone = (shippingInfo?.So_dien_thoai_nguoi_nhan || '').trim();
    const guestName = (guestInfo?.Ho_va_ten || '').trim();
    const guestPhone = (guestInfo?.So_dien_thoai || '').trim();
    const isGuestOrder = !order.Ma_khach_hang;

    if (isGuestOrder && (guestName || guestPhone || addressFromOrder)) {
      this.customerName = guestName || shippingName || 'Khách hàng';
      this.customerPhone = guestPhone || shippingPhone || 'Chưa có';
      this.customerEmail = preferredEmail || 'Chưa có';
      this.customerAddress = addressFromOrder || 'Chưa có';
      return;
    }

    if (shippingName || shippingPhone || addressFromOrder) {
      this.customerName = shippingName || 'Khách hàng';
      this.customerPhone = shippingPhone || 'Chưa có';
      this.customerEmail = preferredEmail || 'Chưa có';
      this.customerAddress = addressFromOrder || 'Chưa có';
      return;
    }

    if (guestName) {
      this.customerName = guestName;
      this.customerPhone = guestPhone || 'Chưa có';
      this.customerEmail = preferredEmail || 'Chưa có';
      this.customerAddress = addressFromOrder || 'Chưa có';
      return;
    }

    if (client) {
      this.customerName = client.Ho_va_ten || 'Khách hàng';
      this.customerPhone = client.So_dien_thoai || 'Chưa có';
      this.customerEmail = preferredEmail || 'Chưa có';
      this.customerAddress =
        addressFromOrder ||
        this.resolveAddress(client.Dia_chi, orderRecord['Dia_chi'], orderRecord['dia_chi']) ||
        'Chưa có';
      return;
    }

    this.customerName = 'Khách hàng';
    this.customerPhone = 'Chưa có';
    this.customerEmail = 'Chưa có';
    this.customerAddress = addressFromOrder || 'Chưa có';
  }

  private composeAddressFrom4Parts(
    detail?: string,
    ward?: string,
    district?: string,
    province?: string,
  ): string {
    return [detail, ward, district, province]
      .map((part) => (part || '').trim())
      .filter((part) => part.length > 0)
      .join(', ');
  }

  private resolveAddress(...candidates: unknown[]): string {
    for (const candidate of candidates) {
      const resolved = this.stringifyAddress(candidate);
      if (resolved) {
        return resolved;
      }
    }
    return '';
  }

  private stringifyAddress(value: unknown): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const resolved = this.stringifyAddress(item);
        if (resolved) {
          return resolved;
        }
      }
      return '';
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const direct =
        this.stringifyAddress(record['Dia_chi']) ||
        this.stringifyAddress(record['Dia_chi_cu_the']) ||
        this.stringifyAddress(record['DetailAddress']) ||
        this.stringifyAddress(record['detailAddress']) ||
        this.stringifyAddress(record['address']) ||
        this.stringifyAddress(record['Address']);

      if (direct) {
        return direct;
      }

      const composed = [
        this.stringifyAddress(record['DetailAddress']),
        this.stringifyAddress(record['Ward']),
        this.stringifyAddress(record['District']),
        this.stringifyAddress(record['Province']),
      ].filter(Boolean);

      if (composed.length > 0) {
        return composed.join(', ');
      }
    }

    return '';
  }

  private createEmptyProduct(maSanPham: string): iProduct {
    return {
      Ma_san_pham: maSanPham,
      Ten_san_pham: 'Sản phẩm không xác định',
      Gia_ban: 0,
      Mo_ta: '',
      Kich_thuoc: '',
      Chat_lieu: '',
      Hinh_anh: [],
      So_luong_ton_kho: 0,
      Ma_loai_phong: '',
      Ma_phong_cach: '',
      Ma_danh_muc: '',
      Ma_khong_gian: '',
      Trang_thai: false,
    };
  }

  getRoomName(Ma_loai_phong: string): string {
    const room = this.rooms.find((r) => r.Ma_loai_phong === Ma_loai_phong);
    return room ? room.Ten_loai_phong : 'Không xác định';
  }

  formatPrice(price: number): string {
    return `${Number(price || 0).toLocaleString('vi-VN')} VNĐ`;
  }

  getLineTotal(item: CartItem): number {
    return item.unitPrice * item.quantity;
  }

  getDepositAmount(): number {
    return Math.round(this.grandTotal * 0.3);
  }

  get isOrderCompleted(): boolean {
    if (!this.currentOrder?.Trang_thai) {
      return false;
    }

    const normalizedStatus = this.normalizeText(this.currentOrder.Trang_thai);
    return normalizedStatus.includes('hoan thanh') || normalizedStatus.includes('completed');
  }

  private formatOrderDate(value: Date | string): string {
    if (typeof value === 'string') {
      const isoMatch = value.trim().match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?$/,
      );

      if (isoMatch) {
        const [, year, month, day, hour, minute] = isoMatch;
        return `${hour}:${minute} ${day}-${month}-${year}`;
      }
    }

    const date = new Date(value);
    const timestamp = date.getTime();
    if (Number.isNaN(timestamp)) {
      return '--:-- --/--/----';
    }

    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hour}:${minute} ${day}-${month}-${year}`;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  toggleStatusDropdown(): void {
    if (this.isOrderCompleted) {
      this.showStatusDropdown = false;
      return;
    }
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdownWrapper = target.closest('.dropdown-wrapper');
    if (!dropdownWrapper) {
      this.showStatusDropdown = false;
    }
  }
}
