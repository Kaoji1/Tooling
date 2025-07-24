import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items: any[] = [];

  constructor() {
    // โหลดข้อมูลจาก sessionStorage ถ้ามี
    const saved = sessionStorage.getItem('cart');
    this.items = saved ? JSON.parse(saved) : [];
  }

  getItems() {
    return this.items;
  }

  addItems(newItems: any[]) {
    // เพิ่มข้อมูลใหม่เข้า items
    this.items = [...this.items, ...newItems];
    this.saveToSession();
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
    this.saveToSession();
  }

  updateItem(index: number, item: any) {
    this.items[index] = item;
    this.saveToSession();
  }

  clearCart() {
    this.items = [];
    this.saveToSession();
  }

  private saveToSession() {
    sessionStorage.setItem('cart', JSON.stringify(this.items));
  }
}