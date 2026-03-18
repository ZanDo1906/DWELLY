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
  
  login(data: any) {
  return this.http.post(`${baseUrl}/loginAdmin`, data);
  }
  
  forgotPassword(emailOrPhone: string): Observable<any> {
    return this.http.post(`${baseUrl}/forgot-password`, { emailOrPhone });
  }

  verifyOTP(adminId: string, otp: string): Observable<any> {
    return this.http.post(`${baseUrl}/verify-otp`, { adminId, otp });
  }

  resetPassword(adminId: string, newPassword: string): Observable<any> {
    return this.http.patch(`${baseUrl}/admins/${adminId}/reset-password`, { newPassword });
  }
  
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
