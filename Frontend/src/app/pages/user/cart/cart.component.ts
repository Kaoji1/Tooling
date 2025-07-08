import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { cartService } from '../../../core/services/cartService';
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
  
items : any[] = [];

constructor(private cartService: cartService) {}

ngOnInit(): void {
  this.items = this.cartService.getcartItems([]);
}

clearCart() {
    this.cartService.clearCart();
    this.items = [];
  }
}