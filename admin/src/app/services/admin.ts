import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { iAdmin } from '../interfaces/admin';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Admin {
  constructor(private http: HttpClient) { }
  getAdminData(): Observable<iAdmin[]> {
    return this.http
      .get<iAdmin[]>(`${baseUrl}/admins`)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  getAdminById(id: string): Observable<iAdmin> {
    return this.http
      .get<iAdmin>(`${baseUrl}/admins/${id}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  changePassword(id: string, data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http
      .patch(`${baseUrl}/admins/${id}/change-password`, data)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  login(data: any) {
    console.log('Sending login request:', data);
    return this.http.post(`${baseUrl}/loginAdmin`, data)
      .pipe(
        catchError((error) => {
          console.error('Login API error:', error);
          console.error('Error status:', error.status);
          console.error('Error body:', error.error);
          return throwError(() => error);
        })
      );
  }

  saveLoginData(response: any) {
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('current_admin', JSON.stringify(response.admin));
    localStorage.setItem('adminId', response.admin?.maAdmin || response.admin?.id || '');
    localStorage.setItem('adminEmail', response.admin?.email || '');
    localStorage.setItem('adminName', response.admin?.fullName || 'Admin');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
