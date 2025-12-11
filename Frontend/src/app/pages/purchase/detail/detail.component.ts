import { Component, OnInit } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';
import { FileReadService } from '../../../core/services/FileRead.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx'


@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [
    SidebarPurchaseComponent,
    CommonModule,
    FormsModule,
    RouterOutlet,
    NotificationComponent,
    NgSelectModule
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  userRole: string = 'view'; // เก็บ role ผู้ใช้ (viewer, admin ฯลฯ)

  allRequests: any[] = []; // เก็บข้อมูลทั้งหมดจาก backend
  filteredRequests: any[] = []; // เก็บข้อมูลที่ถูก filter
  request: any[] = []; // เก็บข้อมูลที่แสดงในตาราง
  
  // ตัวแปรสำหรับกรองตามวันที่
  dateFilterType: 'both' | 'req' | 'due' = 'both'; // ประเภทการกรองวันที่
  fromDate: string = '';
  toDate: string = '';

  // dropdown division
  divisionList = [
    { label: 'GM', value: '7122' },
    { label: 'PMC', value: '71DZ' }
  ];

   // dropdown filter list
  PartNoList: any[] = [];
  ItemNoList: any[] = [];
  SpecList: any[] = [];
  ProcessList: any[] = [];
  ReqDateList: any[] = [];
  DueDateList: any[] = [];
  CaseList: any[] = [];
  DocumentNoList: any[] = [];   // เก็บ list สำหรับ dropdown

  // ตัวกรองที่เลือก
  Division_: string | null = null;
  PartNo_: string | null = null;
  ItemNo_: string | null = null;
  Spec_: string | null = null;
  Process_: string | null = null;
  ReqDate_: string | null = null;
  DueDate_: string | null = null;
  Case_: string | null = null;
  DocumentNo_: string | null = null; // ค่าที่เลือก

  // เก็บข้อมูล ItemNo และ SPEC
  PartNo: any[] = [];
  ItemNo: any[] = [];
  SPEC: any[] = [];

  // การ sort ตาราง
  sortKey: string = '';   // คอลัมน์ที่ sort
  sortAsc: boolean = true; // true = ASC, false = DESC

  // การ sort ตาราง
  editingIndex: { [key: string]: number | null } = {};
  newRequestData: any = {};
  selectAllChecked = false;

  itemNo!: string; // รับค่าจาก param route
  displayIndex!: number;
  items: any[] = [];
  highlightedRow: number | null = null;

  // สำหรับ filter เอกสาร
  showDocumentFilter = false;
  searchDocText = '';
  allDocsSelected = false;

 // getter คืนค่า documentItems
  get documentItems() {
    return this.request.map(it => ({
      DocNo: it.DocNo,
      selected: it.Selection || false
    }));
  }

  // filter เอกสารตาม search
  filteredDocuments() {
    return this.documentItems.filter(doc =>
      doc.DocNo?.toLowerCase().includes(this.searchDocText.toLowerCase())
    );
  }

  toggleDocumentFilter() {
    this.showDocumentFilter = !this.showDocumentFilter;
  }

  //  เลือก/ยกเลิกเลือก document ทั้งหมด
  toggleAllDocuments(event: any) {
    this.allDocsSelected = event.target.checked;
    this.request.forEach(r => r.Selection = this.allDocsSelected);
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
  }

   // เปลี่ยนสถานะ checkbox ของเอกสาร
  onDocumentCheckboxChange(doc: any) {
    const item = this.request.find(r => r.DocNo === doc.DocNo);
    if (item) item.Selection = doc.selected;
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
  }

  // services
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private DetailPurchase: DetailPurchaseRequestlistService,
    private FileReadService: FileReadService,
    private authService: AuthService
  ) {}

  isViewer(): boolean {
    return this.authService.isViewer();
  }

  ngOnInit() {

    // อ่านค่า param จาก route
    this.route.paramMap.subscribe(p => {
      this.itemNo = p.get('itemNo') || '';
    });

    // โหลดข้อมูลจาก backend
    this.Detail_Purchase();
    this.get_ItemNo();

    // โหลดค่า QTY จาก localStorage ถ้ามี
const savedRequests = localStorage.getItem('purchaseRequest');
if (savedRequests) {
  const parsed = JSON.parse(savedRequests);
  if (Array.isArray(parsed)) {
    this.request = parsed.map(r => ({
      ...r,
      QTY: r.QTY ?? r.Req_QTY
    }));
  }
}
  }

  //  ดึงข้อมูล request ทั้งหมด จาก backend ฝังในตัวแปร allRequests และ request (แสดงในตาราง)
  Detail_Purchase() {
    this.DetailPurchase.Detail_Request().subscribe({
      next: (response: any[]) => {
        if (!Array.isArray(response)) {
          this.allRequests = [];
          this.request = [];
          return;
          
        }

        // แปลงค่าให้แน่ใจว่า ID_Request เป็น number
        const mapped = response.map(it => ({
          ...it,
          ID_Request: Number(it.ID_Request),
          Selection: false,
          QTY: it.QTY ?? it.Req_QTY,
          ACCOUNT: it.ACCOUNT ?? it.account
        }));

        // ลบ duplicate ID_Request
        const seen = new Set<number>();
        const unique = mapped.filter(it => {
          const id = Number(it.ID_Request);
          if (!Number.isFinite(id)) return true;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        this.allRequests = unique;
        this.request = [...unique];

        // ทำ list สำหรับ filter
        this.SpecList = Array.from(new Set(this.allRequests.map(x => x.SPEC)))
          .map(x => ({ label: x, value: x }));
        this.ProcessList = Array.from(new Set(this.allRequests.map(x => x.Process)))
          .map(x => ({ label: x, value: x }));
        this.CaseList = Array.from(new Set(this.allRequests.map(x => x.CASE)))
          .map(x => ({ label: x, value: x }));
        this.PartNoList = Array.from(new Set(this.allRequests.map(x => x.PartNo)))
          .map(x => ({ label: x, value: x }));
        this.ItemNoList = Array.from(new Set(this.allRequests.map(x => x.ItemNo)))
          .map(x => ({ label: x, value: x }));
        this.DocumentNoList = Array.from(new Set(this.allRequests.map(x => x.DocNo)))
          .map(x => ({ label: x, value: x }));
      },
      error: e => console.error('❌ Error Detail_Purchase:', e)
    });
  }

  // ดึง ItemNo จาก backend มาเก็บในตัวแปร ItemNo (ใช้แสดงใน dropdown)
  // get_ItemNo() {
  //   this.DetailPurchase.get_ItemNo().subscribe({
  //     next: (response: any[]) => {
  //       this.ItemNo = response.filter((item, index, self) =>
  //         index === self.findIndex(obj => obj.ItemNo === item.ItemNo)
  //       );
  //       console.log('ItemNo list:', this.ItemNo); // ดูว่ามี ACCOUNT หรือไม่
  //     },
  //     error: (e: any) => console.error("Error API get_ItemNo:", e),
  //   });
  // }

  get_ItemNo() {
  this.DetailPurchase.get_ItemNo().subscribe({
    next: (response: any[]) => {
      this.ItemNo = response.map(item => ({
        ...item,
        ACCOUNT: item.ACCOUNT ?? item.account ?? ''  // ป้องกันชื่อ field ผิด
      })).filter((item, index, self) =>
        index === self.findIndex(obj => obj.ItemNo === item.ItemNo)
      );
      console.log('ItemNo list:', this.ItemNo); 
    },
    error: (e: any) => console.error("Error API get_ItemNo:", e),
  });
}
   // เมื่อเปลี่ยน ItemNo ในตาราง ให้ดึง SPEC และ ON_HAND มาแสดง
  onItemNoChange(selectedItemNo: string, row: any) {
  const selected = this.ItemNo.find(x => x.ItemNo === selectedItemNo);
  if (selected) {
    row.SPEC = selected.SPEC;
    row.ON_HAND = selected.ON_HAND;
    row.QTY = row.QTY ?? row.Req_QTY ?? 0;
  }
}
  // 🔹 ฟังก์ชันเก็บค่า QTY ทุกครั้งที่เปลี่ยน
  onQtyChange(row: any) {
    const index = this.request.findIndex(r => r.ID_Request === row.ID_Request);
    if (index > -1) {
      this.request[index].QTY = row.QTY;
    }
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
  }

  // เลือก/ยกเลิกเลือก checkbox ทั้งหมด
  toggleAllCheckboxes() { 
    this.request.forEach(item => item.Selection = this.selectAllChecked);
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
  }

  // เพิ่มแถวใหม่ด้านล่างแถวที่เลือก
  addNewRequest(newRequestData: any, rowIndex: number) {
    this.DetailPurchase.insertRequest(newRequestData).subscribe({
      next: res => {
        if (!res.ID_Request) { alert('Backend ไม่ส่งข้อมูลกลับมา'); return; }

        const newRow = {
          ...newRequestData,
          ...res,
          ID_Request: Number(res.ID_Request),
          Selection: false,
          isNew: true,
          QTY: newRequestData.QTY ?? newRequestData.Req_QTY,
        };

        this.request.splice(rowIndex + 1, 0, newRow);
        this.editingIndex[newRow.ID_Request] = rowIndex + 1;

        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        Swal.fire({ icon: 'success', title: 'Successfully Added Data Row', showConfirmButton: false, timer: 1330 });
      },
      error: err => { }
    });
  }

  //เริ่มแก้ไข ที่กดปุ่ม edit
  startEdit(caseKey: number, rowIndex: number) {
    this.editingIndex[caseKey] = rowIndex;
  }

  // บันทึกแก้ไข (อัปเดต backend + อัปเดตหน้า)
  saveEdit(caseKey: number, rowIndex: number) {
    const item = this.request[rowIndex];
    if (!item) return;

    this.syncSpecWithItemNo(item);
    const snapshot = { ...item };

    const mergeSafe = (original: any, resp: any) => {
      const merged = { ...original, ...(resp || {}) };
      merged.ID_Request = Number(resp?.ID_Request ?? original.ID_Request);
      if (resp?.ItemNo == null) merged.ItemNo = original.ItemNo;
      if (resp?.SPEC == null) merged.SPEC = original.SPEC;
      merged.Selection = !!original.Selection;
      merged.isNew = false;
      return merged;
    };

    const hasId = Number.isInteger(Number(item.ID_Request));

    if (!hasId) {
      this.DetailPurchase.insertRequest(item).subscribe({
        next: (res) => {
          this.request[rowIndex] = mergeSafe(item, res);
          delete this.editingIndex[caseKey];
          localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          Swal.fire({ icon: 'success', title: 'Your work has been saved', showConfirmButton: false, timer: 1330 });
        },
        error: (err) => {
          this.request[rowIndex] = snapshot;
          alert('เกิดข้อผิดพลาดในการบันทึกแถวใหม่');
        }
      });
    } else {
      this.DetailPurchase.updateRequest(item).subscribe({
        next: (res) => {
          this.request[rowIndex] = mergeSafe(item, res);
          delete this.editingIndex[caseKey];
          localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          Swal.fire({ icon: 'success', title: 'Your work has been saved', showConfirmButton: false, timer: 1330 });
        },
        error: (err) => {
          this.request[rowIndex] = snapshot;
          alert('เกิดข้อผิดพลาดในการบันทึกแถว');
        }
      });
    }
  }

syncSpecWithItemNo(row: any) {
  if (!row) return;
  const list = this.ItemNo || [];
  const found = list.find((x: any) => (typeof x === 'string' ? x : x?.ItemNo) === row.ItemNo);
  if (found && typeof found !== 'string') {
    const spec = (found as any).SPEC;
    if (typeof spec !== 'undefined' && spec !== null) {
      row.SPEC = String(spec);
    }

  }
}

  deleteRow(rowIndex: number) {
    const item = this.request[rowIndex];
    if (!item) return;

    if (item.isNew) {
      this.request.splice(rowIndex, 1);
      delete this.editingIndex[item.ID_Request];
      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
      alert('ลบแถวเรียบร้อย');
    } else {
      this.DetailPurchase.deleteRequest(item.ID_Request).subscribe({
        next: () => {
          this.request.splice(rowIndex, 1);
          delete this.editingIndex[item.ID_Request];
          localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          alert('ลบข้อมูลสำเร็จ');
        },
        error: err => { alert('ไม่สามารถลบข้อมูลได้'); }
      });
    }
  }

  isCompleting = false;

completeSelected() {
  if (this.isCompleting) return;

  const selectedItems = (this.request || [])
    .filter(it => it?.Selection === true && it?.Status === 'Waiting');

  if (selectedItems.length === 0) {
    Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please select at least one item to complete.' });
    return;
  }

  // กำหนดค่า QTY ให้กับ items ที่ว่าง
  selectedItems.forEach(it => {
    if (it.QTY == null || it.QTY === '') it.QTY = it.Req_QTY ?? 0;
  });

  const invalidItems = selectedItems.filter(it => it.QTY == null || it.QTY === '');
  if (invalidItems.length > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Incomplete data',
      text: `Please fill QTY for ${invalidItems.length} selected items before completing.`
    });
    return;
  }

  const ids: number[] = selectedItems.map(it => Number(it.ID_Request)).filter(Number.isInteger);

  this.isCompleting = true;

  // 1️⃣ อัปเดต QTY แต่ละ item ก่อน
  const updateQtyObservables = selectedItems.map(it =>
    this.DetailPurchase.updateRequest(it) // updateRequest() อัปเดต QTY แถวเดียว
  );

  // ใช้ forkJoin เพื่อรอทุก request
  forkJoin(updateQtyObservables).subscribe({
    next: () => {
      // 2️⃣ อัปเดต status เป็น Complete
      this.DetailPurchase.updateStatusToComplete(ids, 'Complete').subscribe({
        next: () => {
          const idSet = new Set(ids);
          this.request = this.request.map(r =>
            idSet.has(Number(r.ID_Request))
              ? { ...r, Status: 'Complete', Selection: false }
              : r
          );
          localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          this.Detail_Purchase(); // โหลดข้อมูลใหม่
          Swal.fire({ icon: 'success', title: 'Complete!', text: `Updated ${ids.length} items.` });
        },
        error: err => Swal.fire({ icon: 'error', title: 'Bulk update failed', text: err?.error?.message || '' }),
        complete: () => { this.isCompleting = false; }
      });
    },
    error: err => {
      Swal.fire({ icon: 'error', title: 'Update QTY failed', text: err?.error?.message || '' });
      this.isCompleting = false;
    }
  });
}

  openPdfFromPath(filePath: string) {
    if (!filePath) { alert('ไม่พบ path ของไฟล์'); return; }

    const cleanPath = filePath.replace(/^"|"$/g, '');
    this.FileReadService.loadPdfFromPath(cleanPath).subscribe({
      next: res => {
        const base64 = res.imageData.split(',')[1];
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      },
      error: err => { alert('ไม่สามารถโหลด PDF ได้'); }
    });
  }

