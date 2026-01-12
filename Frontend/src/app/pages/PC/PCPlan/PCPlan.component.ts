import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { PCPlanService } from '../../../core/services/PCPlan.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-pc-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './PCPlan.component.html',
  styleUrls: ['./PCPlan.component.scss']
})
export class PCPlanComponent implements OnInit {

  // --- ตัวแปรสำหรับ Dropdown ---
  divisionOptions: { code: string, label: string }[] = []; 
  selectedDivisionCode: string = ''; 

  // ลิสต์ตัวเลือก
  machineTypes: string[] = [];
  facs: string[] = [];
  processes: string[] = [];
  partNos: string[] = [];
  partBef: string[] = []; 
  
  // ข้อมูลในตาราง
  planItems: any[] = [];
  isLoadingMasterData: boolean = false; // (Optional) ตัวแปรเช็คสถานะโหลด

  constructor(private pcPlanService: PCPlanService) { }

  ngOnInit(): void {
    this.loadDivisions();
    this.addRow(); 
  }

  // --- ส่วนที่ 1: Download Format ---
downloadFormat() {
    // 1. สร้างข้อมูลตัวอย่าง (Template)
    // ตรงนี้คือหัวตารางที่คุณอยากให้ User เห็นในไฟล์ Excel
    const templateData = [
      {
        'Date': '2025-01-01',   
        'Div': '7122',         // ต้องมี Div เพื่อเอาไปเลือก Dropdown
        'Machine Type': 'BM165',
        'Fac': 'Turning F.3',
        'MC No.': '1',
        'Process': 'TURNING',
        'Part Before': 'D30292AAP2S3',
        'Part No.': 'D30175ACDP5S1',
        'QTY': 1,
        'Time': '8',
        'Comment': ''
      }
    ];

    // 2. แปลงข้อมูล JSON ให้เป็น Excel Sheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(templateData);

    // 3. สร้างสมุดงาน (Workbook) ใหม่ แล้วเอา Sheet ใส่เข้าไป
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Format PC Plan');

    // 4. สั่ง Browser ให้ดาวน์โหลดไฟล์ทันที (ชื่อไฟล์ PCPlan_Template.xlsx)
    XLSX.writeFile(wb, 'PCPlan_Template.xlsx');
  }
  // --- ส่วนที่ 2: Upload Excel ---
  
