import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-test',
  imports: [CommonModule],
  templateUrl: './test.html',
  styleUrl: './test.css',
})
export class Test implements OnInit {
  activeTab: string = 'product';
  console = console; // Make console available in template

  adminList: any[] = [];
  blogList: any[] = [];
  careInstructionList: any[] = [];
  categoryList: any[] = [];
  clientList: any[] = [];
  conceptList: any[] = [];
  contactList: any[] = [];
  orderList: any[] = [];
  orderDetailsList: any[] = [];
  productList: any[] = [];
  rankingList: any[] = [];
  reviewList: any[] = [];
  roomList: any[] = [];
  styleList: any[] = [];
  voucherList: any[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadData('assets/data/admin.json', (data) => {
      this.adminList = data;
      console.log('✓ Admin loaded:', this.adminList.length);
    });
    this.loadData('assets/data/blog.json', (data) => {
      this.blogList = data;
      console.log('✓ Blog loaded:', this.blogList.length);
    });
    this.loadData('assets/data/care_instruction.json', (data) => {
      this.careInstructionList = data;
      console.log('✓ Care instruction loaded:', this.careInstructionList.length);
    });
    this.loadData('assets/data/category.json', (data) => {
      this.categoryList = data;
      console.log('✓ Category loaded:', this.categoryList.length);
    });
    this.loadData('assets/data/client.json', (data) => {
      this.clientList = data;
      console.log('✓ Client loaded:', this.clientList.length);
    });
    this.loadData('assets/data/concept.json', (data) => {
      this.conceptList = data;
      console.log('✓ Concept loaded:', this.conceptList.length);
    });
    this.loadData('assets/data/contact.json', (data) => {
      this.contactList = data;
      console.log('✓ Contact loaded:', this.contactList.length);
    });
    this.loadData('assets/data/order.json', (data) => {
      this.orderList = data;
      console.log('✓ Order loaded:', this.orderList.length);
    });
    this.loadData('assets/data/order_details.json', (data) => {
      this.orderDetailsList = data;
      console.log('✓ Order details loaded:', this.orderDetailsList.length);
    });
    this.loadData('assets/data/product.json', (data) => {
      this.productList = data;
      console.log('✓ Product loaded:', this.productList.length);
      if (this.productList.length > 0) {
        console.log('First product image:', this.productList[0].Hinh_anh[0]);
        console.log('Fixed path:', this.fixImagePath(this.productList[0].Hinh_anh[0]));
      }
    });
    this.loadData('assets/data/ranking.json', (data) => {
      this.rankingList = data;
      console.log('✓ Ranking loaded:', this.rankingList.length);
    });
    this.loadData('assets/data/review.json', (data) => {
      this.reviewList = data;
      console.log('✓ Review loaded:', this.reviewList.length);
    });
    this.loadData('assets/data/room.json', (data) => {
      this.roomList = data;
      console.log('✓ Room loaded:', this.roomList.length);
    });
    this.loadData('assets/data/style.json', (data) => {
      this.styleList = data;
      console.log('✓ Style loaded:', this.styleList.length);
    });
    this.loadData('assets/data/voucher.json', (data) => {
      this.voucherList = data;
      console.log('✓ Voucher loaded:', this.voucherList.length);
    });
  }

  loadData(path: string, callback: (data: any[]) => void): void {
    this.http.get<any[]>(path).subscribe(
      (data) => {
        callback(data);
      },
      (error: HttpErrorResponse) => {
        console.error(`Error loading ${path}:`, error.message);
      }
    );
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  // Helper method to fix image paths
  fixImagePath(path: string): string {
    if (!path) return '';
    // If you update all JSON files to use "assets/assets/..." paths,
    // this function can simply return the path as-is
    return path;
  }
}
