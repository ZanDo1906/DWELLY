import { iVoucher } from './../interfaces/voucher';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Voucher {
  // url = '/assets/data/voucher.json';
  constructor(private http: HttpClient) { }

  getVoucherData(): Observable<iVoucher[]> {
    return this.http
      .get<iVoucher[]>(`${baseUrl}/vouchers`)
      .pipe(retry(2), catchError(this.handleError));
  }

  getNextPromotionCode(): Observable<{ nextCode: string }> {
    return this.http
      .get<{ nextCode: string }>(`${baseUrl}/vouchers/next-code`)
      .pipe(retry(2), catchError(this.handleError));
  }

  deleteVoucherById(voucherId: string): Observable<{ status: string }> {
    return this.http
      .delete<{ status: string }>(`${baseUrl}/vouchers/${voucherId}`)
      .pipe(catchError(this.handleError));
  }

  deleteVouchersByIds(voucherIds: string[]): Observable<{ status: string }[]> {
    return forkJoin(voucherIds.map((voucherId) => this.deleteVoucherById(voucherId)));
  }

  createVoucher(payload: iVoucher): Observable<iVoucher> {
    return this.http
      .post<iVoucher>(`${baseUrl}/vouchers`, payload)
      .pipe(catchError(this.handleError));
  }

  updateVoucherById(voucherId: string, payload: Partial<iVoucher>): Observable<iVoucher> {
    return this.http
      .patch<iVoucher>(`${baseUrl}/vouchers/${voucherId}`, payload)
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
