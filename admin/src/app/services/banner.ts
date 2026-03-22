import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { iBanner } from '../interfaces/banner';

@Injectable({
  providedIn: 'root',
})
export class Banner {
  private apiUrl = 'http://localhost:3000/api/banners';

  constructor(private httpClient: HttpClient) {}

  getBannerData(): Observable<iBanner[]> {
    return this.httpClient.get<iBanner[]>(this.apiUrl);
  }

  getBannerById(id: string): Observable<iBanner> {
    return this.httpClient.get<iBanner>(`${this.apiUrl}/${id}`);
  }

  createBanner(payload: iBanner): Observable<iBanner> {
    return this.httpClient.post<iBanner>(this.apiUrl, payload);
  }

  updateBannerById(id: string, payload: Partial<iBanner>): Observable<iBanner> {
    return this.httpClient.patch<iBanner>(`${this.apiUrl}/${id}`, payload);
  }

  deleteBannersByIds(ids: string[]): Observable<{ deletedCount: number }> {
    return this.httpClient.post<{ deletedCount: number }>(`${this.apiUrl}/delete-multiple`, { ids });
  }

  toggleBannerStatus(id: string, status: boolean): Observable<iBanner> {
    return this.httpClient.patch<iBanner>(`${this.apiUrl}/${id}`, { Trang_thai: status });
  }

  uploadBannerImage(file: File): Observable<{ filePath: string; relativePath: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.httpClient.post<{ filePath: string; relativePath: string }>('http://localhost:3000/upload/banner', formData);
  }
}
