import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { PurchaseHistoryservice } from '../../../core/services/PurchaseHistory.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx'
import * as ExcelJS from 'exceljs';
import * as fs from 'file-saver';


@Component({
  selector: 'app-history-request',
  standalone: true,
  imports: [SidebarPurchaseComponent, RouterOutlet, NotificationComponent, CommonModule, FormsModule, NgSelectModule],
  templateUrl: './history-request.component.html',
  styleUrls: ['./history-request.component.scss']
})
export class HistoryRequestComponent implements OnInit {
  userRole: string = 'view';
  requests: any[] = [];
  filteredRequests: any[] = [];
  editingIndex: { [key: string]: number } = {};
  statussList: { label: string, value: string }[] = [];
  divisionList = [
    { label: '7122', value: '7122' },
    { label: '7122', value: '7122' }
  ];

  PartNoList: any[] = [];
  ItemNoList: any[] = [];
  SpecList: any[] = [];
  ProcessList: any[] = [];
  ReqDateList: any[] = [];
  DueDateList: any[] = [];
  DateCompleteList: any[] = [];
  CaseList: any[] = [];
  DocumentNoList: any[] = []; // ✅ สำหรับ dropdown Document_No


  Division_: string | null = null;
  PartNo_: string | null = null;
  ItemNo_: string | null = null;
  Spec_: string | null = null;
  Process_: string | null = null;
  DateComplete_: string | null = null;
  ReqDate_: string | null = null;
  DueDate_: string | null = null;
  Case_: string | null = null;
  DocumentNo_: string | null = null; // ✅ สำหรับเก็บค่าที่เลือก


  selectAllCheck: boolean = false;

  fromDate: string = '';
  toDate: string = '';
  Status_: string | null = 'Complete'; // ตั้งค่าเริ่มต้นเป็น Complete
  sortOrder: 'asc' | 'desc' = 'asc';

  sortKey: string = '';   // คอลัมน์ที่ sort
  sortAsc: boolean = true; // true = ASC, false = DESC



  constructor(private purchasehistory: PurchaseHistoryservice,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object

  ) { }

  isViewer(): boolean {
    return this.authService.isViewer();
  }


  applyHighlightForSelection() {
    setTimeout(() => {
      this.requests.forEach((item, index) => {
        if (item.Selection) {
          const row = document.querySelector(`tr[data-index="${index}"]`);
          if (row) {
            row.querySelectorAll('td').forEach(td => {
              // td.style.backgroundColor = '#b6f0b6'; // สีที่ใช้ highlight
            });
          }
        }
      });
    }, 0); // ใช้ setTimeout เพื่อให้ DOM render เสร็จก่อนทำงาน
  }

  ngOnInit() {
    this.loadPurchaseHistory();

    // โหลดสถานะ Selection จาก localStorage ถ้ามี
    if (isPlatformBrowser(this.platformId)) {
      const storedRequests = localStorage.getItem('purchaseRequest');
      if (storedRequests) {
        const savedRequests = JSON.parse(storedRequests);
        this.requests.forEach(req => {
          const saved = savedRequests.find((r: any) => r.ID_Request === req.ID_Request);
          if (saved) {
            req.Selection = saved.Selection;
          }
        });
      }
    }
    this.applyHighlightForSelection();
  }

