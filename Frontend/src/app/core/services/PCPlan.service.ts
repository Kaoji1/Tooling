import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PCPlanService {

  private baseUrl = `${environment.apiUrl}/pc-plan`;

  private divisionsCache$: Observable<any[]> | null = null;
  private masterDataCache = new Map<string, any>();

  constructor(private http: HttpClient) { }

  // 1. ดึง Division List (Cached)
  getDivisions(): Observable<any[]> {
    if (!this.divisionsCache$) {
      this.divisionsCache$ = this.http.get<any[]>(`${this.baseUrl}/divisions`).pipe(
        shareReplay(1)
      );
    }
    return this.divisionsCache$;
  }

  // 2. *** ฟังก์ชันใหม่: ดึง Master Data ทั้งหมดในครั้งเดียว (Cached) ***
  // URL: /api/pc-plan/master-data/71DZ
  getMasterData(divCode: string): Observable<any> {
    if (this.masterDataCache.has(divCode)) {
      return of(this.masterDataCache.get(divCode));
    }

    return this.http.get<any>(`${this.baseUrl}/master-data/${divCode}`).pipe(
      tap(data => this.masterDataCache.set(divCode, data))
    );
  }

  // 3. ฟังก์ชันสำหรับล้าง Cache (เผื่ออยากให้โหลดใหม่โดยไม่ต้องรีเฟรชหน้าจอ)
  clearCache() {
    this.divisionsCache$ = null;
    this.masterDataCache.clear();
  }

}