  // ฟังก์ชันนี้จะถูกเรียกเมื่อ User เลือกไฟล์
  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);
    
    // เช็คว่าเป็นไฟล์เดียวหรือไม่
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');

    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      // 1. อ่านข้อมูล Binary จากไฟล์
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      // 2. ดึง Sheet แรกมาทำงาน
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      // 3. แปลง Excel เป็น JSON Array
      const data = XLSX.utils.sheet_to_json(ws);
      
      console.log('Excel Data:', data); // ดูข้อมูลดิบก่อน map

      // 4. Map ข้อมูลเข้าตาราง planItems
      this.mapExcelToTable(data);
    };

    reader.readAsBinaryString(target.files[0]);
    
    // Reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้ถ้าต้องการ
    evt.target.value = ''; 
  }

  mapExcelToTable(data: any[]) {
    if (data.length === 0) return;

    // 1. ดึงค่า Division จากแถวแรกสุดของ Excel
    const firstRow = data[0];
    const excelDiv = firstRow['Div']; // อ่านค่าจากคอลัมน์ Div

    if (excelDiv) {
      // 2. เอาค่าที่ได้ ไปใส่ในตัวแปร Dropdown ด้านบน
      this.selectedDivisionCode = excelDiv.toString(); // แปลงเป็น string ให้ชัวร์

      // 3. สั่งโหลด Master Data (Machine, PartNo) ของ Division นั้นทันที
      // เพื่อให้ Dropdown ในตารางมีข้อมูลให้เลือก
      this.loadMasterData(this.selectedDivisionCode);
    } else {
      alert('ไม่พบข้อมูล Division (Div) ในไฟล์ Excel กรุณาตรวจสอบ');
      return;
    }

    // 4. เคลียร์ตารางเก่าทิ้ง (ถ้าต้องการ)
    this.planItems = []; 

    // 5. วนลูปเอาข้อมูลลงตาราง (ไม่ต้อง map 'Div' ลงใน item แล้ว)
    data.forEach(row => {
      this.planItems.push({
        date: this.excelDateToJSDate(row['Date']),
        machineType: row['Machine Type'] || '',
        fac: row['Fac'] || '',
        mcNo: row['MC No.'] || '',
        process: row['Process'] || '',
        partBef: row['Part Before'] || '', 
        partNo: row['Part No.'] || '',
        qty: row['QTY'] || 0,
        time: row['Time'] || '',
        comment: row['Comment'] || ''
      });
    });

    console.log('Import Success. Division selected:', this.selectedDivisionCode);
  }

  // ฟังก์ชันช่วยแปลงวันที่จาก Excel (ที่เป็นตัวเลข) เป็น string YYYY-MM-DD
  excelDateToJSDate(serial: any) {
    if (!serial) return '';
    // ถ้า Excel ส่งมาเป็น String อยู่แล้ว (เช่น '2025-12-19') ก็ใช้ได้เลย
    if (typeof serial === 'string') return serial;

    // ถ้าเป็น Serial Number ของ Excel
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    
    // แปลงเป็น format yyyy-mm-dd เพื่อใส่ใน input type="date"
    return date_info.toISOString().split('T')[0];
  }

  loadDivisions() {
    this.pcPlanService.getDivisions().subscribe({
      next: (data: any[]) => {
        this.divisionOptions = data.map(item => ({
            code: item.Division,
            label: this.mapDivisionName(item.Division)
        }));
      },
      error: (err) => console.error('Error loading divisions:', err)
    });
  }

  mapDivisionName(code: string): string {
    if (code === '7122') return 'GM';
    if (code === '71DZ') return 'PMC';
    return code;
  }

  onDivisionChange() {
    if (this.selectedDivisionCode) {
      this.loadMasterData(this.selectedDivisionCode);
    } else {
      this.clearMasterData();
    }
  }

  // *** แก้ไขตรงนี้ครับ ***
  loadMasterData(divCode: string) {
    this.isLoadingMasterData = true; // เริ่มโหลด
    this.pcPlanService.getMasterData(divCode).subscribe({
      next: (res) => {
        // รับข้อมูลก้อนใหญ่มาแล้ว map ใส่ตัวแปร array
        // หมายเหตุ: เช็คชื่อ Property ให้ตรงกับที่ Backend ส่งมา (machines, facilities, etc.)
        this.machineTypes = res.machines.map((x:any) => x.MachineType);
        this.facs = res.facilities.map((x:any) => x.Facility);
        this.processes = res.processes.map((x:any) => x.Process);
        
        // PartNo กับ PartBef ใช้ข้อมูลชุดเดียวกันตามที่คุยกัน
        this.partNos = res.partNos.map((x:any) => x.PartNo);
        this.partBef = res.partBefs.map((x:any) => x.PartNo); // Backend ส่ง key 'PartNo' กลับมาในชุด partBefs

        this.isLoadingMasterData = false; // โหลดเสร็จแล้ว
      },
      error: (err) => {
        console.error('Error loading master data:', err);
        this.isLoadingMasterData = false;
      }
    });
  }

  

  clearMasterData() {
    this.machineTypes = [];
    this.facs = [];
    this.processes = [];
    this.partNos = [];
    this.partBef = [];
  }

  // --- ส่วนจัดการตาราง (เหมือนเดิม) ---
  addRow() {
     this.planItems.push({
       date: '',
       machineType: '',
       fac: '',
       process: '',
       partBef: '',
       partNo: '',
       mcNo: '',     
       qty: 0,       
       time: '',     
       comment: ''   
     });
  }

  removeRow(index: number) {
    this.planItems.splice(index, 1);
  }

  selectAllText(event: any) {
    event.target.select();
  }

  onSubmit() {
    console.log('Sending Data:', this.planItems);
  }
}