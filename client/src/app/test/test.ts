import { iClient } from './../interfaces/client';
import { iAdmin } from './../interfaces/admin';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Client } from '../services/client';
import { Admin } from '../services/admin';

@Component({
  selector: 'app-test',
  imports: [CommonModule],
  templateUrl: './test.html',
  styleUrl: './test.css',
})
export class Test implements OnInit {
  clientList: iClient[] = [];
  adminList: iAdmin[] = [];
  message: string = 'loading...';
  selectedClientId: any;
  selectedAdminId: any;
  constructor(
    private router: Router,
    private clientService: Client,
    private adminService: Admin,
    private activatedRoute: ActivatedRoute

  ) { }

  ngOnInit(): void {
    this.clientService.getClientData().subscribe({
      next: (data) => {
        this.clientList = data;
      },
      error: (error) => {
        this.message = error.message;
      }
    });

    this.adminService.getAdminData().subscribe({
      next: (data) => {
        this.adminList = data;
      },
      error: (error) => {
        this.message = error.message;
      }
    });

    this.activatedRoute.paramMap.subscribe((param) => {
      let id = param.get('id');
      if (id != null) this.selectedClientId = id;
    });

  }
  onSelectClient(data: any): void {
    this.router.navigate(['/clients', data.Ma_khach_hang]);
  }
  onSelectAdmin(data: any): void {
    this.router.navigate(['/admins', data.Ma_quan_tri_vien]);
  }
  isSelectedClient(d: any): boolean {
    return d.Ma_khach_hang === this.selectedClientId;
  }
  isSelectedAdmin(d: any): boolean {
    return d.Ma_quan_tri_vien === this.selectedAdminId;
  }
}
