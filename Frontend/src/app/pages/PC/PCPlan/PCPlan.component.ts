import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { PCPlanService } from '../../../core/services/PCPlan.service';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import Swal from 'sweetalert2';

import { NgSelectModule } from '@ng-select/ng-select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter } from '../../../core/utils/custom-date-adapter';

export interface PlanItem {
  date: string | Date | null;
  machineType: string | null;
  fac: string | null;
  mcNo: string;
  process: string | null;
  partBef: string | null;
  partNo: string | null;
  qty: number | null;
  time: string;
  comment: string;
  checked?: boolean; // Add checked property for selection
}

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-pc-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    NgSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './PCPlan.component.html',
  styleUrls: ['./PCPlan.component.scss']
})

export class PCPlanComponent implements OnInit {

  // --- ตัวแปรสำหรับ Dropdown ---
  divisionOptions: { code: string, label: string, profitCenter: string }[] = [];
  selectedDivisionCode: string = '';

  // ลิสต์ตัวเลือก (สำหรับ Dropdown ในตาราง)
  machineTypes: string[] = [];
  facs: any[] = [];
  processes: string[] = [];
  partNos: string[] = [];
  partBef: string[] = [];

  // ข้อมูลในตาราง (Main Data)
  planItems: PlanItem[] = [];
  isLoadingMasterData: boolean = false; // โหลด Machine/Fac (เร็ว)
  isLoadingParts: boolean = false;      // โหลด Process/PartNo (ช้า)
  minDate: Date = new Date(); // Disable past dates
  selectAll: boolean = false; // "Select All" checkbox state

  constructor(private pcPlanService: PCPlanService) { }

  ngOnInit(): void {
    this.loadDivisions();
    // this.restoreState(); // Moved to loadDivisions to avoid race condition
  }

  loadDivisions() {
    this.pcPlanService.clearCache(); // Force fresh data from server
    this.pcPlanService.getDivisions().subscribe({
      next: (data: any[]) => {
        console.log('DEBUG: Raw divisions received:', data?.length, data);
        // Show divisions deduplicated by Profit_Center
        this.divisionOptions = data
          .map(item => {
            const pc = (item.Profit_Center || '').toString().trim();
            return {
              code: pc,
              label: pc,
              profitCenter: pc
            };
          })
          .filter(item => item.code !== '')
          .filter((item, index, self) =>
            self.findIndex(t => t.code === item.code) === index
          );

        // Restore state AFTER divisions are loaded (Delayed to prevent UI blocking)
        setTimeout(() => {
          this.restoreState();
        }, 100);
      },
      error: (err) => {
        console.error('Error loading divisions:', err);
      }
    });
  }

  restoreState() {
    const state = this.pcPlanService.getPlanState();
    if (state && state.planItems.length > 0) {
      this.selectedDivisionCode = state.selectedDivisionCode;
      this.planItems = state.planItems.map((item: any) => ({
        ...item,
        date: item.date ? new Date(item.date) : null
      }));
      if (this.selectedDivisionCode) {
        this.loadMasterData(this.selectedDivisionCode);
      }
    } else {
      this.addRow();
    }
  }

  saveCurrentState() {
    this.pcPlanService.setPlanState({
      selectedDivisionCode: this.selectedDivisionCode,
      planItems: this.planItems
    });
  }

  // --- ส่วนที่ 1: Download Format (ดาวน์โหลดฟอร์ม Excel) ---
  // --- ส่วนที่ 1: Download Format (ดาวน์โหลดฟอร์ม Excel แบบสวยงาม) ---
  downloadFormat() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Format PC Plan');

    // 1. กำหนด Columns และ Width
    worksheet.columns = [
      { header: 'Date', key: 'Date', width: 15 },
      { header: 'Div', key: 'Div', width: 10 },
      { header: 'Machine Type', key: 'MachineType', width: 15 },
      { header: 'Fac', key: 'Fac', width: 15 },
      { header: 'MC No.', key: 'MCNo', width: 10 },
      { header: 'Process', key: 'Process', width: 15 },
      { header: 'Part Before', key: 'PartBefore', width: 20 },
      { header: 'Part No.', key: 'PartNo', width: 20 },
      { header: 'QTY', key: 'QTY', width: 20 },
      { header: 'Time', key: 'Time', width: 20 },
      { header: 'Comment', key: 'Comment', width: 20 },
    ];

    // 2. ใส่ข้อมูลตัวอย่าง
    const row = worksheet.addRow({
      Date: 'DD/MM/YYYY',
      Div: '7122',
      MachineType: 'BM165',
      Fac: 'F.3',
      MCNo: '1',
      Process: 'TURNING',
      PartBefore: 'D30292AAP2S3',
      PartNo: 'D30175ACDP5S1',
      QTY: 1,
      Time: '8',
      Comment: 'EX.'
    });