  toggleAllCheckboxes() {
    this.requests.forEach(item => item.Selection = this.selectAllCheck);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('purchaseRequest', JSON.stringify(this.requests));
    }
    this.applyHighlightForSelection();
  }

  onCheckboxChange(item: any, index: number) {
    item.Selection = !item.Selection;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('purchaseRequest', JSON.stringify(this.requests));
    }
    this.applyHighlightForSelection();
  }


  loadPurchaseHistory() {
    console.log('--- loadPurchaseHistory เริ่มต้น ---');
    this.purchasehistory.Purchase_History().subscribe({
      next: (response: any[]) => {
        console.log('Raw response from API:', response);

        // แทนค่า null/undefined ด้วยค่า default
        this.requests = response.map(item => ({
          ...item,
          PartNo: (item.PartNo ?? '').substring(0, 11),
          Status: item.Status ?? '',
          DateRequest: item.DateRequest ?? item.DueDate ?? '',
          ItemNo: item.ItemNo ?? '',
          MFG_Order_No: (item.MFG_Order_No ?? '').substring(0, 11),
          Document_No: item.Document_No ?? '',
          Stock_Location: item.Stock_Location ?? '',
          QTY: item.QTY ?? 0,
          MCType: item.MCType ?? '',
          MC_Code: item.MC_Code ?? '',
          MC_No: item.MC_No ?? '',
          DueDate: item.DueDate ?? '',
          DateTime_Record: item.DateTime_Record ?? ''
        }));


        // กรองเฉพาะ Status = 'Complete'
        this.filteredRequests = this.requests.filter(r => r.Status === 'Complete' || r.Status === 'CompleteToExcel');
        console.log('Filtered requests after Status=Complete:', this.filteredRequests);

        const uniqueDivisions = [...new Set(this.requests.map(r => r.Division).filter(c => c))];
        this.divisionList = uniqueDivisions.map(d => ({ label: d, value: d }));



        // กรองเฉพาะ Status = Complete / CompleteToExcel
        const completeRequests = this.requests.filter(r => {
          const status = (r.Status ?? '').toLowerCase().trim();
          return status === 'complete' || status === 'completetoexcel';
        });

        // ItemNo
        const uniqueItemNos = [...new Set(completeRequests.map(r => r.ItemNo).filter(c => c))];
        this.ItemNoList = uniqueItemNos.map(d => ({ label: d, value: d }));

        // PartNo / MFG Order No
        const uniquePartNos = [...new Set(completeRequests.map(r => r.PartNo).filter(c => c))];
        this.PartNoList = uniquePartNos.map(d => ({ label: d, value: d }));

        // ✅ Document_No
        const uniqueDocNos = [...new Set(completeRequests.map(r => r.DocNo).filter(c => c))];
        this.DocumentNoList = uniqueDocNos.map(d => ({ label: d, value: d }));

        // Spec
        const uniqueSpecs = [...new Set(completeRequests.map(r => r.SPEC).filter(c => c))];
        this.SpecList = uniqueSpecs.map(d => ({ label: d, value: d }));

        // // Process / Transaction
        // const uniqueProcesses = [...new Set(this.requests.map(r => r.Process).filter(c => c))];
        // this.ProcessList = uniqueProcesses.map(d => ({ label: d, value: d }));

        console.log('Filtered requests after sortByDueDate:', this.filteredRequests);

        this.applyHighlightForSelection(); // เรียก highlight หลังโหลดข้อมูลเสร็จ
      },
      error: e => console.error('Error from API:', e)
    });
  }
  // getStatusClass(Status: string): string {
  //   const s = Status?.toLowerCase().trim();

  //   if (s === 'complete') return 'bg-white';          // สีขาว
  //   if (s === 'completetoexcel') return 'bg-complete'; // สีเขียว

  //   return '';
  // }

  // formatMC(item: any): string {
  //   const mcNo = item.MCNo ? item.MCNo.toString().padStart(3, '0') : '000';
  //   return `${item.MC_Code}${mcNo}`;
  // }

  formatMC(item: any): string {
    let mcNoStr = item.MCNo ? item.MCNo.toString().replace(/\s+/g, '') : '000';
    const mcNoParts = [mcNoStr.replace(/[^a-zA-Z0-9]/g, '')];
    const firstPart = mcNoParts[0];
    const firstThreeDigits = firstPart.slice(0, 3).padEnd(3, '0');

    const mcCode = item.MC_Code ? item.MC_Code.toString() : '';

    return `${mcCode}${firstThreeDigits}`;
  }
  // formatMC(item: any): string {
  //   let mcNoStr = item.MCNo ? item.MCNo.toString().replace(/\s+/g, '') : '000';

  //   // แยกด้วย comma
  //   const mcNoParts = [mcNoStr.replace(/[^a-zA-Z0-9]/g, '')];

  //   // เอา 3 ตัวแรกของตัวเลขตัวแรก
  //   const firstPart = mcNoParts[0];
  //   const firstThreeDigits = firstPart.slice(0, 3).padEnd(3, '0');

  //   return `${item.MC_Code}${firstThreeDigits}`;
  // }

  getRowClass(item: any): string {
    if (item.Selection) {
      return 'row-selected'; // ถ้าติ๊ก checkbox
    }
    return ''; // ปกติ
  }
  //  เรียงลำดับจาก DueDate เก่าสุด -> ล่าสุด
  onSort(key: string) {
    if (this.sortKey === key) {
      // ถ้ากดซ้ำ → สลับ ASC/DESC
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }

    this.filteredRequests.sort((a, b) => {
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';

      // ✅ เช็คถ้าเป็น Date ให้แปลงเป็น number ก่อนเปรียบเทียบ
      const isDate = key === 'ReqDate' || key === 'DueDate';
      if (isDate) {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return this.sortAsc ? dateA - dateB : dateB - dateA;
      }

      // ✅ ถ้าเป็น Number
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortAsc ? valA - valB : valB - valA;
      }

      // ✅ ถ้าเป็น String
      return this.sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }


  //   onFilter() {
  //   this.filteredRequests = this.requests.filter(item => {
  //     const dueDate = item.DueDate ? new Date(item.DueDate) : null;
  //     const requestDate = item.DateRequest ? new Date(item.DateRequest) : null;
  //     const from = this.fromDate ? new Date(this.fromDate) : null;
  //     const to = this.toDate ? new Date(this.toDate) : null;

  //     // ตรวจสอบช่วงวันที่ สำหรับ DueDate หรือ DateRequest
  //     const matchDate = (!from || (dueDate && dueDate >= from) || (requestDate && requestDate >= from))
  //                    && (!to   || (dueDate && dueDate <= to)   || (requestDate && requestDate <= to));

  //     // ตรวจสอบ Division
  //     const matchDivision = !this.Division_ || item.Division === this.Division_;

  //     return matchDate && matchDivision;
  //   });
  // }
  // onFilter() {
  //   this.filteredRequests = this.requests.filter(item => {
  //     const matchDivision = !this.Division_ || item.Division === this.Division_;
  //     const matchItemNo = !this.ItemNo_ || item.ItemNo === this.ItemNo_;
  //     const matchPartNo = !this.PartNo_ || item.PartNo === this.PartNo_;
  //     const matchProcess = !this.Process_ || item.Process === this.Process_;

  //     const matchFromDate = !this.fromDate || new Date(item.Date) >= new Date(this.fromDate);
  //     const matchToDate = !this.toDate || new Date(item.Date) <= new Date(this.toDate);

  //     return matchDivision && matchItemNo && matchPartNo && matchProcess && matchFromDate && matchToDate;
  //   });
  // }

  onFilter() {
    this.filteredRequests = this.requests.filter(item => {
      //  กรอง Status
      const status = (item.Status ?? '').toLowerCase().trim();
      const matchStatus = status === 'complete' || status === 'completetoexcel';

      //  กรอง Division / PartNo / ItemNo
      const matchDivision = !this.Division_?.length || this.Division_.includes(item.Division);
      const matchItemNo = !this.ItemNo_?.length || this.ItemNo_.includes(item.ItemNo);
      const matchPartNo = !this.PartNo_?.length || this.PartNo_.includes(item.PartNo);
      const matchDocumentNo = !this.DocumentNo_?.length || this.DocumentNo_.includes(item.DocNo);


      //  แปลง input เป็น Date object
      const fromDateObj = this.fromDate ? new Date(this.fromDate) : null;
      const toDateObj = this.toDate ? new Date(this.toDate) : null;

      //  แปลงข้อมูลจากตารางเป็น Date
      const requestDate = item.DateTime_Record ? new Date(item.DateTime_Record) : null;
      const dueDate = item.DueDate ? new Date(item.DueDate) : null;

      let matchDate: boolean = true;

      if (fromDateObj && toDateObj) {
        // ✅ ต้องตรงทั้ง ReqDate และ DueDate เท่านั้น (ไม่เอาวันระหว่าง)
        matchDate = !!(
          requestDate &&
          dueDate &&
          requestDate.toDateString() === fromDateObj.toDateString() &&
          dueDate.toDateString() === toDateObj.toDateString()
        );
      } else if (fromDateObj) {
        matchDate = !!(requestDate && requestDate.toDateString() === fromDateObj.toDateString());
      } else if (toDateObj) {
        matchDate = !!(dueDate && dueDate.toDateString() === toDateObj.toDateString());
      }
      return matchStatus && matchDivision && matchItemNo && matchPartNo && matchDocumentNo && matchDate;
    });
  }

  clearFilters() {
    // เคลียร์ dropdown
    this.Division_ = '';
    this.PartNo_ = '';
    this.ItemNo_ = '';
    this.Spec_ = '';
    this.Process_ = '';
    this.Case_ = '';
    this.DocumentNo_ = '';

    // เคลียร์วันที่
    this.fromDate = '';
    this.toDate = '';

    // ถ้าอยากรีเฟรชตารางหลังเคลียร์
    this.onFilter();
  }

  // onFilter() {
  //   this.filteredRequests = this.requests.filter(item => {
  //     const itemDate = new Date(item.DateRequest || item.DueDate);

  //     const matchDate =
  //       (!this.fromDate || itemDate >= new Date(this.fromDate)) &&
  //       (!this.toDate || itemDate <= new Date(this.toDate));


  //     const matchDivision =
  //       !this.Division_ || item.Division === this.Division_;

  //     return matchDate && matchDivision;
  //   });
  // }

  // เริ่มแก้ไขแถว
  startEdit(id: string, index: number) {
    this.editingIndex[id] = index;
  }

  saveEdit(item: any) {
    const index = this.editingIndex[item.ID_Request];
    if (index !== undefined) {
      // อัปเดต filteredRequests
      this.filteredRequests[index].QTY = item.QTY;

      // อัปเดต requests ตาม ID ให้ตรงกับ filteredRequests
      const reqIndex = this.requests.findIndex(r => r.ID_Request === item.ID_Request);
      if (reqIndex !== -1) {
        this.requests[reqIndex].QTY = item.QTY;
      }

      // บันทึกกลับ localStorage (หรือเรียก API)
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('purchaseRequest', JSON.stringify(this.requests));
      }

      // ลบค่า editingIndex
      delete this.editingIndex[item.ID_Request];

      Swal.fire({ icon: 'success', title: 'Updated!', text: 'QTY updated successfully.' });
    }
  }

  cancelEdit(item: any) {
    // ถ้าอยากให้ input คืนค่าเดิมจาก requests
    const req = this.requests.find(r => r.ID_Request === item.ID_Request);
    if (req && this.editingIndex[item.ID_Request] !== undefined) {
      this.filteredRequests[this.editingIndex[item.ID_Request]].QTY = req.QTY;
    }
    delete this.editingIndex[item.ID_Request];
  }


  fileName = "ExcelSheet.xlsx";

  // exportexcel() {
  //   const table = document.getElementById("table-data") as HTMLTableElement;

  //   // แยก thead กับ tbody
  //   const thead = table.querySelector("thead");
  //   const tbody = table.querySelector("tbody");

  //   // เลือกเฉพาะ row ที่ checkbox ถูกติ๊กจาก tbody
  //   const selectedRows = Array.from(tbody?.querySelectorAll("tr") || [])
  //     .filter(row => {
  //     const checkbox = row.querySelector<HTMLInputElement>('input[type="checkbox"]');
  //     return checkbox?.checked;
  //     });

  //   if (selectedRows.length === 0) {
  //     Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please select at least one item to complete.' });
  //     return;
  //   }

  //   // สร้าง table ชั่วคราว
  //   const tempTable = document.createElement("table");

  //   // ใส่ thead เสมอ

  //    if (thead) {
  //     const clonedThead = thead.cloneNode(true) as HTMLElement;
  //     clonedThead.querySelectorAll("th").forEach((th, index) => {
  //       if (["0", "1","10", "13", "14", "15"].includes(index.toString())) { 
  //         // 0 = checkbox, 12 = DueDate, 13 = RequestDate (ปรับ index ตามจริงใน table ของคุณ)
  //         th.remove();
  //       }
  //     });
  //     tempTable.appendChild(clonedThead);
  //   }

  //   // if (thead) {
  //   //   tempTable.appendChild(thead.cloneNode(true));
  //   // }

  //   // ใส่เฉพาะ row ที่เลือก
  //   // selectedRows.forEach(row => tempTable.appendChild(row.cloneNode(true)));
  //   selectedRows.forEach(row => {
  //     const clonedRow = row.cloneNode(true) as HTMLElement;
  //     clonedRow.querySelectorAll("td").forEach((td, index) => {
  //       if (["0", "1", "10", "13", "14", "15"].includes(index.toString())) { 
  //         td.remove();
  //       }
  //     });
  //     tempTable.appendChild(clonedRow);
  //   });

  //   // แปลง table เป็น worksheet แล้ว export
  //   const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tempTable);
  //   const wb: XLSX.WorkBook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  //   XLSX.writeFile(wb, this.fileName);

  //     // highlight บนหน้าเว็บด้วย
  //   selectedRows.forEach(row => {
  //     row.querySelectorAll("td").forEach(td => td.style.backgroundColor = '#b6f0b6');
  //   });
  // }

  exportexcel() {
    // 1. ดึงเฉพาะแถวที่ checkbox = true
    const selectedRequests = this.requests.filter(req => req.Selection);

    if (selectedRequests.length === 0) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please select at least one item to complete.' });
      return;
    }

    // 2. สร้าง Workbook และ Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 3. กำหนด Header และ Key (ลำดับคอลัมน์)
    worksheet.columns = [
      { header: 'DIVISION', key: 'DIVISION', width: 15 },
      { header: 'ITEM NO.', key: 'ITEM_NO', width: 20 },
      { header: 'MFG ORDER NO.', key: 'MFG_ORDER_NO', width: 25 },
      { header: 'DOCUMENT NO.', key: 'DOCUMENT_NO', width: 20 },
      { header: 'Stock Location', key: 'Stock_Location', width: 18 },
      { header: 'MATL LOT', key: 'MATL_LOT', width: 15 },
      { header: 'TRANSACTION(YMD)', key: 'TRANSACTION', width: 18 },
      { header: 'QTY', key: 'QTY', width: 10 },
      { header: 'MC No.', key: 'MC_No', width: 15 },
      { header: 'DECLATION NO', key: 'DECLATION_NO', width: 20 },
    ];

    // 4. จัดรูปแบบ Header (ตัวหนา, จัดกลาง, พื้นหลังสีเหลือง)
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' } // Yellow color
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 5. เตรียมข้อมูล
    const cDateFormat = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}${mm}${dd}`;
    };

    const dataRows = selectedRequests.map(req => ({
      DIVISION: req.Division || '',
      ITEM_NO: req.ItemNo || '',
      MFG_ORDER_NO: req.PartNo || '', // MFG_Order_No in friend's logic seems map to PartNo or MFG_Order_No
      DOCUMENT_NO: req.DocNo || '',
      Stock_Location: req.Stock_Location || '',
      MATL_LOT: '',
      TRANSACTION: cDateFormat(req.DateComplete),
      QTY: req.QTY || 0,
      MC_No: this.formatMC(req),
      DECLATION_NO: ''
    }));

    // 6. เพิ่มข้อมูลลงใน Worksheet
    worksheet.addRows(dataRows);

    // 7. ตั้งค่า AutoFilter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 10 } // จำนวนคอลัมน์ทั้งหมด
    };

    // 8. สร้างไฟล์และดาวน์โหลด
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, this.fileName);
    });
  }

  // // highlight บนหน้าเว็บ
  // selectedRows.forEach(row => {
  //   row.querySelectorAll("td").forEach(td => td.style.backgroundColor = '#b6f0b6');
  // });

  exportas400() {
    const table = document.getElementById("table-data") as HTMLTableElement;
    if (!table) return;

    const tbody = table.querySelector("tbody");

    // เอาเฉพาะ row ที่ถูกเลือก (checkbox checked)
    const selectedRows = Array.from(tbody?.querySelectorAll("tr") || [])
      .filter(row => {
        const checkbox = row.querySelector<HTMLInputElement>('input[type="checkbox"]');
        return checkbox?.checked;
      });

    if (selectedRows.length === 0) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please select at least one item.' });
      return;
    }

    // เปลี่ยน status ของ request ที่เลือก
    selectedRows.forEach(row => {
      const indexAttr = row.getAttribute("data-index");
      if (indexAttr) {
        const index = parseInt(indexAttr, 10);
        if (!isNaN(index) && this.filteredRequests[index]) {
          this.filteredRequests[index].Status = "CompleteAS400";
        }
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('purchaseRequest', JSON.stringify(this.requests));
    }

    Swal.fire({ icon: 'success', title: 'Export AS400 Success!', text: 'Selected requests marked as CompleteAS400.' });
  }
}