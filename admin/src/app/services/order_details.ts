import { iOrderDetail } from '../interfaces/order_details';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

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
  createOrderDetail(
    detail: Pick<iOrderDetail, 'Ma_don_mua' | 'Ma_san_pham' | 'Don_gia' | 'So_luong'>,
  ): Observable<{ message: string; order_detail: iOrderDetail }> {
    return this.http
      .post<{ message: string; order_detail: iOrderDetail }>(`${baseUrl}/order_details`, detail)
      .pipe(retry(2), catchError(this.handleError));
  }

  createOrderDetailsBulk(
    Ma_don_mua: string,
    details: Array<Pick<iOrderDetail, 'Ma_san_pham' | 'Don_gia' | 'So_luong'>>,
  ): Observable<{ message: string; order_details: iOrderDetail[] }> {
    return this.http
      .post<{ message: string; order_details: iOrderDetail[] }>(`${baseUrl}/order_details/bulk`, {
        Ma_don_mua,
        details,
      })
      .pipe(retry(2), catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
