import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MOCKDATA } from '../../../mock-data';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  editingIndex: number | null = null;
  originalItem: any = null;

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    const storedCart = sessionStorage.getItem('cart');
    const simpleCart = storedCart ? JSON.parse(storedCart) : [];

    this.cartItems = simpleCart.map((cartItem: any) => {
      const detail = MOCKDATA.find(d => d.partNo === cartItem.partNo);
      return {
        ...detail,
        qty: cartItem.qty,
        Process: cartItem.process,
        Spec: cartItem.spec,
        MachineType: cartItem.machineType,
        inputDate: cartItem.inputDate,
        setupDate: cartItem.setupDate,
        factory: cartItem.factory,
        division: cartItem.division,
        dueDate: cartItem.dueDate || '',
        case:cartItem.case,
        caseother:cartItem.caseother
      };
    });
  }

  startEdit(index: number) {
    this.editingIndex = index;
    this.originalItem = { ...this.cartItems[index] };
  }

  saveEdit(index: number) {
    this.editingIndex = null;
    this.originalItem = null;
    sessionStorage.setItem('cart', JSON.stringify(this.cartItems));
    alert('บันทึกข้อมูลเรียบร้อยแล้ว');
  }

  cancelEdit() {
    if (this.editingIndex !== null && this.originalItem) {
      this.cartItems[this.editingIndex] = { ...this.originalItem };
      this.editingIndex = null;
      this.originalItem = null;
    }
  }

removeItem(index: number) {
  const confirmed = confirm('Do you want to delete this item?');
  if (confirmed) {
    this.cartItems.splice(index, 1);
    sessionStorage.setItem('cart', JSON.stringify(this.cartItems));
    alert('Item deleted');
    window.location.reload();  // โหลดหน้าใหม่เลย = อัปเดต Sidebar ใหม่ด้วย
  }
}

}
