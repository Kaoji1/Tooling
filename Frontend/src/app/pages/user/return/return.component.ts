import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';


// สร้าง Interface เพื่อกำหนดหน้าตาข้อมูลใน 1 แถว
interface ReturnItem {
  itemNo: string;
  itemName: string;
  spec: string;
  qty: number;
  remark: string;
}

@Component({
  selector: 'app-return',
  templateUrl: './return.component.html',
  styleUrls: ['./return.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,      
    SidebarComponent
  ]
})
export class ReturnComponent implements OnInit {

  // --- ส่วนของ Dropdown (Header) ---
  divisions: any[] = []; // รอรับข้อมูลจาก API
  facilities: any[] = [];
  processes: any[] = [];

  selectedDivision: string = '';
  selectedFacility: string = '';
  selectedProcess: string = '';
  phoneNumber: string = '';

  // --- ส่วนของตาราง (Dynamic Table) ---
  // เริ่มต้นให้มีแถวว่างๆ 1 แถวเสมอ
  returnItems: ReturnItem[] = [
    { itemNo: '', itemName: '', spec: '', qty: 0, remark: '' }
  ];

  constructor() { }

  ngOnInit(): void {
    // ตรงนี้เดี๋ยวค่อยใส่โค้ดเรียก API ดึง Division มาโชว์
    // this.loadDivisions();
  }

  // ฟังก์ชันเพิ่มแถวใหม่ (ปุ่ม + สีเขียว)
  addRow() {
    this.returnItems.push({
      itemNo: '',
      itemName: '',
      spec: '',
      qty: 0,
      remark: ''
    });
  }

  // ฟังก์ชันลบแถว (ปุ่ม - สีแดง ที่จะใส่เพิ่มให้ในตาราง)
  removeRow(index: number) {
    if (this.returnItems.length > 1) {
      this.returnItems.splice(index, 1);
    } else {
      alert("ต้องมีอย่างน้อย 1 รายการครับ");
    }
  }

  // ฟังก์ชันกดปุ่ม Return (ส่งข้อมูล)
  onSubmit() {
    const dataToSend = {
      header: {
        division: this.selectedDivision,
        facility: this.selectedFacility,
        process: this.selectedProcess,
        phone: this.phoneNumber
      },
      items: this.returnItems
    };
    
    console.log('ข้อมูลพร้อมส่ง:', dataToSend);
    // ตรงนี้ค่อยเรียก Service เพื่อยิง API ไปบันทึก
  }
}