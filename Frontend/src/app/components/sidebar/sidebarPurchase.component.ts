import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebarpurchase',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebarPurchase.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarPurchaseComponent implements OnInit {
  Employee_Name: any = 'Guest'; 
  imagePath = 'assets/images/1.png';
  cartCount: number = 0;

  // 1. เพิ่ม @Inject(PLATFORM_ID) ใน constructor
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {}

  ngOnInit(): void {
    // 2. เช็กว่าเป็น Browser หรือไม่ก่อนเข้าถึง sessionStorage
    if (isPlatformBrowser(this.platformId)) {
      const userData = sessionStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.Employee_Name = user.Employee_Name || 'Guest';
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      // เรียกโหลดจำนวนตะกร้าตอนเริ่มต้นด้วย
      this.updateCartCount();
    }
  }

  updateCartCount() {
    // 3. ต้องเช็ก platformId ทุกครั้งที่มีการใช้ sessionStorage/localStorage
    if (isPlatformBrowser(this.platformId)) {
      const cartData = sessionStorage.getItem('cart');
      if (cartData) {
        try {
          const cartItems = JSON.parse(cartData);
          this.cartCount = cartItems.length;
        } catch (e) {
          console.error('Invalid cart data:', e);
          this.cartCount = 0;
        }
      } else {
        this.cartCount = 0;
      }
    }
  }

  logout() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // 4. การจัดการลบ session ก็ต้องทำเฉพาะบน Browser
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.clear();
        }
        this.router.navigate(['/login']);
      }
    });
  }
}
