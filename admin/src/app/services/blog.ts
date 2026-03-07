import { iBlog } from './../interfaces/blog';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Blog {
  // url = '/assets/data/blog.json';
  constructor(private http: HttpClient) { }
  getBlogData(): Observable<iBlog[]> {
    return this.http
      .get<iBlog[]>(`${baseUrl}/blogs`)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  getBlogById(id: string): Observable<iBlog> {
    return this.http
      .get<iBlog>(`${baseUrl}/blogs/${id}`)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  createBlog(blog: iBlog): Observable<iBlog> {
    return this.http
      .post<iBlog>(`${baseUrl}/blogs`, blog)
      .pipe(catchError(this.handleError));
  }
  
  updateBlog(id: string, blog: Partial<iBlog>): Observable<iBlog> {
    return this.http
      .patch<iBlog>(`${baseUrl}/blogs/${id}`, blog)
      .pipe(catchError(this.handleError));
  }
  
  deleteBlog(id: string): Observable<any> {
    return this.http
      .delete(`${baseUrl}/blogs/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
