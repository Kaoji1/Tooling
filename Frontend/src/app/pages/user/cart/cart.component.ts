import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { CartService } from '../../../core/services/cart.service';
import { Router } from '@angular/router';
import { SendrequestService } from '../../../core/services/SendRequest.service';
import bootstrap from '../../../../main.server';

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
  checkedCases: { [case_: string]: boolean } = {};

  constructor(
    private cartService: CartService,
    private sendrequestService: SendrequestService
  ) {}

  ngOnInit(): void {
    this.loadCartFromDB();
  }

  loadCartFromDB() {
    this.cartService.getCartFromDB().subscribe({
      next: (data) => {
        this.groupedCart = this.groupItemsByCase(data);
        for (const case_ in this.groupedCart) {
          this.editingIndex[case_] = null;
        }
      },
      error: (err) => {
        console.error('โหลดข้อมูล Cart ล้มเหลว:', err);
        alert('ไม่สามารถโหลดรายการตะกร้าได้');
      }
    });
  }

  groupItemsByCase(items: any[]): { [case_: string]: any[] } {
    const grouped: { [case_: string]: any[] } = {};
    items.forEach((item) => {
      const caseKey = item.CASE || 'ไม่ระบุ';
      if (!grouped[caseKey]) grouped[caseKey] = [];
      grouped[caseKey].push(item);
    });
    return grouped;
  }

  startEdit(case_: string, index: number) {
    this.editingIndex[case_] = index;
  }

  saveEdit(case_: string, index: number) {
    const item = this.groupedCart[case_][index];
    this.cartService.updateItemInDB(item).subscribe({
      next: () => {
        alert('บันทึกข้อมูลเรียบร้อย');
        this.editingIndex[case_] = null;
      },
      error: () => alert('เกิดข้อผิดพลาดในการบันทึก'),
    });
  }

removeItem(case_: string, index: number) {
  const item = this.groupedCart[case_][index];
  const id = item.ID_Cart || item.id || item.ItemID;

  console.log(' ลบ ID:', id); // เช็คว่าเป็น undefined หรือเปล่า

  if (!id) {
    alert('ไม่พบรหัส ID_Cart สำหรับลบ');
    return;
  }

  this.cartService.removeItemFromDB(id).subscribe({
    next: () => {
      this.groupedCart[case_].splice(index, 1);
      if (this.groupedCart[case_].length === 0) {
        delete this.groupedCart[case_];
      }
    },
    error: (err) => {
      console.error('ลบไม่สำเร็จ:', err);
      alert('ลบไม่สำเร็จ');
    }
  });
}

  async CreateDocByCase() {
  if (!this.groupedCart || Object.keys(this.groupedCart).length === 0) {
    alert('ไม่มีรายการในตะกร้า');
    return;
  }

  const createdDocs: string[] = [];

  for (const caseKey in this.groupedCart) {
    if (!this.checkedCases[caseKey]) continue;

    const groupItems = this.groupedCart[caseKey];
    if (groupItems.length === 0) continue;

    const firstItem = groupItems[0];
    const case_ = firstItem.CASE;
    const process = firstItem.Process;
    const factory = firstItem.Fac  || '';
    
    console.log("case:",case_);

    // ตรวจสอบค่าว่าง
    if (!case_ || !process || !factory) {
      alert(`ข้อมูลไม่ครบ กรุณาตรวจสอบ Case: ${case_} | Process: ${process} | Factory: ${factory}`);
      continue;
    }

    try {
      const res = await this.sendrequestService.GenerateNewDocNo(case_, process, factory).toPromise();
      const docNo = res.DocNo;

      groupItems.forEach((item: any) => item.Doc_no = docNo);

      await this.sendrequestService.SendRequest(groupItems).toPromise();
      await this.cartService.deleteItemsByCase(case_).toPromise();
      createdDocs.push(`📄 ${docNo} | ${groupItems.length} รายการ`);

      //  ลบออกจาก groupedCart ทันที
      delete this.groupedCart[caseKey];
      delete this.checkedCases[caseKey];

    } catch (err) {
      console.error(` ส่ง ${case_} ล้มเหลว, err`);
      alert( `ส่ง ${case_} ล้มเหลว`);
  
    }
  }
 if (createdDocs.length > 0) {
    alert('สร้างและส่งเอกสารสำเร็จ:\n\n' + createdDocs.join('\n'));
  } else {
    alert('ไม่มีเอกสารใดถูกสร้าง กรุณาติ๊กก่อนส่ง');
  }
 
}

  clearSelectedCases() {
    for (const caseKey in this.checkedCases) {
      if (this.checkedCases[caseKey]) {
        delete this.groupedCart[caseKey];
      }
    }
    this.checkedCases = {};
  }

  selectedItem: any; // ตัวที่ถูกเลือกตอนอัปโหลด
selectedFile!: File;
noteText: string = '';
openUploadModal(item: any): void {
  this.selectedItem = item; // เก็บรายการที่คลิกไว้
}

onFileSelected(event: any): void {
  this.selectedFile = event.target.files[0];
}


}