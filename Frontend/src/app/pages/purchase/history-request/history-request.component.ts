import { Component, OnInit } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { PurchaseHistoryservice } from '../../../core/services/PurchaseHistory.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import Swal from 'sweetalert2';
import * as XLSX from 'xlsx'


@Component({
  selector: 'app-history-request',
  standalone: true,
  imports: [SidebarPurchaseComponent, RouterOutlet, NotificationComponent, CommonModule, FormsModule, NgSelectModule],
  templateUrl: './history-request.component.html',
  styleUrls: ['./history-request.component.scss']
})
export class HistoryRequestComponent implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];
  statussList: { label: string, value: string }[] = [];
  divisionList = [
  { label: 'GM', value: '7122' },
  { label: 'PMC', value: '71DZ' }
];
  Division_: string | null = null;

  selectAllCheck: boolean = false;

  fromDate: string = '';
  toDate: string = '';
  Status_: string | null = 'Complete'; // ตั้งค่าเริ่มต้นเป็น Complete


  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private purchasehistory: PurchaseHistoryservice) {}

  ngOnInit() {
    this.loadPurchaseHistory();
  }

toggleAllCheckboxes() {
    this.requests.forEach(item => item.Selection = this.selectAllCheck);
    localStorage.setItem('purchaseRequest', JSON.stringify(this.requests));
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
      this.filteredRequests = this.requests.filter(r => r.Status === 'Complete');
      console.log('Filtered requests after Status=Complete:', this.filteredRequests);

      const uniqueDivisions = [...new Set(this.requests.map(r => r.Division).filter(c => c))];
      this.divisionList = uniqueDivisions.map(d => ({ label: d, value: d }));

      console.log('Filtered requests after sortByDueDate:', this.filteredRequests);
    },
    error: e => console.error('Error from API:', e)
  });
}

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
  onSort() {
    this.filteredRequests.sort((a, b) => {
      const dateA = new Date(a.DateComplete).getTime();
      const dateB = new Date(b.DateComplete).getTime();
      return dateA - dateB; // เรียงจากเก่า -> ใหม่
    });
  }
onFilter() {
  this.filteredRequests = this.requests.filter(item => {
    const itemDate = new Date(item.DateRequest || item.DueDate);

    const matchDate =
      (!this.fromDate || itemDate >= new Date(this.fromDate)) &&
      (!this.toDate || itemDate <= new Date(this.toDate));


    const matchDivision =
      !this.Division_ || item.Division === this.Division_;

    return matchDate && matchDivision;
  });
}


fileName = "ExcelSheet.xlsx";

exportexcel() {
  const table = document.getElementById("table-data") as HTMLTableElement;

  // แยก thead กับ tbody
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  // เลือกเฉพาะ row ที่ checkbox ถูกติ๊กจาก tbody
  const selectedRows = Array.from(tbody?.querySelectorAll("tr") || [])
    .filter(row => {
    const checkbox = row.querySelector<HTMLInputElement>('input[type="checkbox"]');
    return checkbox?.checked;
    });

  if (selectedRows.length === 0) {
    Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please select at least one item to complete.' });
    return;
  }

  // สร้าง table ชั่วคราว
  const tempTable = document.createElement("table");

  // ใส่ thead เสมอ

   if (thead) {
    const clonedThead = thead.cloneNode(true) as HTMLElement;
    clonedThead.querySelectorAll("th").forEach((th, index) => {
      if (["0", "1","2","3","10", "13", "14"].includes(index.toString())) { 
        // 0 = checkbox, 12 = DueDate, 13 = RequestDate (ปรับ index ตามจริงใน table ของคุณ)
        th.remove();
      }
    });
    tempTable.appendChild(clonedThead);
  }

  // if (thead) {
  //   tempTable.appendChild(thead.cloneNode(true));
  // }

  // ใส่เฉพาะ row ที่เลือก
  // selectedRows.forEach(row => tempTable.appendChild(row.cloneNode(true)));
  selectedRows.forEach(row => {
    const clonedRow = row.cloneNode(true) as HTMLElement;
    clonedRow.querySelectorAll("td").forEach((td, index) => {
      if (["0", "1", "2", "3", "10", "13", "14"].includes(index.toString())) { 
        td.remove();
      }
    });
    tempTable.appendChild(clonedRow);
  });

  // แปลง table เป็น worksheet แล้ว export
  const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tempTable);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, this.fileName);
}

  showSuccessAlert() {
    Swal.fire({
      title: 'Export To AS400?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      customClass: { confirmButton: 'btn btn-success me-3', cancelButton: 'btn btn-danger' },
      buttonsStyling: false
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Export AS400 Success!', icon: 'success' });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({ title: 'Cancelled', icon: 'error' });
      }
    });
  }
}
