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

  getCategoryByCode(code: string): Observable<iCategory> {
    return this.http
      .get<iCategory>(`${baseUrl}/categories/${code}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  addCategory(payload: iCategory): Observable<iCategory> {
    return this.http
      .post<iCategory>(`${baseUrl}/categories`, payload)
      .pipe(catchError(this.handleError));
  }

  updateCategory(code: string, payload: Partial<iCategory>): Observable<iCategory> {
    return this.http
      .patch<iCategory>(`${baseUrl}/categories/${code}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteCategory(code: string): Observable<{ message: string; category?: iCategory }> {
    return this.http
      .delete<{ message: string; category?: iCategory }>(`${baseUrl}/categories/${code}`)
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
