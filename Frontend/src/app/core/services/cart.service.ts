import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private baseUrl = 'http://PBGM06:3000/api';

  constructor(private http: HttpClient) {}

  // เพิ่มรายการทั้งหมดลงฐานข้อมูล MSSQL
  addCartToDB(data: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/AddCartItems`, data);
  }

  // ดึงรายการทั้งหมดจาก MSSQL (รวมทุก case_)
  getCartFromDB(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get_cart`);
  }

  // ลบรายการจากฐานข้อมูล โดยใช้ itemId หรือรหัสเฉพาะ
  removeItemFromDB(itemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete_cart_item/${itemId}`);
  }

  // ลบทั้งหมดในฐานข้อมูล (เช่น Clear ทั้ง Cart)
  clearAllFromDB(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clear_cart`);
  }

  // อัปเดตรายการในฐานข้อมูล

  updateMultipleItemsInDB(items: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/update_cart_items`, items);
  }
  // ลบเฉพาะกลุ่มตาม Case_
  deleteItemsByCaseProcessFac(case_: string, process: string, factory: string): Observable<any> {
  const encodedCase = encodeURIComponent(case_);
  const encodedProcess = encodeURIComponent(process);
  const encodedFac = encodeURIComponent(factory);
  return this.http.delete(`${this.baseUrl}/delete_cart_items/${encodedCase}/${encodedProcess}/${encodedFac}`);
}
}
