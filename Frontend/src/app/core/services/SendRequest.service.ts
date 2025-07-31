import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class SendrequestService {
  public user: any; // ตัวแปรสำหรับเก็บข้อมูลผู้ใช้

  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  // Add method for post to stored procedure
  SendRequest(data: any): Observable<any> {
    return this.httpClient.post(`${baseUrl}/Send_Request`, data)
  }
  GenerateNewDocNo(case_: string, process: string, factory: string): Observable<any> {
  return this.httpClient.post(`${baseUrl}/GenerateNewDocNo`, { case_, process, factory });
}

}
