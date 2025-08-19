import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class DetailPurchaseRequestlistService {
  public user: any;
  snapshot: any;
  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  Detail_Request(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
      return this.httpClient.get(`${baseUrl}/Detail_Purchase`); // ส่ง HTTP GET Division 
    }
  
updateStatusToComplete(ID_Request: number, Status: string, QTY?: number, Remark?: string): Observable<any> {
  return this.httpClient.post(`${baseUrl}/Update_Status_Purchase`, {
    ID_Request,
    Status
     
  });
}

updateRequest(updatedItem: any): Observable<any> {
  return this.httpClient.put(`${baseUrl}/Update_Request`, updatedItem);
} 

insertRequest(data: any): Observable<any> {
  return this.httpClient.post(`${baseUrl}/Insert_Request`, data);
}

deleteRequest(id: number): Observable<any> {
  return this.httpClient.delete(`${baseUrl}/Delete_Request/${id}`);
}

get_ItemNo(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.get(`${baseUrl}/get_ItemNo`); // ส่ง HTTP GET Division
  }
}