    // 3. จัดรูปแบบ Header (แถวที่ 1)
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      // สีพื้นหลังเขียวเข้ม
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1B5E20' } // Green 900
      };
      // ตัวหนังสือสีขาว + ตัวหนา
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      };
      // จัดกึ่งกลาง
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      // เส้นขอบ
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 4. จัดรูปแบบข้อมูล (แถวอื่นๆ)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // 5. เปิด AutoFilter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'K1',
    };

    // 6. Export ไฟล์
    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PCPlan_Template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
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
    const excelDiv = firstRow['Div']; // อ่านค่าจากคอลัมน์ Div (Profit_Center เช่น "7122")

    if (excelDiv) {
      // 2. หา Division_Id จาก Profit_Center ที่อ่านจาก Excel
      const matchedDiv = this.divisionOptions.find(d => d.profitCenter === excelDiv?.toString());

      if (matchedDiv) {
        // เจอ! ใช้ Division_Id เป็น selectedDivisionCode
        this.selectedDivisionCode = matchedDiv.code;
      } else {
        // ไม่เจอ ลองใช้ค่าตรงๆ (Fallback)
        this.selectedDivisionCode = excelDiv.toString();
      }

      // 3. โหลด Master Data ด้วย Division_Id ที่ถูกต้อง
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

    data.forEach(row => {
      // Find Fac even if header is Facility or FAC
      const rawFac = row['Fac'] || row['Facility'] || row['FAC'];

      this.planItems.push({
        date: this.excelDateToJSDate(row['Date']),
        machineType: row['Machine Type'] ? row['Machine Type'].toString().trim() : null,
        fac: rawFac ? rawFac.toString().trim() : null,
        mcNo: row['MC No.'] ? row['MC No.'].toString().trim() : '',
        process: row['Process'] ? row['Process'].toString().trim() : null,
        partBef: row['Part Before'] ? row['Part Before'].toString().trim() : null,
        partNo: row['Part No.'] ? row['Part No.'].toString().trim() : null,
        qty: row['QTY'] || null,
        time: row['Time'] ? row['Time'].toString().trim() : '',
        comment: row['Comment'] ? row['Comment'].toString().trim() : ''
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

    // ถ้า Excel ส่งมาเป็น String
    if (typeof serial === 'string') {
      // Case 1: Already yyyy-MM-dd (e.g. 2025-12-19) -> Return as is
      if (serial.match(/^\d{4}-\d{2}-\d{2}$/)) return serial;

      // Case 2: mm/dd/yyyy (e.g. 01/22/2026) -> Convert to yyyy-MM-dd
      const mmddyyyy = serial.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (mmddyyyy) {
        const m = mmddyyyy[1].padStart(2, '0');
        const d = mmddyyyy[2].padStart(2, '0');
        const y = mmddyyyy[3];
        return `${y}-${m}-${d}`;
      }

      return serial;
    }

    // ถ้าเป็น Serial Number ของ Excel
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    // แปลงเป็น format yyyy-mm-dd เพื่อใส่ใน input type="date"
    return date_info.toISOString().split('T')[0];
  }



  // Removed mapDivisionName - no longer needed, SP returns Division_Name directly

  // เมื่อมีการเปลี่ยน Division -> ให้โหลด Master Data ใหม่
  onDivisionChange() {
    console.log('Selected Division Code:', this.selectedDivisionCode); // DEBUG LOG
    if (this.selectedDivisionCode) {
      this.loadMasterData(this.selectedDivisionCode);
    } else {
      this.clearMasterData(); // ถ้าไม่เลือกอะไร ให้เคลียร์ค่าทิ้ง
    }
    this.saveCurrentState();
  }

  // Updated: Load Master Data with Split Loading Strategy
  // 1. FAST: Load Machine/Fac immediately
  // 2. SLOW: Load Process/PartNo in background
  loadMasterData(divCode: string) {
    // Reset Arrays & Set Loading States
    this.machineTypes = [];
    this.facs = [];
    this.processes = [];
    this.partNos = [];
    this.partBef = [];

    this.isLoadingMasterData = true; // Show Main Spinner
    this.isLoadingParts = true;      // Show Parts Spinner (Background)

    // Call FAST API (Machine & Facility)
    this.pcPlanService.getMasterData(divCode, 'FAST').subscribe({
      next: (res) => {
        // --- Populate Machines ---
        this.machineTypes = res.machines.map((x: any) => x.MC);

        // --- Populate Facilities ---
        const uniqueFacs = new Set<string>();
        res.facilities.forEach((x: any) => {
          const fullName = x.FacilityName || '';
          const match = fullName.match(/F\.\d+/);
          const shortName = match ? match[0] : fullName;
          if (shortName) uniqueFacs.add(shortName);
        });
        this.facs = Array.from(uniqueFacs).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        this.isLoadingMasterData = false; // Hide Main Spinner (User can select Machine/Fac now)

        // Call SLOW API (Process & PartNo) -> Background Loading
        this.pcPlanService.getMasterData(divCode, 'SLOW').subscribe({
          next: (resSlow) => {
            this.processes = resSlow.processes.map((x: any) => x.Process);
            this.partNos = resSlow.partNos.map((x: any) => x.PartNo);
            this.partBef = resSlow.partNos.map((x: any) => x.PartNo);

            this.isLoadingParts = false; // Hide Parts Spinner
          },
          error: (err) => {
            console.error('Error loading SLOW data:', err);
            this.isLoadingParts = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading FAST data:', err);
        this.isLoadingMasterData = false;
        this.isLoadingParts = false;
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
      date: null,
      machineType: null,
      fac: null,
      process: null,
      partBef: null,
      partNo: null,
      mcNo: '',
      qty: null,
      time: '',
      comment: '',
      groupId: null,
      revision: 1,
      checked: false
    } as any);
    this.saveCurrentState();
  }

  clearAll() {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will clear all items in the table!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, clear all!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.planItems = [];
        this.selectedDivisionCode = '';
        this.clearMasterData();
        this.pcPlanService.clearPlanState();
        this.addRow();
        this.saveCurrentState();
      }
    });
  }

  isRowEmpty(item: PlanItem): boolean {
    // เช็คว่าแถวนี้ว่างเปล่าหรือไม่ (ไม่มีข้อมูลสำคัญ)
    return !item.date && !item.machineType && !item.fac && !item.mcNo && !item.partNo;
  }

  removeRow(index: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.planItems.splice(index, 1);
        this.saveCurrentState();
        this.checkAllSelected(); // Re-check selection state
        Swal.fire(
          'Deleted!',
          'Your row has been deleted.',
          'success'
        )
      }
    })
  }

  // --- Selection Logic ---

  toggleAll() {
    this.planItems.forEach(item => item.checked = this.selectAll);
  }

  checkAllSelected() {
    this.selectAll = this.planItems.length > 0 && this.planItems.every(item => item.checked);
  }

  hasSelectedItems(): boolean {
    return this.planItems.some(item => item.checked);
  }

  removeSelected() {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete selected!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.planItems = this.planItems.filter(item => !item.checked);
        this.selectAll = false;
        this.saveCurrentState();
        Swal.fire(
          'Deleted!',
          'Selected items have been deleted.',
          'success'
        )
      }
    })
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
        title: '<span style="color:#ef4444; font-weight:800;">Validation Failed</span>',
        html: `<div style="text-align:left; background:#fff1f2; border-radius:12px; padding:1.25rem; border:1px solid #fecaca; color:#991b1b;">
          Found <b>${errors.length} errors</b>. Please fix before sending again.<br><hr style="border:0.5px solid #fecaca; margin:10px 0;">${errorHtml}</div>`,
        icon: 'error',
        customClass: {
          popup: 'swal-premium-popup',
          title: 'swal-premium-title',
          confirmButton: 'swal-premium-confirm'
        }
      });
      return; // หยุดการทำงาน ไม่ส่งไป Backend
    }

    // 4. ถ้าผ่าน Validation ทั้งหมดค่อยส่ง
    Swal.fire({
      title: '<span style="color:#1e293b; font-weight:800;">Saving...</span>',
      text: `Saving ${this.planItems.length} records.`,
      allowOutsideClick: false,
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
      },
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

    // หา Profit_Center จาก Division ที่เลือก
    const selectedDiv = this.divisionOptions.find(d => d.code === this.selectedDivisionCode);

    const payload = this.planItems.map(item => {
      // FIX DATE FORMAT: Convert Date to 'YYYY-MM-DD' (Local Time)
      // PrimeNG p-calendar returns a Date object.
      // JSON.stringify() converts it to UTC (often resulting in previous day).
      // We must manually format it to local YYYY-MM-DD string.
      let formattedDate = '';
      if (item.date) {
        const d = new Date(item.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }

      return {
        ...item,
        date: formattedDate, // Send String YYYY-MM-DD
        mcType: item.machineType, // Map Frontend 'machineType' to Backend 'mcType'
        division: selectedDiv?.profitCenter || this.selectedDivisionCode, // ส่ง Profit_Center ไปเก็บ
        employeeId: empId
      };
    });

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
            title: '<span style="color:#f59e0b; font-weight:800;">Completed with Errors</span>',
            html: `<div style="background:#fffbeb; border-radius:12px; padding:1.25rem; border:1px solid #fef3c7; color:#92400e;">
              Success: <b>${res.count}</b><br>Failed: <b>${res.fail}</b><br><hr style="border:0.5px solid #fde68a; margin:10px 0;">${errorHtml}</div>`,
            icon: 'warning',
            customClass: {
              popup: 'swal-premium-popup',
              title: 'swal-premium-title',
              confirmButton: 'swal-premium-confirm'
            }
          });
        } else {
          Swal.fire({
            title: '<span style="color:#059669; font-weight:800;">Success</span>',
            text: `Saved ${res.count} records successfully!`,
            icon: 'success',
            customClass: {
              popup: 'swal-premium-popup',
              title: 'swal-premium-title',
              confirmButton: 'swal-premium-confirm swal-premium-confirm-success'
            }
          });
          this.planItems = []; // เคลียร์ตารางหลังบันทึก
        }
      },
      error: (err) => {
        console.error('Save Error:', err);
        Swal.fire({
          title: '<span style="color:#ef4444; font-weight:800;">Error</span>',
          text: 'Failed to save data. Please try again.',
          icon: 'error',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title',
            confirmButton: 'swal-premium-confirm'
          }
        });
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