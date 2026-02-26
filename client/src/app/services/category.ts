import { iCategory } from './../interfaces/category';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Category {
  // url = '/assets/data/category.json';
  constructor(private http: HttpClient) { }
  getCategoryData(): Observable<iCategory[]> {
    return this.http
      .get<iCategory[]>(`${baseUrl}/categories`)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
