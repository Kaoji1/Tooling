import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PCPlanService {
  
  // กำหนด Base URL ให้ชี้ไปที่ Route ของ PC Plan ใน Node.js
  // เช่น http://localhost:3000/api/pc-plan
  private baseUrl = `${environment.apiUrl}/pc-plan`;

  constructor(private http: HttpClient) { }

  // 1. ดึง Division List
  // URL: /api/pc-plan/divisions
  getDivisions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/divisions`);
  }

  // 2. ดึง Machine Type ตาม Division
  // URL: /api/pc-plan/machines?div=xxxx
  getMachines(div: string): Observable<any[]> {
    const params = new HttpParams().set('div', div);
    return this.http.get<any[]>(`${this.baseUrl}/machines`, { params });
  }

// 3. ดึง Facility ตาม Division (แก้กลับเป็นแบบเดิม)
  // URL: /api/pc-plan/facilities?div=xxxx
  getFacilities(div: string) {
    // ลบ machine ออกทั้งจากวงเล็บรับค่า และจาก URL ครับ
    return this.http.get<any[]>(`${this.baseUrl}/facilities?div=${div}`);
  }

  // 4. ดึง Process ตาม Division
  // URL: /api/pc-plan/processes?div=xxxx
  getProcesses(div: string): Observable<any[]> {
    const params = new HttpParams().set('div', div);
    return this.http.get<any[]>(`${this.baseUrl}/processes`, { params });
  }

  // 5. ดึง PartNo ตาม Division
  // URL: /api/pc-plan/part-nos?div=xxxx
  getPartNos(div: string): Observable<any[]> {
    const params = new HttpParams().set('div', div);
    return this.http.get<any[]>(`${this.baseUrl}/part-nos`, { params });
  }
}