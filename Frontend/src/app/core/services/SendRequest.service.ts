import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class SendrequestService {
  private baseUrl = environment.apiUrl
  public user: any; // ตัวแปรสำหรับเก็บข้อมูลผู้ใช้

  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  // Add method for post to stored procedure
  SendRequest(data: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}/Send_Request`, data)
  }
  GenerateNewDocNo(case_: string, process: string, factory: string): Observable<any> {
  return this.httpClient.post(`${this.baseUrl}/GenerateNewDocNo`, { case_, process, factory  });
}

}
