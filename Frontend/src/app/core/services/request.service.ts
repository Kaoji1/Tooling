import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:3000/api';




@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class RequestService {
  public user: any; // ตัวแปรสำหรับเก็บข้อมูลผู้ใช้

  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }
  get_Division(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.get(`${baseUrl}/get_Division`) // ส่ง HTTP GET request เพื่อดึงหมายเลขชิ้นส่วน
  }

  post_PARTNO(data: any): Observable<any> {
  return this.httpClient.get(`${baseUrl}/get_PartNo/${data}`);
  }

 get_SPEC(value: any): Observable<any> {
  return this.httpClient.get(`${baseUrl}/get_SPEC/${value}`);
  }

  get_Process(data: any): Observable<any> { // ฟังก์ชันสำหรับส่งข้อมูล process
    return this.httpClient.post(`${baseUrl}/get_Process`,data) ;// ส่ง HTTP POST request เพื่อส่งข้อมูล process
  }

  get_MC(data: any): Observable<any> { // ฟังก์ชันสำหรับส่งข้อมูล process
    return this.httpClient.post(`${baseUrl}/get_MC`, data) // ส่ง HTTP POST request เพื่อส่งข้อมูล process
  }

  post_ITEMNO(data: any): Observable<any> { // ฟังก์ชันสำหรับส่งข้อมูล process
    return this.httpClient.post(`${baseUrl}/post_ITEMNO`, data) // ส่ง HTTP POST request เพื่อส่งข้อมูล process
  }


}
