import { iStyle } from './../interfaces/style';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Style {

  // url = '/assets/data/style.json';
  constructor(private http: HttpClient) { }

  getStyleData(): Observable<iStyle[]> {
    return this.http
      .get<iStyle[]>(`${baseUrl}/styles`)
      .pipe(retry(2), catchError(this.handleError));
  }

  getStyleByCode(code: string): Observable<iStyle> {
    return this.http
      .get<iStyle>(`${baseUrl}/styles/${code}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  addStyle(payload: iStyle): Observable<iStyle> {
    return this.http
      .post<iStyle>(`${baseUrl}/styles`, payload)
      .pipe(catchError(this.handleError));
  }

  updateStyle(code: string, payload: Partial<iStyle>): Observable<iStyle> {
    return this.http
      .patch<iStyle>(`${baseUrl}/styles/${code}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteStyle(code: string): Observable<{ message: string; style?: iStyle }> {
    return this.http
      .delete<{ message: string; style?: iStyle }>(`${baseUrl}/styles/${code}`)
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
