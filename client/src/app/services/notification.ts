import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface INotification {
  _id: string;
  Ma_khach_hang: string;
  Tieu_de: string;
  Noi_dung: string;
  Loai: 'orders' | 'promos' | 'system';
  Da_doc: boolean;
  Lien_ket?: string;
  Ngay_tao: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:3000/notifications';

  constructor(private http: HttpClient) { }

  getNotificationsByUser(userId: string): Observable<INotification[]> {
    return this.http.get<INotification[]>(`${this.apiUrl}/${userId}`);
  }

  markAsRead(notificationId: string): Observable<INotification> {
    return this.http.patch<INotification>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(userId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/user/${userId}/read-all`, {});
  }

  deleteAllUserNotifications(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/${userId}`);
  }
}
