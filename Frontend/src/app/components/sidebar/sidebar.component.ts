import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';  // <-- เพิ่มตรงนี้
import { CartService } from '../../core/services/cart.service';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],  // <-- เพิ่ม CommonModule
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit { // เพิ่ม implements OnInit
  constructor(private router: Router,
    private cartService: CartService
  ) {}

  imagePath = 'assets/images/1.png';

  cartCount: number = 0;

 ngOnInit() {
  this.cartService.cartCount$.subscribe(count => {
    this.cartCount = count;
  });
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
    this.router.navigate(['/login']);
  }
}
