import { iVoucher } from './../interfaces/voucher';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Voucher {
  url = '/assets/data/voucher.json';
  constructor(private http: HttpClient) { }
  getVoucherData(): Observable<iVoucher[]> {
    return this.http
      .get<iVoucher[]>(this.url)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
