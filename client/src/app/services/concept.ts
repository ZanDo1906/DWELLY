import { iConcept } from './../interfaces/concept';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

export interface ConceptListState {
  selectedRoomTypes: string[];
  selectedStyles: string[];
  displayedCount: number;
  scrollPosition: number;
}

@Injectable({
  providedIn: 'root',
})
export class Concept {
  listState: ConceptListState | null = null;
  
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
