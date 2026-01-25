import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-test',
  imports: [CommonModule],
  templateUrl: './test.html',
  styleUrl: './test.css',
})
export class Test implements OnInit {
  activeTab: string = 'admin';
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
    this.http.get<any[]>('assets/data/admin.json').subscribe(data => {
      this.adminList = data;
      console.log('Admin loaded:', this.adminList.length);
    });
    this.http.get<any[]>('assets/data/blog.json').subscribe(data => {
      this.blogList = data;
      console.log('Blog loaded:', this.blogList.length);
    });
    this.http.get<any[]>('assets/data/care_instruction.json').subscribe(data => this.careInstructionList = data);
    this.http.get<any[]>('assets/data/category.json').subscribe(data => this.categoryList = data);
    this.http.get<any[]>('assets/data/client.json').subscribe(data => this.clientList = data);
    this.http.get<any[]>('assets/data/concept.json').subscribe(data => {
      this.conceptList = data;
      console.log('Concept loaded:', this.conceptList.length);
      if (this.conceptList.length > 0) {
        console.log('First concept image:', this.conceptList[0].Hinh_anh);
        console.log('Fixed path:', this.fixImagePath(this.conceptList[0].Hinh_anh));
      }
    });
    this.http.get<any[]>('assets/data/contact.json').subscribe(data => this.contactList = data);
    this.http.get<any[]>('assets/data/order.json').subscribe(data => this.orderList = data);
    this.http.get<any[]>('assets/data/order_details.json').subscribe(data => this.orderDetailsList = data);
    this.http.get<any[]>('assets/data/product.json').subscribe(data => {
      this.productList = data;
      console.log('Product loaded:', this.productList.length);
      if (this.productList.length > 0) {
        console.log('First product image:', this.productList[0].Hinh_anh[0]);
        console.log('Fixed path:', this.fixImagePath(this.productList[0].Hinh_anh[0]));
      }
    });
    this.http.get<any[]>('assets/data/ranking.json').subscribe(data => this.rankingList = data);
    this.http.get<any[]>('assets/data/review.json').subscribe(data => this.reviewList = data);
    this.http.get<any[]>('assets/data/room.json').subscribe(data => this.roomList = data);
    this.http.get<any[]>('assets/data/style.json').subscribe(data => this.styleList = data);
    this.http.get<any[]>('assets/data/voucher.json').subscribe(data => this.voucherList = data);
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
    // Replace ../assets/ with assets/assets/
    // Because the file structure has assets/assets/ instead of just assets/
    return path.replace(/^\.\.\/assets\//, 'assets/assets/');
  }
}
