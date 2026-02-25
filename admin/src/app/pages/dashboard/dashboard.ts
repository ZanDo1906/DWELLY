import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { iCategory } from '../../interfaces/category';
import { iOrderDetail } from '../../interfaces/order_details';
import { iOrder } from '../../interfaces/order';
import { iProduct } from '../../interfaces/product';
import { Category } from '../../services/category';
import { Order_Details } from '../../services/order_details';
import { Order } from '../../services/order';
import { Product } from '../../services/product';

type PeriodKey = 'this-week' | 'this-month' | 'this-year';

interface TopProductItem {
  name: string;
  quantity: number;
}

interface StatusItem {
  label: string;
  count: number;
}

interface CategoryShareItem {
  name: string;
  quantity: number;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  selectedPeriod: PeriodKey = 'this-week';
  periodOptions: { key: PeriodKey; label: string }[] = [
    { key: 'this-week', label: 'Tuần này' },
    { key: 'this-month', label: 'Tháng này' },
    { key: 'this-year', label: 'Năm này' },
  ];

  dataLoaded = false;

  totalRevenue = 0;
  totalOrders = 0;

  topProducts: TopProductItem[] = [];
  orderStatusItems: StatusItem[] = [];
  categoryShareItems: CategoryShareItem[] = [];

  chartXAxisLabels: string[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  currentPeriodSeries: number[] = [0, 0, 0, 0, 0, 0, 0];
  previousPeriodSeries: number[] = [0, 0, 0, 0, 0, 0, 0];

  private orders: iOrder[] = [];
  private orderDetails: iOrderDetail[] = [];
  private products: iProduct[] = [];
  private categories: iCategory[] = [];

  constructor(
    private orderService: Order,
    private orderDetailsService: Order_Details,
    private productService: Product,
    private categoryService: Category,
  ) { }

  ngOnInit(): void {
    forkJoin({
      orders: this.orderService.getOrderData(),
      orderDetails: this.orderDetailsService.getOrderDetailsData(),
      products: this.productService.getProductData(),
      categories: this.categoryService.getCategoryData(),
    }).subscribe({
      next: ({ orders, orderDetails, products, categories }) => {
        this.orders = orders;
        this.orderDetails = orderDetails;
        this.products = products;
        this.categories = categories;
        this.refreshDashboard();
        this.dataLoaded = true;
      },
      error: () => {
        this.dataLoaded = true;
      },
    });
  }

  onPeriodChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedPeriod = target.value as PeriodKey;
    this.refreshDashboard();
  }

