import { iConcept } from './../interfaces/concept';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Concept {
  // url = '/assets/data/concept.json';
  constructor(private http: HttpClient) { }
  getConceptData(): Observable<iConcept[]> {
    return this.http
      .get<iConcept[]>(`${baseUrl}/concepts`)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
