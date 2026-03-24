
import { iProduct } from './../interfaces/product';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, switchMap, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Product {
  constructor(private http: HttpClient) {}

  getNextProductCode(): Observable<{ nextCode: string }> {
    return this.http
      .get<{ nextCode: string }>(`${baseUrl}/products/next-code`)
      .pipe(catchError(this.handleError));
  }

  getProductData(): Observable<iProduct[]> {
    return this.http
      .get<iProduct[]>(`${baseUrl}/products`)
      .pipe(retry(2), catchError(this.handleError));
  }

  getProductByCode(code: string): Observable<iProduct> {
    return this.http
      .get<iProduct>(`${baseUrl}/products/${code}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  addProduct(productData: iProduct): Observable<any> {
    return this.http
      .post<any>(`${baseUrl}/products`, productData)
      .pipe(catchError(this.handleError));
  }

  updateProduct(code: string, productData: any): Observable<any> {
    return this.http
      .patch<any>(`${baseUrl}/products/${code}`, productData)
      .pipe(catchError(this.handleError));
  }

  deleteProduct(code: string): Observable<any> {
    return this.http
      .delete<any>(`${baseUrl}/products/${code}`)
      .pipe(catchError(this.handleError));
  }

  deleteImage(code: string, filename: string): Observable<any> {
    return this.http
      .delete<any>(`${baseUrl}/products/${code}/images/${filename}`)
      .pipe(catchError(this.handleError));
  }

  uploadImages(code: string, formData: FormData): Observable<any> {
  return this.http
    .post<any>(`${baseUrl}/products/${code}/images`, formData)
    .pipe(catchError(this.handleError));
}

  getImgUrl(url: string): string {
  if (!url) return 'assets/img/default-product.png';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http')) return url;

  if (url.startsWith('assets/images/product')) return `${baseUrl}/${url}`;
  if (url.startsWith('assets')) return url;

  if (url.startsWith('/uploads')) {
    return `${baseUrl}${url}`;
  }

  return `${baseUrl}/uploads/products/${url}`;
}

  private handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message || 'Lỗi kết nối Backend'));
  }
}

