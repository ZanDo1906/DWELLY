import { iCareInstruction } from '../interfaces/care_instruction';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CareInstruction {
  url = '/assets/data/care_instruction.json';
  constructor(private http: HttpClient) { }
  getCareInstructionData(): Observable<iCareInstruction[]> {
    return this.http
      .get<iCareInstruction[]>(this.url)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
