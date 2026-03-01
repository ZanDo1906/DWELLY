import { iClient } from './../interfaces/client';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Client {
  // url = '/assets/data/client.json';
  constructor(private http: HttpClient) { }
  getClientData(): Observable<iClient[]> {
    return this.http
      .get<iClient[]>(`${baseUrl}/clients`)
      .pipe(retry(2), catchError(this.handleError));
  }
  getClientById(id: string): Observable<iClient> {
    return this.http
      .get<iClient>(`${baseUrl}/clients/${id}`)
      .pipe(retry(2), catchError(this.handleError));
  }
  updateClient(id: string, data: Partial<iClient>): Observable<any> {
    return this.http
      .patch(`${baseUrl}/clients/${id}`, data)
      .pipe(retry(2), catchError(this.handleError));
  }
  uploadAvatar(formData: FormData): Observable<any> {
    return this.http
      .post(`${baseUrl}/upload/avatar`, formData)
      .pipe(catchError(this.handleError));
  }
  login(data: any) {
  return this.http.post(`${baseUrl}/login`, data);
  }
  register(data: any) {
  return this.http.post(`${baseUrl}/register`, data);
  }
  
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
