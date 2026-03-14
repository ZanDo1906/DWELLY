import { iClient } from './../interfaces/client';
import { iProduct } from './../interfaces/product';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Client {
  // url = '/assets/data/client.json';
  constructor(private http: HttpClient) { }
  getClientData(): Observable<iClient[]> {
    return this.http
      .get<iClient[]>(`${baseUrl}/clients`)
      .pipe(retry(2), catchError(this.handleError));
  }
  getClientById(id: string): Observable<iClient> {
    return this.http
      .get<iClient>(`${baseUrl}/clients/${id}`)
      .pipe(retry(2), catchError(this.handleError));
  }
  getClientAddress(id: string): Observable<{ address: string[] }> {
    return this.http
      .get<{ address: string[] }>(`${baseUrl}/clients/${id}/address`)
      .pipe(retry(2), catchError(this.handleError));
  }
  addClientAddress(id: string, data: {
    FullName: string;
    Phone: string;
    Province: string;
    District: string;
    Ward: string;
    DetailAddress: string;
    IsDefault: boolean;
  }): Observable<any> {
    return this.http
      .post(`${baseUrl}/clients/${id}/address`, data)
      .pipe(retry(2), catchError(this.handleError));
  }
  updateClientAddress(id: string, index: number, data: {
    FullName: string;
    Phone: string;
    Province: string;
    District: string;
    Ward: string;
    DetailAddress: string;
    IsDefault: boolean;
  }): Observable<any> {
    return this.http
      .patch(`${baseUrl}/clients/${id}/address/${index}`, data)
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteClientAddress(id: string, index: number): Observable<any> {
    return this.http
      .delete(`${baseUrl}/clients/${id}/address/${index}`)
      .pipe(retry(2), catchError(this.handleError));
  }
  updateClient(id: string, data: Partial<iClient>): Observable<any> {
    return this.http
      .patch(`${baseUrl}/clients/${id}`, data)
      .pipe(retry(2), catchError(this.handleError));
  }
  changePassword(id: string, data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http
      .patch(`${baseUrl}/clients/${id}/change-password`, data)
      .pipe(retry(2), catchError(this.handleError));
  }
  uploadAvatar(formData: FormData): Observable<any> {
    return this.http
      .post(`${baseUrl}/upload/avatar`, formData)
      .pipe(catchError(this.handleError));
  }
  login(data: any) {
  return this.http.post(`${baseUrl}/login`, data);
  }
  register(data: any) {
  return this.http.post(`${baseUrl}/register`, data);
  }

  getCurrentUser() {
  const user = localStorage.getItem('current_user');
  return user ? JSON.parse(user) : null;
}

  getWishlist(customerCode: string) {
    return this.http
      .get<iProduct[]>(`${baseUrl}/clients/${customerCode}/wishlist`)
      .pipe(retry(2), catchError(this.handleError));
  }

  saveLoginData(response: any) {
  localStorage.setItem('auth_token', response.token);
  localStorage.setItem('current_user', JSON.stringify(response.user));
}
  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }
    getFavoriteCount(productId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${baseUrl}/clients/favorite-count/${productId}`)
      .pipe(retry(2), catchError(this.handleError));
  }
      
  toggleFavorite(customerCode: string, productId: string): Observable<any> {
  return this.http.post(`${baseUrl}/clients/toggle-favorite`, {
    customerCode,
    productId
  }).pipe(
    retry(2),
    catchError(this.handleError)
  );
}
  handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
