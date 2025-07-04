import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CartService } from './cart.service';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterOutlet,SidebarComponent,FormsModule,CommonModule ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})

export class CartComponent {
  
cartItems: any[] = [];

constructor(private cartService: CartService) {}

ngOnInit(): void {
this.cartItems = this.cartService.getCartItem();
console.log('ตะกร้า:',this.cartItems);
}

removeItem(index: number):void {
this.cartItems.splice(index,1);
this.cartService.setCartItems(this.cartItems); }
  
}