import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class RequestService {
  private baseUrl = environment.apiUrl
  public user: any; // ตัวแปรสำหรับเก็บข้อมูลผู้ใช้

  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  get_Division(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.get(`${this.baseUrl}/get_Division`); // ส่ง HTTP GET Division
  }

  get_PartNo(data: any): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.post(`${this.baseUrl}/get_PartNo`, data); // ส่ง HTTP Post partno  เพื่อส่งข้อมูล
  }

  get_Process(data: any): Observable<any> { // ฟังก์ชันสำหรับส่งข้อมูล process
    return this.httpClient.post(`${this.baseUrl}/get_Process`, data) ;// ส่ง HTTP POST Process เพื่อส่งข้อมูล process
  }

  get_MC(data: any): Observable<any> { // ฟังก์ชันสำหรับส่งข้อมูล process
    return this.httpClient.post(`${this.baseUrl}/get_MC`, data) ;// ส่ง HTTP POST request เพื่อส่งข้อมูล process
  }

  get_Facility(data: any): Observable<any> { // ฟังก์ชันสำหรับส่งข้อมูล process
    return this.httpClient.post(`${this.baseUrl}/get_Facility`, data) ;// ส่ง HTTP POST request เพื่อส่งข้อมูล process
  }

  post_ItemNo(data: any): Observable<any> { // ฟังก์ชันสำหรับส่งข้อมูล process
    return this.httpClient.post(`${this.baseUrl}/post_ItemNo`, data); // ส่ง HTTP POST request เพื่อส่งข้อมูล process
  }

  // ของใหม่ (Setup - Table ใหม่)
get_SetupItems(data: any) {
  // เปลี่ยน /GetSetupItems เป็นชื่อ Path ของ Backend จริงๆ ที่คุณจะทำ
  return this.httpClient.post<any>(`${this.baseUrl}/GetSetupItems`, data); 
}

  get_SPEC(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/get_SPEC`, data);
  }

  // get_Fac(data: any): Observable<any> {
  //   return this.httpClient.post(`${this.baseUrl}/get_Fac`, data);
  // }
}
