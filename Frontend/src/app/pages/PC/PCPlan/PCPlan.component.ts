import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { PCPlanService } from '../../../core/services/PCPlan.service';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

import { NgSelectModule } from '@ng-select/ng-select';

export interface PlanItem {
  date: string;
  machineType: string | null;
  fac: string | null;
  mcNo: string;
  process: string | null;
  partBef: string | null;
  partNo: string | null;
  qty: number | null;
  time: string;
  comment: string;
}

@Component({
  selector: 'app-pc-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, NgSelectModule],
  templateUrl: './PCPlan.component.html',
  styleUrls: ['./PCPlan.component.scss']
})
export class PCPlanComponent implements OnInit {

  // --- ตัวแปรสำหรับ Dropdown ---
  divisionOptions: { code: string, label: string }[] = [];
  selectedDivisionCode: string = '';

  // ลิสต์ตัวเลือก (สำหรับ Dropdown ในตาราง)
  machineTypes: string[] = [];
  facs: string[] = [];
  processes: string[] = [];
  partNos: string[] = [];
  partBef: string[] = [];

  // ข้อมูลในตาราง (Main Data)
  planItems: PlanItem[] = [];
  isLoadingMasterData: boolean = false; // (Optional) ตัวแปรเช็คสถานะการโหลดข้อมูล Master Data

  constructor(private pcPlanService: PCPlanService) { }

  ngOnInit(): void {
    this.loadDivisions();
    this.addRow();
  }

  // --- ส่วนที่ 1: Download Format (ดาวน์โหลดฟอร์ม Excel) ---
  downloadFormat() {
    // 1. สร้างข้อมูลตัวอย่าง (Template)
    // ตรงนี้คือหัวตารางที่ให้ User เห็นในไฟล์ Excel สำหรับกรอกข้อมูล
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
  // --- ส่วนที่ 2: Upload Excel (Import ข้อมูลจาก Excel) ---

  // ฟังก์ชันนี้จะถูกเรียกเมื่อ User เลือกไฟล์ (Change Loop)
  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>(evt.target);

    // เช็คว่าเป็นไฟล์เดียวหรือไม่
    if (target.files.length !== 1) {
      Swal.fire('Error', 'Cannot use multiple files', 'error');
      return;
    }

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
      Swal.fire('Error', 'ไม่พบข้อมูล Division (Div) ในไฟล์ Excel กรุณาตรวจสอบ', 'error');
      return;
    }

    // 4. เตรียมตาราง (ไม่ลบของเก่าทิ้งถ้ามีข้อมูลอยู่ แต่กรองแถวว่างออกก่อน)
    // ลบเฉพาะแถวว่างๆ ที่ไม่มีข้อมูลอะไรเลยออก (Clean empty rows)
    this.planItems = this.planItems.filter(item => !this.isRowEmpty(item));

    // ถ้าไม่มีข้อมูลเหลือเลย (หรือข้อมูลเดิมเป็นแถวว่างทั้งหมด) -> ก็ถือว่าเริ่มใหม่
    // ถ้ามีข้อมูลค้างอยู่ -> ก็จะต่อท้ายข้อมูลใหม่เข้าไปเลย

    // 5. วนลูปเอาข้อมูลลงตาราง
    data.forEach(row => {
      this.planItems.push({
        date: this.excelDateToJSDate(row['Date']),
        machineType: row['Machine Type'] || null,
        fac: row['Fac'] || null,
        mcNo: (row['MC No.'] || '').toString(),
        process: row['Process'] || null,
        partBef: row['Part Before'] || null,
        partNo: row['Part No.'] || null,
        qty: row['QTY'] || null,
        time: row['Time'] || '',
        comment: row['Comment'] || ''
      });
    });

