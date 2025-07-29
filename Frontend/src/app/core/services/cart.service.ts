import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface RequestItemGroup {
  id: string;
  Division: string;
  Factory: string;
  Case_: string;
  DueDate_: string;
  items: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private groups: RequestItemGroup[] = [];
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor() {
    const saved = sessionStorage.getItem('cart');
    this.groups = saved ? JSON.parse(saved) : [];
    this.cartCountSubject.next(this.groups.length); // count = จำนวนกลุ่ม
  }

  /** ดึงรายการทั้งหมดเป็นกลุ่ม */
  getGroups(): RequestItemGroup[] {
    return this.groups;
  }

  /**เพิ่มกลุ่มใหม่ */
  addGroup(newGroup: RequestItemGroup) {
    this.groups.push(newGroup);
    this.saveToSession();
    this.cartCountSubject.next(this.groups.length);
  }

  /**ลบกลุ่มตาม index */
  removeGroup(index: number) {
    this.groups.splice(index, 1);
    this.saveToSession();
    this.cartCountSubject.next(this.groups.length);
  }

  /** อัปเดตกลุ่ม */
  updateGroup(index: number, group: RequestItemGroup) {
    this.groups[index] = group;
    this.saveToSession();
  }

  /**ล้างตะกร้าทั้งหมด */
  clearCart() {
    this.groups = [];
    this.saveToSession();
    this.cartCountSubject.next(0);
  }

  private saveToSession() {
    sessionStorage.setItem('cart', JSON.stringify(this.groups));
  }
}