import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component'; // เช็ค Path ให้ถูกนะครับ

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './PlanList.component.html',
  styleUrls: ['./PlanList.component.scss']
})
export class PlanListComponent implements OnInit {

  // ตัวแปรสำหรับ Filter
  filterDate: string = '';
  filterDivision: string = '';
  filterMachineType: string = '';

  // รายการใน Dropdown Filter
  divisions: string[] = ['GM', 'PMC', 'Production'];
  machineTypes: string[] = ['CNC', 'Lathe', 'Milling'];

  // ข้อมูลจำลองในตาราง (เพื่อให้เห็นภาพตามรูป)
  planList: any[] = [
    {
      mcType: 'BM165',
      division: 'GM',
      fac: 'Turning F.3',
      process: 'TURNING',
      partBefore: 'D30292AAP2S3',
      mcNo: '62',
      partNo: 'D30175ACDP5S1',
      qty: 1,
      time: '8',
      comment: '',
      pathDwg: '-',
      pathLayout: '-',
      iiqc: '-'
    },
    {
      mcType: '',
      division: '',
      fac: '',
      process: '',
      partBefore: '',
      mcNo: '',
      partNo: '',
      qty: '',
      time: '',
      comment: '',
      pathDwg: '-',
      pathLayout: '-',
      iiqc: '-'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  // ฟังก์ชันเมื่อกดปุ่ม Edit
  onEdit(item: any) {
    console.log('Edit item:', item);
    // ใส่ Logic เปิด Popup แก้ไขตรงนี้
  }

  // ฟังก์ชันเมื่อกดปุ่ม Delete
  onDelete(index: number) {
    if(confirm('Are you sure you want to delete this row?')) {
      this.planList.splice(index, 1);
    }
  }

}