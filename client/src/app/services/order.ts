import { iOrder } from './../interfaces/order';
import { iOrderDetail } from './../interfaces/order_details';
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

  getOrderById(id: string): Observable<iOrder> {
      return this.http
        .get<iOrder>(`${baseUrl}/orders/${id}`)
        .pipe(retry(2), catchError(this.handleError));
    }

  updateOrderStatus(id: string, status: string): Observable<any> {
    return this.http
      .patch(`${baseUrl}/orders/${id}`, { Trang_thai: status })
      .pipe(retry(2), catchError(this.handleError));
  }

  getOrderDetailsByOrderId(orderId: string): Observable<iOrderDetail[]> {
    return this.http
      .get<iOrderDetail[]>(`${baseUrl}/order_details/order/${orderId}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
