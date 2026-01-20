import { iOrder } from './../interfaces/order';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Order {
  url = '/assets/data/order.json';
  constructor(private http: HttpClient) { }
  getOrderData(): Observable<iOrder[]> {
    return this.http
      .get<iOrder[]>(this.url)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
