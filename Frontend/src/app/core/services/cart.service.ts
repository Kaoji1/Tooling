import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private baseUrl = 'http://localhost:3000/api'; // URL ไปยัง backend Express

  //  เก็บรายการตะกร้าแบบ grouped (ตาม Case_) ใน memory (ใช้สำหรับ UI แสดงผลแบบ grouping)
  private groupedCart: { [case_: string]: any[] } = {};

  constructor(private http: HttpClient) {
    // หากต้องการโหลดจาก sessionStorage ตอนเปิดเว็บ (optional)
    const saved = sessionStorage.getItem('groupedCart');
    this.groupedCart = saved ? JSON.parse(saved) : {};
  }

  //  เพิ่มรายการใหม่ลง memory และบันทึกลง sessionStorage (ไว้ใช้แสดงหน้า Cart)
  addGroupedItems(newGroups: { [case_: string]: any[] }) {
    for (const caseKey in newGroups) {
      if (!this.groupedCart[caseKey]) {
        this.groupedCart[caseKey] = [];
      }
      this.groupedCart[caseKey].push(...newGroups[caseKey]);
    }
    this.saveToSession();
  }

  // ดึงข้อมูล grouped ใน memory
  getGroupedCart(): { [case_: string]: any[] } {
    return this.groupedCart;
  }

  //  ลบรายการเฉพาะตัวจาก memory
  removeItem(case_: string, index: number) {
    this.groupedCart[case_].splice(index, 1);
    if (this.groupedCart[case_].length === 0) {
      delete this.groupedCart[case_];
    }
    this.saveToSession();
  }

  //  ล้างรายการใน memory
  clearLocalCart() {
    this.groupedCart = {};
    sessionStorage.removeItem('groupedCart');
  }

  private saveToSession() {
    sessionStorage.setItem('groupedCart', JSON.stringify(this.groupedCart));
  }

  // ------------------------
  //  ติดต่อ MSSQL ผ่าน API
  // ------------------------

  //  เพิ่มรายการทั้งหมดลงฐานข้อมูล MSSQL
  addCartToDB(data: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/AddCartItems`, data); // ต้องส่ง body ไปด้วย
  }

  //  ดึงรายการทั้งหมดจาก MSSQL (รวมทุก case_)
  getCartFromDB(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get_cart`);
  }

  //  ลบรายการจากฐานข้อมูล โดยใช้ itemId หรือรหัสเฉพาะ
  removeItemFromDB(itemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete_cart_item/${itemId}`);
  }

  //  ลบทั้งหมดในฐานข้อมูล (เช่น Clear ทั้ง Cart)
  clearAllFromDB(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clear_cart`);
  }
  updateItemInDB(item: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/update_cart_item`, item);
}
deleteItemsByCase(case_: string): Observable<any> {
  return this.http.delete(`${this.baseUrl}/delete_cart_items_by_case/${case_}`);
}
}