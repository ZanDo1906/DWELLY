import { iReview } from './../interfaces/review';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";
@Injectable({
  providedIn: 'root',
})
export class Review {

  constructor(private http: HttpClient) { }
  
  getReviewData(): Observable<iReview[]> {
    return this.http
      .get<iReview[]>(`${baseUrl}/reviews`)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  getReviewsByProduct(productId: string): Observable<iReview[]> {
    return this.http
      .get<iReview[]>(`${baseUrl}/reviews?productId=${productId}`)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  getReviewsByOrder(orderId: string): Observable<iReview[]> {
    return this.http
      .get<iReview[]>(`${baseUrl}/reviews?orderId=${orderId}`)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  createReview(review: iReview): Observable<iReview> {
    return this.http
      .post<iReview>(`${baseUrl}/reviews`, review)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
