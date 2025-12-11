import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; // **เพิ่ม 2 Imports**
import { isPlatformBrowser } from '@angular/common'; // **เพิ่ม 1 Import**

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // **เพิ่มการ Inject PLATFORM_ID ใน constructor**
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  // ฟังก์ชันนี้จะถูกเรียกโดย component/guard
  getUserRole(): string {
    // **ตรวจสอบว่าเป็นเบราว์เซอร์ก่อนเข้าถึง sessionStorage**
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('role') || '';
    }
    // คืนค่าว่างหรือค่าเริ่มต้นเมื่อรันบนเซิร์ฟเวอร์ (SSR)
    return '';
  }

  getToken(): string | null {
    // **ตรวจสอบว่าเป็นเบราว์เซอร์ก่อนเข้าถึง sessionStorage**
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('token');
    }
    // คืนค่า null เมื่อรันบนเซิร์ฟเวอร์ (SSR)
    return null;
  }

  isViewer(): boolean {
    return this.getUserRole() === 'view';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }
}