import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://PBGM06:3000/api';

@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class HistoryPrint {
  public user: any;
  snapshot: any;
  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

SaveHistoryPrint(data: any): Observable<any> {
    return this.httpClient.post(`${baseUrl}/SaveHistoryPrint`, data)
  }

get_Total(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
      return this.httpClient.get(`${baseUrl}/get_Total`); // ส่ง HTTP GET Division
    }

 // ดึงรายชื่อ Employee ที่มีสิทธิ์ print
  EmpPrint(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${baseUrl}/emp-print`);
  }

  // ตรวจสอบสิทธิ์ Employee ก่อน print
  checkPrintPermission(Employee_ID: string): Observable<{ allowed: boolean }> {
    return this.httpClient.get<{ allowed: boolean }>(
      `${baseUrl}/check-print-permission?Employee_ID=${Employee_ID}`
    );
  }

  HistoryPrint(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
      return this.httpClient.get(`${baseUrl}/HistoryPrint`); // ส่ง HTTP GET Division
    }
}
