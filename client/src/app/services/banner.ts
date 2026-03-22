import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, retry, throwError } from 'rxjs';
import { iBanner } from '../interfaces/banner';

const baseUrl = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class Banner {
  constructor(private http: HttpClient) {}

  getBannerData(): Observable<iBanner[]> {
    return this.http
      .get<iBanner[]>(`${baseUrl}/api/banners`)
      .pipe(retry(2), catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
