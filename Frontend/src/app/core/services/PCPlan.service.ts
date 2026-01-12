import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PCPlanService {
  
  private baseUrl = `${environment.apiUrl}/pc-plan`;

  constructor(private http: HttpClient) { }

  // 1. ดึง Division List (ยังใช้เหมือนเดิม)
  getDivisions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/divisions`);
  }

  // 2. *** ฟังก์ชันใหม่: ดึง Master Data ทั้งหมดในครั้งเดียว ***
  // URL: /api/pc-plan/master-data/71DZ
  getMasterData(divCode: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/master-data/${divCode}`);
  }

}