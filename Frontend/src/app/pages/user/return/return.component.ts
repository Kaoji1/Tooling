import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { ReturnService } from '../../../core/services/return.service';
import { HttpClientModule } from '@angular/common/http';


// สร้าง Interface เพื่อกำหนดหน้าตาข้อมูลใน 1 แถว
interface ReturnItem {
  partNo: string;
  itemNo: string;
  itemName: string;
  spec: string;
  qty: number;
  remark: string;
}

@Component({
  selector: 'app-return',                     //  ชื่อ Tag สำหรับเรียกใช้ Component นี้ (<app-return>)
  templateUrl: './return.component.html',     //  ไฟล์ HTML ที่ใช้แสดงผล
  styleUrls: ['./return.component.scss'],     //  ไฟล์ CSS/SCSS สำหรับตกแต่ง
  standalone: true,                           //  กำหนดเป็น Standalone Component
  imports: [
    CommonModule,                             //  นำเข้า module พื้นฐาน (เช่น *ngFor, *ngIf)
    FormsModule,                              //  นำเข้า module สำหรับทำ Two-way binding ([(ngModel)])
    SidebarComponent,                          //  นำเข้า Sidebar เพื่อมาแสดงผลในหน้านี้
    HttpClientModule
  ]
})
export class ReturnComponent implements OnInit {

  // --- ส่วนของ Dropdown (Header) ---
  divisions: any[] = [];
  facilities: any[] = [];
  processes: any[] = [];

  // ตัวแปรเก็บค่าที่ user เลือกใน Dropdown
  selectedDivision: any = null; // Changed to object to hold whole division object if needed, or just ID
  selectedDivisionId: number | null = null;
  selectedFacility: string = '';
  selectedProcess: string = '';
  phoneNumber: string = '';

  // --- ส่วนของตาราง (Dynamic Table) ---
  // เริ่มต้นให้มีแถวว่างๆ 1 แถวเสมอ
  returnItems: ReturnItem[] = [
    { partNo: '', itemNo: '', itemName: '', spec: '', qty: 0, remark: '' }
  ];

  constructor(private returnService: ReturnService) { }

  ngOnInit(): void {
    this.loadDivisions();
  }

  loadDivisions() {
    this.returnService.getDivisions().subscribe({
      next: (data) => {
        this.divisions = data;
      },
      error: (err) => {
        console.error('Error loading divisions:', err);
      }
    });
  }

  onDivisionChange() {
    this.facilities = [];
    this.processes = [];
    this.selectedFacility = '';
    this.selectedProcess = '';

    if (this.selectedDivisionId) {
      this.returnService.getFacilities(this.selectedDivisionId).subscribe({
        next: (data) => {
          this.facilities = data;
        },
        error: (err) => console.error('Error loading facilities:', err)
      });

      this.returnService.getProcesses(this.selectedDivisionId).subscribe({
        next: (data) => {
          this.processes = data;
        },
        error: (err) => console.error('Error loading processes:', err)
      });
    }
  }

  // ฟังก์ชันเพิ่มแถวใหม่ (ปุ่ม + สีเขียว)
  addRow() {
    this.returnItems.push({
      partNo: '',
      itemNo: '',
      itemName: '',
      spec: '',
      qty: 0,
      remark: ''
    });
  }

  // ฟังก์ชันลบแถว (ปุ่ม - สีแดง ที่จะใส่เพิ่มให้ในตาราง)
  removeRow(index: number) {
    // เช็คว่ามีมากกว่า 1 แถวไหม? (ถ้าเหลือแถวเดียวจะไม่ให้ลบ หรือจะแค่เคลียร์ค่าก็ได้)
    if (this.returnItems.length > 1) {
      // คำสั่ง splice คือการตัดสมาชิกออกจาก Array
      // แปลว่า ตัดที่ตำแหน่ง index จำนวน 1 ตัว
      this.returnItems.splice(index, 1);
    } else {
      alert("ต้องมีอย่างน้อย 1 รายการครับ");
    }
  }

  // ฟังก์ชันดึงข้อมูล Item
  onItemNoChange(index: number, itemNo: string) {
    if (!itemNo) return;

    // เช็คว่าเลือก Division หรือยัง
    if (!this.selectedDivisionId) {
      alert("Please select a Division first / กรุณาเลือก Division ก่อนครับ");
      this.returnItems[index].itemNo = ''; // เคลียร์ค่าที่สแกนมา
      return;
    }

    this.returnService.getItemDetails(itemNo, this.selectedDivisionId!).subscribe({
      next: (data) => {
        if (data) {
          this.returnItems[index].itemName = data.ItemName;
          this.returnItems[index].spec = data.Spec;
        }
      },
      error: (err) => {
        console.error('Error fetching item:', err);
        // Optional: clear fields or alert
        this.returnItems[index].itemName = '';
        this.returnItems[index].spec = '';
        alert('Item not found / ไม่พบข้อมูลสินค้า');
      }
    });
  }

  // ฟังก์ชันกดปุ่ม Return (ส่งข้อมูล)
  onSubmit() {
    const dataToSend = {
      header: {
        divisionId: this.selectedDivisionId,
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