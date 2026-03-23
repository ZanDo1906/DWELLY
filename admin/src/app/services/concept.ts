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

  getNextConceptCode(): Observable<{ nextCode: string }> {
    return this.http
      .get<{ nextCode: string }>(`${baseUrl}/concepts/next-code`)
      .pipe(retry(2), catchError(this.handleError));
  }

  getConceptData(): Observable<iConcept[]> {
    return this.http
      .get<iConcept[]>(`${baseUrl}/concepts`)
      .pipe(retry(2), catchError(this.handleError));
  }

  getConceptByCode(code: string): Observable<iConcept> {
    return this.http
      .get<iConcept>(`${baseUrl}/concepts/${code}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  addConcept(payload: iConcept): Observable<iConcept> {
    return this.http
      .post<iConcept>(`${baseUrl}/concepts`, payload)
      .pipe(catchError(this.handleError));
  }

  updateConcept(code: string, payload: Partial<iConcept>): Observable<iConcept> {
    return this.http
      .patch<iConcept>(`${baseUrl}/concepts/${code}`, payload)
      .pipe(catchError(this.handleError));
  }

  uploadConceptImage(formData: FormData): Observable<{ message: string; filePath: string; relativePath?: string }> {
    return this.http
      .post<{ message: string; filePath: string; relativePath?: string }>(`${baseUrl}/upload/concept`, formData)
      .pipe(catchError(this.handleError));
  }

  deleteConceptImage(filename: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${baseUrl}/upload/concept/${encodeURIComponent(filename)}`)
      .pipe(catchError(this.handleError));
  }

  deleteConcept(code: string): Observable<{ message: string; concept?: iConcept }> {
    return this.http
      .delete<{ message: string; concept?: iConcept }>(`${baseUrl}/concepts/${code}`)
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
