import { iRanking } from './../interfaces/ranking';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Ranking {

  // url = '/assets/data/ranking.json';
  constructor(private http: HttpClient) { }
  getRankingData(): Observable<iRanking[]> {
    return this.http
      .get<iRanking[]>(`${baseUrl}/rankings`)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
