import { Injectable } from '@angular/core';

const baseUrl = 'http://PBGM7E:3000/api';

@Injectable({
  providedIn: 'root'
})
export class RequestlistService {

  setItem(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  getItem(key: string): any {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  clear(): void {
    sessionStorage.clear();
  }
}
