import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class DetailPurchaseRequestlistService {
  private baseUrl = environment.apiUrl;
  public user: any;
  snapshot: any;
  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  Detail_Request(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
      return this.httpClient.get(`${this.baseUrl}/Detail_Purchase`); // ส่ง HTTP GET Division
    }

updateStatusToComplete(idOrIds: number | number[], status: string) {
  return this.httpClient.post(`${this.baseUrl}/Update_Status_Purchase`, {
    ID_Request: idOrIds,  //  ส่งเป็น array ได้
    Status: status
  });
}

  updateQtyAndStatus(payload: { ID_Request: number; QTY: number; Status: string }[]): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}/updateQtyAndStatus`, payload);
  }

updateRequest(updatedItem: any): Observable<any> {
  return this.httpClient.put(`${this.baseUrl}/Update_Request`, updatedItem);
}

insertRequest(data: any): Observable<any> {
  return this.httpClient.post(`${this.baseUrl}/Insert_Request`, data);
}

deleteRequest(id: number): Observable<any> {
  return this.httpClient.delete(`${this.baseUrl}/Delete_Request/${id}`);
}

get_ItemNo(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.get(`${this.baseUrl}/get_ItemNo`); // ส่ง HTTP GET Division
  }
}
