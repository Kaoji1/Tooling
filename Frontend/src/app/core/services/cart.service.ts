import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  
  private baseUrl = 'http://localhost:3000/api';

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
  updateItemInDB(item: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update_cart_item`, item);
  }

  // ลบเฉพาะกลุ่มตาม Case_
  deleteItemsByCase(case_: string): Observable<any> {
    const encodedCase = encodeURIComponent(case_);
    return this.http.delete(`${this.baseUrl}/delete_cart_items_by_case/${encodedCase}`);
  }
}