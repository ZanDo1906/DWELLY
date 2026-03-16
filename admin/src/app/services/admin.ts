import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { iAdmin } from '../interfaces/admin';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Admin {
  constructor(private http: HttpClient) { }
  getAdminData(): Observable<iAdmin[]> {
    return this.http
      .get<iAdmin[]>(`${baseUrl}/admins`)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  getAdminById(id: string): Observable<iAdmin> {
    return this.http
      .get<iAdmin>(`${baseUrl}/admins/${id}`)
      .pipe(retry(2), catchError(this.handleError));
  }
  
  login(data: any) {
  return this.http.post(`${baseUrl}/loginAdmin`, data);
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
