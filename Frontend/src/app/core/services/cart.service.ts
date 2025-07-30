import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private groupedCart: { [case_: string]: any[] } = {};

  constructor() {
    const saved = sessionStorage.getItem('groupedCart');
    this.groupedCart = saved ? JSON.parse(saved) : {};
  }

  getGroupedCart() {
    return this.groupedCart;
  }

  addGroupedItems(newGroups: { [case_: string]: any[] }) {
    for (const caseKey in newGroups) {
      if (!this.groupedCart[caseKey]) {
        this.groupedCart[caseKey] = [];
      }
      this.groupedCart[caseKey].push(...newGroups[caseKey]);
    }
    this.save();
    
  }


  removeItem(case_: string, index: number) {
    this.groupedCart[case_].splice(index, 1);
    if (this.groupedCart[case_].length === 0) {
      delete this.groupedCart[case_];
    }
    this.save();
  }

  updateItem(case_: string, index: number, newItem: any) {
    this.groupedCart[case_][index] = newItem;
    this.save();
  }

  clearAll() {
    this.groupedCart = {};
    sessionStorage.removeItem('groupedCart');
  }

  private save() {
    sessionStorage.setItem('groupedCart', JSON.stringify(this.groupedCart));
  }
}