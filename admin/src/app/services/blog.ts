import { iBlog } from './../interfaces/blog';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Blog {
  url = '/assets/data/blog.json';
  constructor(private http: HttpClient) { }
  getBlogData(): Observable<iBlog[]> {
    return this.http
      .get<iBlog[]>(this.url)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
