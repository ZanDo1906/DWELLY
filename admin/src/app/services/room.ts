import { iRoom } from './../interfaces/room';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Room {

  url = '/assets/data/room.json';
  constructor(private http: HttpClient) { }
  getRoomData(): Observable<iRoom[]> {
    return this.http
      .get<iRoom[]>(this.url)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
