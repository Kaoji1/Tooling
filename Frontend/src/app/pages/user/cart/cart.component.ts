import { Component,OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { cartService } from '../../../core/services/cartService';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MOCKDATA } from '../../../mock-data';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterOutlet,SidebarComponent,FormsModule,CommonModule ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})

export class CartComponent   implements OnInit {
  cartItems: any=[];
  ngOnInit() {
    this.loadCart();
  }

 loadCart() {
  const storedCart = sessionStorage.getItem('cart');
  const simpleCart = storedCart ? JSON.parse(storedCart) : [];

  // รวมข้อมูลจาก MOCKDATA ตาม itemNo
  this.cartItems = simpleCart.map((cartItem: any) => {
    const detail = MOCKDATA.find(d => d.partNo === cartItem.partNo);
    return {
      ...detail,       // รายละเอียดเต็มจาก MOCKDATA
      qty: cartItem.qty, // ปริมาณที่ผู้ใช้เลือกไว้
      Process:cartItem.process,
      Spec:cartItem.spec,
      MachineType:cartItem.machineType,
      inputDate: cartItem.inputDate ,
      setupDate: cartItem.setupDate


    
    };
  });
}

  removeItem(index: number) {
    const confirmed = confirm('Do you want to deleted this item?');
    if (confirmed) {
      this.cartItems.splice(index,1);
      sessionStorage.setItem('cart',JSON.stringify(this.cartItems));
      alert('Item deleted');
    }
  }
  

}