import { iOrderDetail } from '../interfaces/order_details';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { iOrder } from '../interfaces/order';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Order_Details {
  // url = '/assets/data/order_details.json';
  constructor(private http: HttpClient) { }
  getOrderDetailsData(): Observable<iOrderDetail[]> {
    return this.http
      .get<iOrderDetail[]>(`${baseUrl}/order_details`)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
  
  getOrderData(): Observable<iOrder[]> {
    return this.http
      .get<iOrder[]>(`${baseUrl}/orders`)
      .pipe(retry(2), catchError(this.handleError));
    }
  
   getOrderDetailsByOrderId(orderId: string): Observable<iOrderDetail[]> {
    return this.http
      .get<iOrderDetail[]>(`${baseUrl}/order_details/order/${orderId}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  createOrderDetailsBulk(payload: {
    Ma_don_mua: string;
    details: Array<{ Ma_san_pham: string; Don_gia: number; So_luong: number }>;
  }): Observable<any> {
    return this.http
      .post(`${baseUrl}/order_details/bulk`, payload)
      .pipe(retry(2), catchError(this.handleError));
  }
}
