import { iProduct } from './../interfaces/product';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Product {
  url = '/assets/data/product.json';
  constructor(private http: HttpClient) { }
  getProductData(): Observable<iProduct[]> {
    return this.http
      .get<iProduct[]>(this.url)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
