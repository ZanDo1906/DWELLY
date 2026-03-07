import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Admin as AdminService } from '../../services/admin';
import { iAdmin } from '../../interfaces/admin';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  adminInfo: iAdmin | null = null;
  password = '************';
  showPassword = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAdminInfo();
  }

  loadAdminInfo(): void {
    // Get admin info from localStorage (set during login)
    const adminData = localStorage.getItem('adminInfo');
    
    if (adminData) {
      const adminId = JSON.parse(adminData).id || JSON.parse(adminData).maAdmin;
      
      this.adminService.getAdminById(adminId).subscribe({
        next: (data) => {
          this.adminInfo = data;
        },
        error: (err) => {
          console.error('Error loading admin info:', err);
        }
      });
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
