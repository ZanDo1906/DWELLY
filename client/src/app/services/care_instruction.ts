import { iCareInstruction } from '../interfaces/care_instruction';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class CareInstruction {
  constructor(private http: HttpClient) { }
  getCareInstructionData(): Observable<iCareInstruction[]> {
    return this.http
      .get<iCareInstruction[]>(`${baseUrl}/care_instructions`)
      .pipe(retry(2), catchError(this.handleError));
  }
  getCareByCategory(categoryId: string): Observable<iCareInstruction> {
  return this.http
    .get<iCareInstruction>(`${baseUrl}/care_instructions/category/${categoryId}`)
    .pipe(retry(2), catchError(this.handleError));
}
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
