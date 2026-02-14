import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class RequestService {
  private baseUrl = environment.apiUrl
  public user: any;

  // Cache & State Storage
  private divisionCache$: Observable<any> | null = null;
  private cache = new Map<string, any>();
  private requestPageState: any = null; // Store Request Page state

  saveRequestState(state: any) {
    this.requestPageState = JSON.parse(JSON.stringify(state)); // Deep copy to avoid reference issues
  }

  getRequestState(): any {
    return this.requestPageState;
  }

  clearRequestState() {
    this.requestPageState = null;
  }

  constructor(
    private httpClient: HttpClient
  ) { }

  get_Division(): Observable<any> {
    if (!this.divisionCache$) {
      this.divisionCache$ = this.httpClient.get(`${this.baseUrl}/get_Division`).pipe(
        shareReplay(1)
      );
    }
    return this.divisionCache$;
  }

  // Generic Cache Helper
  private getCachedRequest(endpoint: string, data: any): Observable<any> {
    const key = `${endpoint}:${JSON.stringify(data)}`;
    if (this.cache.has(key)) {
      // Return cached observable (using 'of' for immediate value if stored as value, 
      // but simpler to store the observable or just value. Let's store value to avoid observable cold/hot issues or duplicate in-flight?)
      // Actually RxJS shareReplay is better for in-flight + cache.
      // But for parameterized, creating 1000s of observables is messy. 
      // Let's store the response data:
      return of(this.cache.get(key));
    }

    return this.httpClient.post(`${this.baseUrl}/${endpoint}`, data).pipe(
      tap(res => this.cache.set(key, res))
    );
  }

  get_PartNo(data: any): Observable<any> {
    return this.getCachedRequest('get_PartNo', data);
  }

  get_Process(data: any): Observable<any> {
    return this.getCachedRequest('get_Process', data);
  }

  get_MC(data: any): Observable<any> {
    return this.getCachedRequest('get_MC', data);
  }

  get_Facility(data: any): Observable<any> {
    return this.getCachedRequest('get_Facility', data);
  }

  post_ItemNo(data: any): Observable<any> {
    // Usually ItemNo specific queries shouldn't be cached aggressively if stock changes
    // But user asked for it. Let's assume Master Data logic.
    return this.httpClient.post(`${this.baseUrl}/post_ItemNo`, data);
  }

  // ของใหม่ (Setup - Table ใหม่)
  get_SetupItems(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_Setup_Items`, data);
  }

  // Setup Tool Dropdowns
  get_Setup_Division(): Observable<any> {
    return this.httpClient.get(`${this.baseUrl}/get_Setup_Division`);
  }

  get_Setup_Facility(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_Setup_Facility`, data);
  }

  get_Setup_PartNo(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_Setup_PartNo`, data);
  }

  get_Setup_Process(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_Setup_Process`, data);
  }

  get_Setup_MC(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_Setup_MC`, data);
  }

  get_SPEC(data: any): Observable<any> {
    return this.getCachedRequest('get_SPEC', data);
  }

  // Case SET APIs (CuttingTool + SetupTool)
  get_CaseSET_CuttingTool(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_CaseSET_CuttingTool`, data);
  }


  get_CaseSET_SetupTool(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_CaseSET_SetupTool`, data);
  }

  // New Combined API for Case SET (Cutting + Setup)
  get_CaseSET_All(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_CaseSET_All`, data);
  }

  // API สำหรับดึงรายละเอียด Box/Shelf/Rack
  get_CaseSET_CuttingTool_Detail(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_CaseSET_CuttingTool_Detail`, data);
  }

  // Case SET Dropdown APIs
  get_CaseSET_Dropdown_PartNo(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_CaseSET_Dropdown_PartNo`, data);
  }

  get_CaseSET_Dropdown_Process(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_CaseSET_Dropdown_Process`, data);
  }

  get_CaseSET_Dropdown_MC(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_CaseSET_Dropdown_MC`, data);
  }

  get_CaseSET_Dropdown_ItemNo(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_CaseSET_Dropdown_ItemNo`, data);
  }

  // โหลด Machine Type ตาม Division (แสดงเฉยๆ ไม่ใช้กรอง)
  get_MC_ByDivision(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_MC_ByDivision`, data);
  }

  // Add Request Tooling (Submit)
  add_Request_Tooling(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/add_Request_Tooling`, data);
  }

  clearCache() {
    this.divisionCache$ = null;
    this.cache.clear();
  }
}
