import { iOrder } from './../interfaces/order';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Order {
  // url = '/assets/data/order.json';
  constructor(private http: HttpClient) { }
  getOrderData(): Observable<iOrder[]> {
    return this.http
      .get<iOrder[]>(`${baseUrl}/orders`)
      .pipe(retry(2), catchError(this.handleError));
  }

  getOrderDataByUserId(userId: string): Observable<iOrder[]> {
    return this.http
      .get<iOrder[]>(`${baseUrl}/orders/user/${userId}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  createOrder(order: Partial<iOrder>): Observable<{ message: string; order: iOrder }> {
    return this.http
      .post<{ message: string; order: iOrder }>(`${baseUrl}/orders`, order)
      .pipe(retry(2), catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
