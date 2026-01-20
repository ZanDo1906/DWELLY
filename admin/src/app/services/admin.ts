import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { iAdmin } from '../interfaces/admin';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Admin {
  url = '/assets/data/admin.json';
  constructor(private http: HttpClient) { }
  getAdminData(): Observable<iAdmin[]> {
    return this.http
      .get<iAdmin[]>(this.url)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