    // Optional: แจ้งเตือนหลัง Import ว่าข้อมูลมาแล้ว แต่ยังไม่ Save
    Swal.fire({
      title: 'Import Successful',
      text: `Loaded ${this.planItems.length} rows. Please check data and click Send.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  // ฟังก์ชันช่วยแปลงวันที่จาก Excel (ที่เป็นตัวเลข) เป็น string YYYY-MM-DD
  excelDateToJSDate(serial: any) {
    if (!serial) return '';
    // ถ้า Excel ส่งมาเป็น String อยู่แล้ว (เช่น '2025-12-19') ก็ใช้ได้เลย
    if (typeof serial === 'string') return serial;

    // ถ้าเป็น Serial Number ของ Excel
    const utc_days = Math.floor(serial - 25569);
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

  // เมื่อมีการเปลี่ยน Division -> ให้โหลด Master Data ใหม่
  onDivisionChange() {
    if (this.selectedDivisionCode) {
      this.loadMasterData(this.selectedDivisionCode);
    } else {
      this.clearMasterData(); // ถ้าไม่เลือกอะไร ให้เคลียร์ค่าทิ้ง
    }
  }

  // โหลดข้อมูล Master Data (Machine, Fac, Process, PartNo) จาก Division ที่เลือก
  loadMasterData(divCode: string) {
    this.isLoadingMasterData = true; // เริ่มสถานะกำลังโหลด
    this.pcPlanService.getMasterData(divCode).subscribe({
      next: (res) => {
        // รับข้อมูลก้อนใหญ่มาจาก Backend แล้ว map ใส่ตัวแปร array แยกตามประเภท
        // หมายเหตุ: เช็คชื่อ Property ให้ตรงกับที่ Backend ส่งมา (machines, facilities, etc.)
        this.machineTypes = res.machines.map((x: any) => x.MachineType);
        this.facs = res.facilities.map((x: any) => x.Facility);
        this.processes = res.processes.map((x: any) => x.Process);

        // PartNo กับ PartBef ใช้ข้อมูลชุดเดียวกันตามที่คุยกัน
        this.partNos = res.partNos.map((x: any) => x.PartNo);
        this.partBef = res.partBefs.map((x: any) => x.PartNo); // Backend ส่ง key 'PartNo' กลับมาในชุด partBefs

        this.isLoadingMasterData = false; // โหลดเสร็จแล้ว ปิดสถานะ
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
      machineType: null,
      fac: null,
      process: null,
      partBef: null,
      partNo: null,
      mcNo: '',
      qty: null,
      time: '',
      comment: ''
    });
  }

  isRowEmpty(item: PlanItem): boolean {
    // เช็คว่าแถวนี้ว่างเปล่าหรือไม่ (ไม่มีข้อมูลสำคัญ)
    return !item.date && !item.machineType && !item.fac && !item.mcNo && !item.partNo;
  }

  removeRow(index: number) {
    this.planItems.splice(index, 1);
  }

  selectAllText(event: any) {
    event.target.select();
  }

  // ฟังก์ชันบันทึกข้อมูลเมือกดปุ่ม Send
  onSubmit() {
    // 1. ตรวจสอบว่ามีข้อมูลในตารางไหม
    if (this.planItems.length === 0) {
      Swal.fire('Warning', 'No data to save', 'warning');
      return;
    }

    // 2. ตรวจสอบว่าเลือก Division หรือยัง
    if (!this.selectedDivisionCode) {
      Swal.fire('Warning', 'Please select Division', 'warning');
      return;
    }

    // 3. VALIDATION: ตรวจสอบข้อมูลแต่ละแถว
    const errors: string[] = [];
    this.planItems.forEach((item, index) => {
      const rowNum = index + 1;
      const errorMsg = this.validateRow(item);
      if (errorMsg) {
        errors.push(`Row ${rowNum}: ${errorMsg}`);
      }
    });

    if (errors.length > 0) {
      // แสดง Error ทั้งหมด
      const errorHtml = `
        <div style="text-align: left; max-height: 300px; overflow-y: auto; color: red;">
          ${errors.map(e => `<div>• ${e}</div>`).join('')}
        </div>
      `;
      Swal.fire({
        title: 'Validation Failed',
        html: `Found ${errors.length} errors.<br>Please fix before sending again.<br><hr>${errorHtml}`,
        icon: 'error'
      });
      return; // หยุดการทำงาน ไม่ส่งไป Backend
    }

    // 4. ถ้าผ่าน Validation ทั้งหมดค่อยส่ง
    Swal.fire({
      title: 'Saving...',
      text: `Saving ${this.planItems.length} records.`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // 5. เตรียมข้อมูล (ใส่ Division และ EmployeeID ให้ครบทุกแถว)
    let empId = 'Unknown';
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        empId = userObj.Username || userObj.Employee_ID || 'Unknown';
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    const payload = this.planItems.map(item => ({
      ...item,
      division: this.selectedDivisionCode,
      employeeId: empId
    }));

    // 6. ส่งไป Backend
    this.pcPlanService.savePlan(payload).subscribe({
      next: (res) => {
        if (res.fail > 0) {
          // สร้าง html list รายการที่ Error (จาก Database)
          let errorHtml = '<div style="text-align: left; max-height: 200px; overflow-y: auto;">';
          res.errors.forEach((err: any) => {
            errorHtml += `<p><strong>Row ${err.index + 1}:</strong> ${err.error}</p>`;
          });
          errorHtml += '</div>';

          Swal.fire({
            title: 'Completed with Errors',
            html: `Success: ${res.count}<br>Failed: ${res.fail}<br><hr>${errorHtml}`,
            icon: 'warning'
          });
        } else {
          Swal.fire('Success', `Saved ${res.count} records successfully!`, 'success');
          this.planItems = []; // เคลียร์ตารางหลังบันทึก
        }
      },
      error: (err) => {
        console.error('Save Error:', err);
        Swal.fire('Error', 'Failed to save data. Please try again.', 'error');
      }
    });
  }

  // ฟังก์ชันตรวจสอบความถูกต้องของข้อมูลในแต่ละแถว
  validateRow(item: PlanItem): string | null {
    const missing: string[] = [];

    if (!item.date) missing.push('Date');
    if (!item.mcNo) missing.push('MC No.');

    // เช็ค Dropdown ว่าต้องเลือก และต้องเป็นค่าที่มีอยู่จริงใน Master Data
    if (!item.machineType) {
      missing.push('Machine Type');
    } else if (this.machineTypes.length > 0 && !this.machineTypes.includes(item.machineType)) {
      return `Machine Type '${item.machineType}' is invalid.`;
    }

    if (!item.fac) {
      missing.push('Fac');
    } else if (this.facs.length > 0 && !this.facs.includes(item.fac)) {
      return `Facility '${item.fac}' is invalid.`;
    }

    if (!item.process) {
      missing.push('Process');
    } else if (this.processes.length > 0 && !this.processes.includes(item.process)) {
      return `Process '${item.process}' is invalid.`;
    }

    // PartNo สำคัญมาก
    if (!item.partNo) {
      missing.push('Part No.');
    } else if (this.partNos.length > 0 && !this.partNos.includes(item.partNo)) {
      return `Part No '${item.partNo}' is invalid.`;
    }

    if (missing.length > 0) {
      return `Missing required fields: ${missing.join(', ')}`;
    }

    return null; // ผ่าน
  }
}