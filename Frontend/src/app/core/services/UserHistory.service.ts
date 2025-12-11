import { Injectable } from '@angular/core'; // นำเข้า Injectable จาก Angular core
import { HttpClient } from '@angular/common/http'; // นำเข้า HttpClient สำหรับทำ HTTP requests
import { Observable } from 'rxjs'; // นำเข้า Observable จาก RxJS

const baseUrl = 'http://PBGM06:3000/api';
@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})
export class UserHistoryService {
  public user: any; // ตัวแปรสำหรับเก็บข้อมูลผู้ใช้

  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  User_History(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.get(`${baseUrl}/User_History`) // ส่ง HTTP GET request เพื่อดึงหมายเลขชิ้นส่วน
  }

}
