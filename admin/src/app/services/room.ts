import { iRoom } from './../interfaces/room';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Room {

  // url = '/assets/data/room.json';
  constructor(private http: HttpClient) { }

  getRoomData(): Observable<iRoom[]> {
    return this.http
      .get<iRoom[]>(`${baseUrl}/rooms`)
      .pipe(retry(2), catchError(this.handleError));
  }

  getRoomByCode(code: string): Observable<iRoom> {
    return this.http
      .get<iRoom>(`${baseUrl}/rooms/${code}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  addRoom(payload: iRoom): Observable<iRoom> {
    return this.http
      .post<iRoom>(`${baseUrl}/rooms`, payload)
      .pipe(catchError(this.handleError));
  }

  updateRoom(code: string, payload: Partial<iRoom>): Observable<iRoom> {
    return this.http
      .patch<iRoom>(`${baseUrl}/rooms/${code}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteRoom(code: string): Observable<{ message: string; room?: iRoom }> {
    return this.http
      .delete<{ message: string; room?: iRoom }>(`${baseUrl}/rooms/${code}`)
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
