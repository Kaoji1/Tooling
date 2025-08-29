import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://PBGM7E:3000/api';
@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class PurchaseRequestService {
  public user: any;
  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  Purchase_Request(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
      return this.httpClient.get(`${baseUrl}/Purchase_Request`); // ส่ง HTTP GET Division 
    }
    
}