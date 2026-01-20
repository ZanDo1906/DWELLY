import { iStyle } from './../interfaces/style';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Style {

  url = '/assets/data/style.json';
  constructor(private http: HttpClient) { }
  getStyleData(): Observable<iStyle[]> {
    return this.http
      .get<iStyle[]>(this.url)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
