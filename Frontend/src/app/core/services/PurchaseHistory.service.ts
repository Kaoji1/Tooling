import { Injectable } from '@angular/core'; // นำเข้า Injectable จาก Angular core
import { HttpClient } from '@angular/common/http'; // นำเข้า HttpClient สำหรับทำ HTTP requests
import { Observable } from 'rxjs'; // นำเข้า Observable จาก RxJS
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})
export class PurchaseHistoryservice {
  private baseUrl = environment.apiUrl
  public user: any; // ตัวแปรสำหรับเก็บข้อมูลผู้ใช้

  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  Purchase_History(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.get(`${this.baseUrl}/Purchase_History`) // ส่ง HTTP GET request เพื่อดึงหมายเลขชิ้นส่วน
  }
   // ฟังก์ชั่นอัปเดท Status หลายแถว
  updateStatus(ids: number[], status: string): Observable<any> {
    const body = { ids, status };
    return this.httpClient.post(`${this.baseUrl}/update-status`, body);
  }

}