  get donutBackground(): string {
    if (!this.categoryShareItems.length) {
      return 'conic-gradient(#e6dfd3 0deg 360deg)';
    }

    let start = 0;
    const segments = this.categoryShareItems.map((item) => {
      const end = start + item.percent * 3.6;
      const color = `${item.color} ${start}deg ${end}deg`;
      start = end;
      return color;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  get currentPolylinePoints(): string {
    return this.buildPolylinePoints(this.currentPeriodSeries);
  }

  get previousPolylinePoints(): string {
    return this.buildPolylinePoints(this.previousPeriodSeries);
  }

  get currentPeriodLabel(): string {
    if (this.selectedPeriod === 'this-month') {
      return 'Tháng hiện tại';
    }
    if (this.selectedPeriod === 'this-year') {
      return 'Năm hiện tại';
    }
    return 'Tuần hiện tại';
  }

  get previousPeriodLabel(): string {
    if (this.selectedPeriod === 'this-month') {
      return 'Tháng trước';
    }
    if (this.selectedPeriod === 'this-year') {
      return 'Năm trước';
    }
    return 'Tuần trước';
  }

  get yAxisLabels(): string[] {
    const max = this.getSeriesMax();
    return [max, Math.round((max * 2) / 3), Math.round(max / 3), 0].map((value) => this.formatCompactNumber(value));
  }

  get xAxisGridTemplateColumns(): string {
    const totalLabels = Math.max(this.chartXAxisLabels.length, 1);
    return `repeat(${totalLabels}, minmax(0, 1fr))`;
  }

  get statusAxisLabels(): number[] {
    const max = this.maxStatusCount;
    return [max, Math.round((max * 2) / 3), Math.round(max / 3), 0];
  }

  get maxStatusCount(): number {
    const max = Math.max(...this.orderStatusItems.map((item) => item.count), 1);
    return max;
  }

  getStatusBarHeight(count: number): number {
    const chartHeight = 92;
    const minHeight = 8;
    if (count <= 0) {
      return minHeight;
    }

    return Math.max(minHeight, Math.round((count / this.maxStatusCount) * chartHeight));
  }

  formatCurrency(value: number): string {
    return `${Math.round(value).toLocaleString('vi-VN')} VND`;
  }

  private refreshDashboard(): void {
    const filteredOrders = this.filterOrdersByPeriod(this.orders, this.selectedPeriod);
    const orderIdSet = new Set(filteredOrders.map((order) => order.Ma_don_mua));
    const filteredDetails = this.orderDetails.filter((detail) => orderIdSet.has(detail.Ma_don_mua));

    this.totalRevenue = filteredOrders.reduce((total, order) => total + Number(order.Tong_tien || 0), 0);
    this.totalOrders = filteredOrders.length;

    this.topProducts = this.buildTopProducts(filteredDetails).slice(0, 5);
    this.orderStatusItems = this.buildStatusItems(filteredOrders);
    this.categoryShareItems = this.buildCategoryShare(filteredDetails).slice(0, 5);

    const periodSeries = this.buildRevenueSeriesByPeriod(this.orders, this.selectedPeriod);
    this.currentPeriodSeries = periodSeries.current;
    this.previousPeriodSeries = periodSeries.previous;
    this.chartXAxisLabels = periodSeries.labels;
  }

  private filterOrdersByPeriod(orders: iOrder[], period: PeriodKey): iOrder[] {
    if (!orders.length) {
      return [];
    }

    const anchorDate = this.getMaxOrderDate(orders);
    const anchorStart = this.startOfDay(anchorDate);
    const dayMs = 24 * 60 * 60 * 1000;

    const thisWeekStart = this.startOfWeek(anchorStart);
    const thisWeekEnd = new Date(thisWeekStart.getTime() + dayMs * 7);
    const lastWeekStart = new Date(thisWeekStart.getTime() - dayMs * 7);

    const monthStart = new Date(anchorStart.getFullYear(), anchorStart.getMonth(), 1);
    const monthEnd = new Date(anchorStart.getFullYear(), anchorStart.getMonth() + 1, 1);

    const yearStart = new Date(anchorStart.getFullYear(), 0, 1);
    const yearEnd = new Date(anchorStart.getFullYear() + 1, 0, 1);

    return orders.filter((order) => {
      const date = new Date(order.Ngay_dat);

      if (period === 'this-week') {
        return date >= thisWeekStart && date < thisWeekEnd;
      }

      if (period === 'this-month') {
        return date >= monthStart && date < monthEnd;
      }

      return date >= yearStart && date < yearEnd;
    });
  }

  private buildTopProducts(details: iOrderDetail[]): TopProductItem[] {
    const productMap = new Map(this.products.map((product) => [product.Ma_san_pham, product.Ten_san_pham]));
    const quantityMap = new Map<string, number>();

    details.forEach((detail) => {
      const key = detail.Ma_san_pham;
      const quantity = Number(detail.So_luong || 0);
      quantityMap.set(key, (quantityMap.get(key) || 0) + quantity);
    });

    return Array.from(quantityMap.entries())
      .map(([productId, quantity]) => ({
        name: productMap.get(productId) || `Sản phẩm ${productId}`,
        quantity,
      }))
      .sort((first, second) => second.quantity - first.quantity);
  }

  private buildStatusItems(orders: iOrder[]): StatusItem[] {
    const lower = (value: string) => value.trim().toLowerCase();
    const countByStatus = {
      pending: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const status = lower(order.Trang_thai || '');
      if (status.includes('chờ')) {
        countByStatus.pending += 1;
        return;
      }
      if (status.includes('đang giao')) {
        countByStatus.shipping += 1;
        return;
      }
      if (status.includes('hoàn thành')) {
        countByStatus.completed += 1;
        return;
      }
      if (status.includes('hủy')) {
        countByStatus.cancelled += 1;
      }
    });

    return [
      { label: 'Đang xác nhận', count: countByStatus.pending },
      { label: 'Đang giao', count: countByStatus.shipping },
      { label: 'Đã hoàn thành', count: countByStatus.completed },
      { label: 'Đã hủy', count: countByStatus.cancelled },
    ];
  }

  private buildCategoryShare(details: iOrderDetail[]): CategoryShareItem[] {
    const productCategoryMap = new Map(this.products.map((product) => [product.Ma_san_pham, product.Ma_danh_muc]));
    const categoryNameMap = new Map(this.categories.map((category) => [category.Ma_danh_muc, category.Ten_danh_muc]));
    const palette = ['#111111', '#6fa4e8', '#77d3b8', '#9bb9ea', '#d4c7b6'];

    const quantityByCategory = new Map<string, number>();
    details.forEach((detail) => {
      const categoryId = productCategoryMap.get(detail.Ma_san_pham);
      if (!categoryId) {
        return;
      }
      const quantity = Number(detail.So_luong || 0);
      quantityByCategory.set(categoryId, (quantityByCategory.get(categoryId) || 0) + quantity);
    });

    const totalQuantity = Array.from(quantityByCategory.values()).reduce((sum, value) => sum + value, 0);
    if (!totalQuantity) {
      return [];
    }

    return Array.from(quantityByCategory.entries())
      .map(([categoryId, quantity], index) => ({
        name: categoryNameMap.get(categoryId) || `Danh mục ${categoryId}`,
        quantity,
        percent: Number(((quantity / totalQuantity) * 100).toFixed(1)),
        color: palette[index % palette.length],
      }))
      .sort((first, second) => second.quantity - first.quantity);
  }

  private buildRevenueSeriesByPeriod(
    orders: iOrder[],
    period: PeriodKey,
  ): { current: number[]; previous: number[]; labels: string[] } {
    if (!orders.length) {
      if (period === 'this-year') {
        const labels = Array.from({ length: 12 }, (_, index) => `T${index + 1}`);
        return {
          current: Array(12).fill(0),
          previous: Array(12).fill(0),
          labels,
        };
      }

      if (period === 'this-month') {
        return {
          current: [],
          previous: [],
          labels: [],
        };
      }

      return {
        current: [0, 0, 0, 0, 0, 0, 0],
        previous: [0, 0, 0, 0, 0, 0, 0],
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      };
    }

    const anchor = this.getMaxOrderDate(orders);

    if (period === 'this-year') {
      const currentYear = anchor.getFullYear();
      const previousYear = currentYear - 1;
      const current = Array(12).fill(0);
      const previous = Array(12).fill(0);
      const labels = Array.from({ length: 12 }, (_, index) => `T${index + 1}`);

      orders.forEach((order) => {
        const date = new Date(order.Ngay_dat);
        const revenue = Number(order.Tong_tien || 0);
        const monthIndex = date.getMonth();

        if (date.getFullYear() === currentYear) {
          current[monthIndex] += revenue;
        } else if (date.getFullYear() === previousYear) {
          previous[monthIndex] += revenue;
        }
      });

      return { current, previous, labels };
    }

    if (period === 'this-month') {
      const currentMonth = anchor.getMonth();
      const currentYear = anchor.getFullYear();
      const previousAnchor = new Date(currentYear, currentMonth - 1, 1);
      const previousMonth = previousAnchor.getMonth();
      const previousYear = previousAnchor.getFullYear();
      const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      const current = Array(daysInCurrentMonth).fill(0);
      const previous = Array(daysInCurrentMonth).fill(0);
      const labels = Array.from({ length: daysInCurrentMonth }, (_, index) => `${index + 1}`);

      orders.forEach((order) => {
        const date = new Date(order.Ngay_dat);
        const revenue = Number(order.Tong_tien || 0);
        const dayIndex = date.getDate() - 1;

        if (dayIndex < 0 || dayIndex >= daysInCurrentMonth) {
          return;
        }

        if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
          current[dayIndex] += revenue;
        } else if (date.getFullYear() === previousYear && date.getMonth() === previousMonth) {
          previous[dayIndex] += revenue;
        }
      });

      return { current, previous, labels };
    }

    const thisWeekStart = this.startOfWeek(anchor);
    const previousWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const current = [0, 0, 0, 0, 0, 0, 0];
    const previous = [0, 0, 0, 0, 0, 0, 0];
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    orders.forEach((order) => {
      const date = new Date(order.Ngay_dat);
      const revenue = Number(order.Tong_tien || 0);

      const currentIndex = this.getDayIndex(date, thisWeekStart);
      if (currentIndex >= 0 && currentIndex < 7) {
        current[currentIndex] += revenue;
      }

      const previousIndex = this.getDayIndex(date, previousWeekStart);
      if (previousIndex >= 0 && previousIndex < 7) {
        previous[previousIndex] += revenue;
      }
    });

    return { current, previous, labels };
  }

  private buildPolylinePoints(series: number[]): string {
    const width = 700;
    const height = 220;
    const paddingX = 28;
    const paddingY = 16;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;
    const max = this.getSeriesMax();

    if (!series.length) {
      return '';
    }

    if (series.length === 1) {
      const y = paddingY + chartHeight - (series[0] / max) * chartHeight;
      return `${(paddingX + chartWidth / 2).toFixed(1)},${y.toFixed(1)}`;
    }

    return series
      .map((value, index) => {
        const x = paddingX + (chartWidth / (series.length - 1)) * index;
        const y = paddingY + chartHeight - (value / max) * chartHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  private getSeriesMax(): number {
    const max = Math.max(...this.currentPeriodSeries, ...this.previousPeriodSeries, 1);
    const rounded = Math.ceil(max / 10000000) * 10000000;
    return rounded;
  }

  private formatCompactNumber(value: number): string {
    if (value >= 1000000) {
      return `${Math.round(value / 1000000)}M`;
    }
    if (value >= 1000) {
      return `${Math.round(value / 1000)}K`;
    }
    return `${value}`;
  }

  private getMaxOrderDate(orders: iOrder[]): Date {
    if (!orders.length) {
      return new Date();
    }

    return orders.reduce((latest, order) => {
      const date = new Date(order.Ngay_dat);
      return date > latest ? date : latest;
    }, new Date(orders[0].Ngay_dat));
  }

  private startOfWeek(date: Date): Date {
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private getDayIndex(date: Date, periodStart: Date): number {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor((this.startOfDay(date).getTime() - periodStart.getTime()) / dayMs);
  }

}
