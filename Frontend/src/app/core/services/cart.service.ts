import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items: any[] = [];
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor() {
    // โหลดข้อมูลจาก sessionStorage ถ้ามี
    const saved = sessionStorage.getItem('cart');
    this.items = saved ? JSON.parse(saved) : [];
  }

  getItems() {
    return this.items;
  }

 addItems(newItems: any[]) {
  this.items = [...this.items, ...newItems];
  this.saveToSession();
  this.cartCountSubject.next(this.items.length); 
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