fileName = "ExcelSheet.xlsx";

exportexcel() {
  const table = document.getElementById("table-data") as HTMLTableElement;
  if (!table) {
    console.error("Table not found!");
    return;
  }

  // ใช้ thead ตัวที่ 2 (index 1) ซึ่งมีหัว column จริง
  const theads = table.querySelectorAll("thead");
  if (theads.length < 2) {
    console.error("Table head not found!");
    return;
  }
  const thead = theads[1];

  const tbody = table.querySelector("tbody");
  if (!tbody) {
    console.error("Table body not found!");
    return;
  }

  // เลือกเฉพาะ row ที่ checkbox ถูกติ๊ก
  const selectedRows = Array.from(tbody.querySelectorAll("tr")).filter(row => {
    const checkbox = row.querySelector<HTMLInputElement>('input[type="checkbox"]');
    return checkbox?.checked;
  });

  if (selectedRows.length === 0) {
    Swal.fire({ icon: 'warning', title: 'No rows selected', text: 'Please select at least one row to export.' });
    return;
  }

  // สร้าง table ชั่วคราวสำหรับ export
  const tempTable = document.createElement("table");

  // สร้าง thead ใหม่สำหรับ export
  const exportThead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  thead.querySelectorAll("th").forEach((th, index) => {
    // ลบ column ที่ไม่เอา เช่น checkbox, edit, delete
    if (!["0", "1", "25", "26"].includes(index.toString())) {
      const newTh = document.createElement("th");
      newTh.textContent = th.textContent?.trim() || '';
      headerRow.appendChild(newTh);
    }
  });
  exportThead.appendChild(headerRow);
  tempTable.appendChild(exportThead);

  // clone เฉพาะ row ที่เลือก
  selectedRows.forEach(row => {
    const clonedRow = document.createElement("tr");
    row.querySelectorAll("td").forEach((td, index) => {
      if (!["0", "1", "24", "25"].includes(index.toString())) {
        const newTd = document.createElement("td");
        newTd.textContent = td.textContent?.trim() || '';
        clonedRow.appendChild(newTd);
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

  deleteItem(id: string) {
    Swal.fire({
      title: 'Do you want to delete',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      customClass: { confirmButton: 'btn btn-success me-3', cancelButton: 'btn btn-danger' },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.DetailPurchase.deleteRequest(Number(id)).subscribe({
          next: () => {
            this.request = this.request.filter(item => item.ID_Request !== id);
            Swal.fire({ title: 'Delete Success!', icon: 'success' });
          },
          error: err => Swal.fire({ title: 'เกิดข้อผิดพลาดในการลบ', icon: 'error' })
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({ title: 'Cancel Delete', icon: 'info' });
      }
    });
  }

onFilter() {
  this.request = this.allRequests.filter(item => {
     //  กรอง Status
    const status = (item.Status ?? '').toLowerCase().trim();
    const matchStatus = status === 'waiting' ;

    //  กรอง Division / PartNo / ItemNo
    const matchDivision = !this.Division_?.length || this.Division_.includes(item.Division);
    const matchItemNo   = !this.ItemNo_?.length   || this.ItemNo_.includes(item.ItemNo);
    const matchPartNo   = !this.PartNo_?.length   || this.PartNo_.includes(item.PartNo);
     const matchSpec     = !this.Spec_?.length     || this.Spec_.includes(item.SPEC);
    const matchProcess  = !this.Process_?.length  || this.Process_.includes(item.Process);
    const matchCase     = !this.Case_?.length     || this.Case_.includes(item.CASE);
    const matchDocNo = !this.DocumentNo_?.length || this.DocumentNo_.includes(item.DocNo);


    //  แปลง input เป็น Date object
    const fromDateObj = this.fromDate ? new Date(this.fromDate) : null;
    const toDateObj   = this.toDate   ? new Date(this.toDate)   : null;

    //  แปลงข้อมูลจากตารางเป็น Date
    const requestDate = item.DateTime_Record ? new Date(item.DateTime_Record) : null;
    const dueDate     = item.DueDate ? new Date(item.DueDate) : null;

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

    //  return เงื่อนไขทั้งหมด
return matchStatus && matchDivision && matchPartNo && matchItemNo && matchDate && matchSpec && matchProcess && matchCase && matchDocNo;  });
}


// onSort(key: string) {
//   if (this.sortKey === key) {
//     // ถ้ากดซ้ำ → สลับ ASC/DESC
//     this.sortAsc = !this.sortAsc;
//   } else {
//     this.sortKey = key;
//     this.sortAsc = true;
//   }

//   this.request.sort((a, b) => {
//     const valA = a[key] ?? '';
//     const valB = b[key] ?? '';

//     // ✅ เช็คถ้าเป็น Date ให้แปลงเป็น number ก่อนเปรียบเทียบ
//     const isDate = key === 'ReqDate' || key === 'DueDate';
//     if (isDate) {
//       const dateA = valA ? new Date(valA).getTime() : 0;
//       const dateB = valB ? new Date(valB).getTime() : 0;
//       return this.sortAsc ? dateA - dateB : dateB - dateA;
//     }

//     // ✅ ถ้าเป็น Number
//     if (typeof valA === 'number' && typeof valB === 'number') {
//       return this.sortAsc ? valA - valB : valB - valA;
//     }

//     // ✅ ถ้าเป็น String
//     return this.sortAsc
//       ? String(valA).localeCompare(String(valB))
//       : String(valB).localeCompare(String(valA));
//   });
// }
onSort(key: string) {
  if (this.sortKey === key) {
    this.sortAsc = !this.sortAsc;
  } else {
    this.sortKey = key;
    this.sortAsc = true;
  }

  this.request.sort((a, b) => {
    let valA = a[key];
    let valB = b[key];

    // ✅ ถ้า key เป็นวันที่
    if (['ReqDate', 'DueDate', 'DateTime_Record'].includes(key)) {
      // พยายามแปลงทุกค่าเป็น timestamp number (0 ถ้าไม่มีค่า)
      const parseDate = (val: any) => {
        if (!val) return 0;
        // รองรับรูปแบบ dd/MM/yyyy และ yyyy-MM-dd
        if (typeof val === 'string') {
          const parts = val.includes('-')
            ? val.split('-') // yyyy-MM-dd
            : val.split('/'); // dd/MM/yyyy

          if (parts.length === 3) {
            if (parts[0].length === 4) {
              // yyyy-MM-dd
              return new Date(val).getTime();
            } else {
              // dd/MM/yyyy → แปลงใหม่
              const [d, m, y] = parts.map(Number);
              return new Date(y, m - 1, d).getTime();
            }
          }
        }
        // ถ้าเป็น Date object
        if (val instanceof Date) return val.getTime();

        // ถ้าไม่เข้าเคสข้างบน
        const t = new Date(val).getTime();
        return isNaN(t) ? 0 : t;
      };

      const dateA = parseDate(valA);
      const dateB = parseDate(valB);
      return this.sortAsc ? dateA - dateB : dateB - dateA;
    }

    // ✅ ถ้าเป็นตัวเลข
    if (!isNaN(valA) && !isNaN(valB)) {
      return this.sortAsc ? valA - valB : valB - valA;
    }

    // ✅ ถ้าเป็นข้อความ
    return this.sortAsc
      ? String(valA ?? '').localeCompare(String(valB ?? ''))
      : String(valB ?? '').localeCompare(String(valA ?? ''));
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
}
