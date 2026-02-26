import { iReview } from './../interfaces/review';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";
@Injectable({
  providedIn: 'root',
})
export class Review {

  // url = '/assets/data/review.json';
  constructor(private http: HttpClient) { }
  getReviewData(): Observable<iReview[]> {
    return this.http
      .get<iReview[]>(`${baseUrl}/reviews`)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
