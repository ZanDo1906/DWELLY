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
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
