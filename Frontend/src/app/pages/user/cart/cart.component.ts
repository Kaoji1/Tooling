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

 async CreateDocByCase() {
  if (!this.groupedCart || Object.keys(this.groupedCart).length === 0) {
    alert('ไม่มีรายการในตะกร้า');
    return;
  }

  const allItemsToSend: any[] = [];
  const createdDocs: string[] = [];

  for (const caseKey in this.groupedCart) {
    const groupItems = this.groupedCart[caseKey];
    if (groupItems.length === 0) continue;

    const firstItem = groupItems[0];
    const case_ = firstItem.Case_;
    const process = firstItem.Process;

    await this.sendrequestService.GenerateNewDocNo(case_, process).toPromise().then((res) => {
      const docNo = res.DocNo;

      groupItems.forEach((item: any) => {
        item.Doc_no = docNo;
        item.Division = item.Division.Division;
        item.Factory = item.Factory.Fac || 0;
        allItemsToSend.push(item);
      });

      this.sendrequestService.SendRequest(groupItems).subscribe({
        next: () => console.log(`ส่ง ${docNo} สำเร็จ`),
        error: (err) => console.error(`ส่ง ${docNo} ไม่สำเร็จ, err`)
      });

      createdDocs.push(`📄 ${docNo} | ${groupItems.length} รายการ`);
    });
  }

  //  ล้างตะกร้าหลังส่งเสร็จ
  this.cartService.clearAll();
  this.groupedCart = {};

  alert('สร้างและส่งเอกสารแยกตามเคสสำเร็จ:\n\n' + createdDocs.join('\n'));
}

}
