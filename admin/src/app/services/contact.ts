import { iContact } from './../interfaces/contact';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

const baseUrl = "http://localhost:3000";

@Injectable({
  providedIn: 'root',
})
export class Contact {
  // url = '/assets/data/contact.json';
  constructor(private http: HttpClient) { }

  getContactData(): Observable<iContact[]> {
    return this.http
      .get<iContact[]>(`${baseUrl}/contacts`)
      .pipe(retry(2), catchError(this.handleError));
  }

  deleteContact(contactId: string): Observable<{ status: string }> {
    return this.http
      .delete<{ status: string }>(`${baseUrl}/contacts/${encodeURIComponent(contactId)}`)
      .pipe(retry(2), catchError(this.handleError));
  }

  saveContactDraft(contactId: string, replyContent: string): Observable<iContact> {
    return this.http
      .patch<iContact>(`${baseUrl}/contacts/${encodeURIComponent(contactId)}/draft`, {
        replyContent,
      })
      .pipe(retry(2), catchError(this.handleError));
  }

  sendContactReply(contactId: string, replyContent: string): Observable<iContact> {
    return this.http
      .patch<iContact>(`${baseUrl}/contacts/${encodeURIComponent(contactId)}/reply`, {
        replyContent,
      })
      .pipe(retry(2), catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message));
  }
}
