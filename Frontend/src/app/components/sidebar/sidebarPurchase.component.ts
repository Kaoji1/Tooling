import { Component ,OnInit} from '@angular/core';
import { Router } from '@angular/router';
import {RouterModule} from '@angular/router';
import { CommonModule } from '@angular/common';  // <-- เพิ่มตรงนี้
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebarpurchase',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebarPurchase.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarPurchaseComponent implements OnInit {
  Employee_Name: any; // เพิ่ม implements OnInit
  constructor(private router: Router,
    
  ) {}

  imagePath = 'assets/images/1.png';

  cartCount: number = 0;

 ngOnInit(): void {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.Employee_Name = user.Employee_Name || 'Guest'; // ← ใช้ชื่อที่มาจาก DB
    }
  }

  updateCartCount() {
  const cartData = sessionStorage.getItem('cart');
  if (cartData) {
    try {
      const cartItems = JSON.parse(cartData);
      this.cartCount = cartItems.length;  // นับจำนวน object ใน array เท่านั้น
    } catch (e) {
      console.error('Invalid cart data:', e);
      this.cartCount = 0;
    }
  } else {
    this.cartCount = 0;
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
      // 👉 ลบ session หรือ token ถ้ามี
      sessionStorage.clear(); // หรือ localStorage.clear();
      this.router.navigate(['/login']); // 👉 กลับไปหน้า login
      // Swal.fire({
      //   icon: 'success',
      //   title: 'Logged out',
      //   text: 'You have been logged out.',
      //   timer: 2000,
      //   showConfirmButton: false
      // });
    }
  });
}
}
