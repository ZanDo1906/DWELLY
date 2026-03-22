import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomVisualizerService {

  private apiUrl = 'http://localhost:3000/room-visualizer';

  constructor(private http: HttpClient) {} // 👈 THÊM DÒNG NÀY

  generateRoom(image: File, furniture: string[]): Observable<any> {
    const formData = new FormData();

    formData.append('image', image);
    formData.append('furniture', JSON.stringify(furniture));

    console.log(image);
    console.log(furniture);

    return this.http.post(this.apiUrl, formData);
  }
}