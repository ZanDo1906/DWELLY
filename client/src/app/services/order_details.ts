import { iOrderDetail } from '../interfaces/order_details';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Order_Details {
  url = '/assets/data/order_details.json';
  constructor(private http: HttpClient) { }
  getOrderDetailsData(): Observable<iOrderDetail[]> {
    return this.http
      .get<iOrderDetail[]>(this.url)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
