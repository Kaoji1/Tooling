import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { CartService } from '../../../core/services/cart.service';
import { Router } from '@angular/router';
import { SendrequestService } from '../../../core/services/SendRequest.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, FormsModule, CommonModule, NotificationComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  groupedCart: { [case_: string]: any[] } = {};
  editingIndex: { [case_: string]: number | null } = {};

  constructor(
    private cartService: CartService,
    private sendrequestService: SendrequestService
  ) {}

  ngOnInit(): void {
    this.groupedCart = this.cartService.getGroupedCart();
    for (const case_ in this.groupedCart) {
      this.editingIndex[case_] = null;
    }
  }

  startEdit(case_: string, index: number) {
    this.editingIndex[case_] = index;
  }

  saveEdit(case_: string, index: number) {
    const item = this.groupedCart[case_][index];
    this.cartService.updateItem(case_, index, item);
    this.editingIndex[case_] = null;
  }

  removeItem(case_: string, index: number) {
    this.cartService.removeItem(case_, index);
    this.groupedCart = this.cartService.getGroupedCart();
  }

CreateDocByCase() {
  if (!this.groupedCart || Object.keys(this.groupedCart).length === 0) {
    alert('ไม่มีรายการในตะกร้า');
    return;
  }
  const allItemsToSend:any[]=[];
  const createdDocs: string[] = [];
  let docCounter = 1;

  for (const caseKey in this.groupedCart) {
    const groupItems = this.groupedCart[caseKey];
    if (groupItems.length === 0) continue;

    const firstItem = groupItems[0];
    const casePart = (firstItem.Case_ || 'XXX').substring(0, 3).toUpperCase();
    const processPart = (firstItem.Process || 'YYY').substring(0, 3).toUpperCase();
    const runningNo = docCounter.toString().padStart(3, '0');
    const docNo = `${casePart}${processPart}${runningNo}`; //สร้าง Doc_no เช่น BURTUR001

    // ใส่ Doc_no ให้กับทุก item ในกลุ่มนี้
    groupItems.forEach((item: any) => {
    item.Doc_no = docNo;
    item.Division=item.Division.Division;
    item.Factory=item.Factory.Fac || 0;
    allItemsToSend.push(item); //รวมทุก item ไว้ในอาร์เรย์เดียว
  });

    console.log("send api:",groupItems);
    //  ส่งข้อมูลไป API ทีละกลุ่ม
    this.sendrequestService.SendRequest(groupItems).subscribe({
      next: () => {
        console.log(` ส่ง ${docNo} สำเร็จ`);
      },
      error: (err) => {
        console.error(` ส่ง ${docNo} ไม่สำเร็จ:, err`);
      }
    });

    createdDocs.push(`📄 ${docNo} | รายการ ${groupItems.length} รายการ`);
    docCounter++;
  }

  //  ล้างตะกร้า
  this.cartService.clearAll();
  this.groupedCart = {};

  // แสดง popup รายชื่อเอกสาร
  alert(' สร้างและส่งเอกสารแยกตามเคสสำเร็จ:\n\n' + createdDocs.join('\n'));
}
}






