import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { CartService, RequestItemGroup } from '../../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, FormsModule, CommonModule, NotificationComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  groups: RequestItemGroup[] = [];
  editingGroupIndex: number | null = null;
  editingItemIndex: number | null = null;
  editedQty: number | null = null;

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.groups = this.cartService.getGroups();
  }

  startEditQty(groupIndex: number, itemIndex: number) {
    this.editingGroupIndex = groupIndex;
    this.editingItemIndex = itemIndex;
    this.editedQty = this.groups[groupIndex].items[itemIndex].QTY;
  }

  saveEditQty() {
    if (this.editedQty === null || this.editedQty <= 0) {
      alert('กรุณากรอกจำนวนที่ถูกต้อง');
      return;
    }
    if (this.editingGroupIndex === null || this.editingItemIndex === null) return;

    this.groups[this.editingGroupIndex].items[this.editingItemIndex].QTY = this.editedQty;
    this.cartService.updateGroup(this.editingGroupIndex, this.groups[this.editingGroupIndex]);

    this.cancelEditQty();
    alert('บันทึกจำนวนเรียบร้อยแล้ว');
  }

  cancelEditQty() {
    this.editingGroupIndex = null;
    this.editingItemIndex = null;
    this.editedQty = null;
  }

  removeItem(groupIndex: number, itemIndex: number) {
    const confirmed = confirm('ต้องการลบรายการนี้หรือไม่?');
    if (!confirmed) return;

    this.groups[groupIndex].items.splice(itemIndex, 1);

    // ถ้ากลุ่มไม่มีรายการแล้ว ให้ลบกลุ่มด้วย
    if (this.groups[groupIndex].items.length === 0) {
      this.groups.splice(groupIndex, 1);
    }

    this.cartService.clearCart();
    this.groups.forEach(g => this.cartService.addGroup(g)); // อัพเดตใหม่ทั้งหมด
    this.loadGroups();

    alert('ลบรายการเรียบร้อยแล้ว');
  }

  removeGroup(groupIndex: number) {
    const confirmed = confirm('ต้องการลบกลุ่มนี้หรือไม่?');
    if (!confirmed) return;

    this.cartService.removeGroup(groupIndex);
    this.loadGroups();
    alert('ลบกลุ่มเรียบร้อยแล้ว');
  }

  clearAll() {
    const confirmed = confirm('ต้องการล้างตะกร้าทั้งหมดหรือไม่?');
    if (!confirmed) return;

    this.cartService.clearCart();
    this.loadGroups();
    alert('ล้างตะกร้าทั้งหมดเรียบร้อยแล้ว');
  }
}
// เทสสร้างDoc

// Create_Doc() {
//   if (confirm('Do you want to create this document?')) {
//     const createdDocNo = 'DOC-' + new Date().getTime(); // สร้าง Doc_no จำลอง
//     const itemsToSave = [...this.cartItems]; // สำเนาข้อมูลตะกร้าปัจจุบัน

//     sessionStorage.setItem('request', JSON.stringify(itemsToSave));

//     const doc = {
//       doc_no: createdDocNo,
//       items: itemsToSave,  // เก็บข้อมูลตะกร้า ณ ตอนสร้าง doc
//       date: new Date().toLocaleDateString(),
//       status: 'Pending'
//     };

//     const existingDocs = sessionStorage.getItem('created_docs');
//     const docs = existingDocs ? JSON.parse(existingDocs) : [];

//     docs.push(doc);
//     sessionStorage.setItem('created_docs', JSON.stringify(docs));

//     // เคลียร์ตะกร้า
//     this.cartItems = [];
//     sessionStorage.removeItem('cart');

//     this.router.navigate(['/requestlist']).then(() => {
//       // Clear cart after navigation
//       this.cartItems = [];
//       sessionStorage.removeItem('cart');
//     });
    
//     alert(`สร้างเอกสารเรียบร้อย!\nเลขที่: ${createdDocNo}`);

//     // ไปหน้า History
//     this.router.navigate(['/requestlist']);
//   } else {
//     // ถ้าไม่ตกลงสร้าง ก็ไม่ทำอะไร
//   }
// }





