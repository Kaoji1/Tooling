import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MOCKDATA } from '../../../mock-data';
import { Router } from '@angular/router';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { machine } from 'os';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, FormsModule, CommonModule,NotificationComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  editingIndex: number | null = null;
  originalItem: any = null;
  items: any;
  

constructor(private router: Router) {}

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
        caseother:cartItem.caseother,
        machineNoother:cartItem.machineNoother
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
    
  }
}


// เทสสร้างDoc

Create_Doc() {
  if (confirm('Do you want to create this document?')) {
    const createdDocNo = 'DOC-' + new Date().getTime(); // สร้าง Doc_no จำลอง
    const itemsToSave = [...this.cartItems]; // สำเนาข้อมูลตะกร้าปัจจุบัน

    sessionStorage.setItem('request', JSON.stringify(itemsToSave));

    const doc = {
      doc_no: createdDocNo,
      items: itemsToSave,  // เก็บข้อมูลตะกร้า ณ ตอนสร้าง doc
      date: new Date().toLocaleDateString(),
      status: 'Pending'
    };

    const existingDocs = sessionStorage.getItem('created_docs');
    const docs = existingDocs ? JSON.parse(existingDocs) : [];

    docs.push(doc);
    sessionStorage.setItem('created_docs', JSON.stringify(docs));

    // เคลียร์ตะกร้า
    this.cartItems = [];
    sessionStorage.removeItem('cart');

    this.router.navigate(['/requestlist']).then(() => {
      // Clear cart after navigation
      this.cartItems = [];
      sessionStorage.removeItem('cart');
    });
    
    alert(`สร้างเอกสารเรียบร้อย!\nเลขที่: ${createdDocNo}`);

    // ไปหน้า History
    this.router.navigate(['/requestlist']);
  } else {
    // ถ้าไม่ตกลงสร้าง ก็ไม่ทำอะไร
  }
}

}
