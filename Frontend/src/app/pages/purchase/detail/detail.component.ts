import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule, isPlatformBrowser } from '@angular/common'; // รวม import
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';
import { FileReadService } from '../../../core/services/FileRead.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

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
  userRole: string = 'view';
  allRequests: any[] = [];
  filteredRequests: any[] = [];
  request: any[] = [];

  // ตัวแปรสำหรับกรองตามวันที่
  dateFilterType: 'both' | 'req' | 'due' = 'both';
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
  DocumentNoList: any[] = [];

  // ตัวกรองที่เลือก
  Division_: string | null = null;
  PartNo_: string | null = null;
  ItemNo_: string | null = null;
  Spec_: string | null = null;
  Process_: string | null = null;
  ReqDate_: string | null = null;
  DueDate_: string | null = null;
  Case_: string | null = null;
  DocumentNo_: string | null = null;

  // เก็บข้อมูล ItemNo และ SPEC
  PartNo: any[] = [];
  ItemNo: any[] = [];
  SPEC: any[] = [];

  // การ sort ตาราง
  sortKey: string = '';
  sortAsc: boolean = true;
  editingIndex: { [key: string]: number | null } = {};
  newRequestData: any = {};
  selectAllChecked = false;

  itemNo!: string;
  displayIndex!: number;
  items: any[] = [];
  highlightedRow: number | null = null;

  // สำหรับ filter เอกสาร
  showDocumentFilter = false;
  searchDocText = '';
  allDocsSelected = false;

  get documentItems() {
    return this.request.map(it => ({
      DocNo: it.DocNo,
      selected: it.Selection || false
    }));
  }

  filteredDocuments() {
    return this.documentItems.filter(doc =>
      doc.DocNo?.toLowerCase().includes(this.searchDocText.toLowerCase())
    );
  }

  toggleDocumentFilter() {
    this.showDocumentFilter = !this.showDocumentFilter;
  }

  toggleAllDocuments(event: any) {
    this.allDocsSelected = event.target.checked;
    this.request.forEach(r => r.Selection = this.allDocsSelected);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
    }
  }

  onDocumentCheckboxChange(doc: any) {
    const item = this.request.find(r => r.DocNo === doc.DocNo);
    if (item) item.Selection = doc.selected;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
    }
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private router: Router,
    private DetailPurchase: DetailPurchaseRequestlistService,
    private FileReadService: FileReadService,
    private authService: AuthService
  ) { }

  isViewer(): boolean {
    return this.authService.isViewer();
  }

  // ============================================
  // 🔥 จุดสำคัญที่แก้ไข: ngOnInit
  // ============================================
  ngOnInit() {
    // อ่านค่า param จาก route (ทำได้ทั้ง Server และ Browser)
    this.route.paramMap.subscribe(p => {
      this.itemNo = p.get('itemNo') || '';
    });

    // ✅ ย้ายการโหลดข้อมูลมาไว้ในนี้ เพื่อให้ทำ "เฉพาะบน Browser"
    // Server จะข้ามส่วนนี้ไป ทำให้ไม่ติด Timeout รอ API
    if (isPlatformBrowser(this.platformId)) {
      
      this.Detail_Purchase(); // โหลดข้อมูล Request
      this.get_ItemNo();      // โหลดข้อมูล ItemNo

      // โหลดค่า QTY จาก localStorage
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
  }

  Detail_Purchase() {
    this.DetailPurchase.Detail_Request().subscribe({
      next: (response: any[]) => {
        if (!Array.isArray(response)) {
          this.allRequests = [];
          this.request = [];
          return;
        }

        const mapped = response.map(it => ({
          ...it,
          ID_Request: Number(it.ID_Request),
          Selection: false,
          QTY: it.QTY ?? it.Req_QTY,
          ACCOUNT: it.ACCOUNT ?? it.account
        }));

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

        this.SpecList = Array.from(new Set(this.allRequests.map(x => x.SPEC))).map(x => ({ label: x, value: x }));
        this.ProcessList = Array.from(new Set(this.allRequests.map(x => x.Process))).map(x => ({ label: x, value: x }));
        this.CaseList = Array.from(new Set(this.allRequests.map(x => x.CASE))).map(x => ({ label: x, value: x }));
        this.PartNoList = Array.from(new Set(this.allRequests.map(x => x.PartNo))).map(x => ({ label: x, value: x }));
        this.ItemNoList = Array.from(new Set(this.allRequests.map(x => x.ItemNo))).map(x => ({ label: x, value: x }));
        this.DocumentNoList = Array.from(new Set(this.allRequests.map(x => x.DocNo))).map(x => ({ label: x, value: x }));
      },
      error: e => console.error('❌ Error Detail_Purchase:', e)
    });
  }

  get_ItemNo() {
    this.DetailPurchase.get_ItemNo().subscribe({
      next: (response: any[]) => {
        this.ItemNo = response.map(item => ({
          ...item,
          ACCOUNT: item.ACCOUNT ?? item.account ?? ''
        })).filter((item, index, self) =>
          index === self.findIndex(obj => obj.ItemNo === item.ItemNo)
        );
        console.log('ItemNo list:', this.ItemNo);
      },
      error: (e: any) => console.error("Error API get_ItemNo:", e),
    });
  }

  onItemNoChange(selectedItemNo: string, row: any) {
    const selected = this.ItemNo.find(x => x.ItemNo === selectedItemNo);
    if (selected) {
      row.SPEC = selected.SPEC;
      row.ON_HAND = selected.ON_HAND;
      row.QTY = row.QTY ?? row.Req_QTY ?? 0;
    }
  }

  onQtyChange(row: any) {
    const index = this.request.findIndex(r => r.ID_Request === row.ID_Request);
    if (index > -1) {
      this.request[index].QTY = row.QTY;
    }
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
    }
  }

  toggleAllCheckboxes() {
    this.request.forEach(item => item.Selection = this.selectAllChecked);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
    }
  }

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

        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        }
        Swal.fire({ icon: 'success', title: 'Successfully Added Data Row', showConfirmButton: false, timer: 1330 });
      },
      error: err => { }
    });
  }

  startEdit(caseKey: number, rowIndex: number) {
    this.editingIndex[caseKey] = rowIndex;
  }

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
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          }
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
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          }
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
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
      }
      alert('ลบแถวเรียบร้อย');
    } else {
      this.DetailPurchase.deleteRequest(item.ID_Request).subscribe({
        next: () => {
          this.request.splice(rowIndex, 1);
          delete this.editingIndex[item.ID_Request];
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          }
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

    const updateQtyObservables = selectedItems.map(it =>
      this.DetailPurchase.updateRequest(it)
    );

    forkJoin(updateQtyObservables).subscribe({
      next: () => {
        this.DetailPurchase.updateStatusToComplete(ids, 'Complete').subscribe({
          next: () => {
            const idSet = new Set(ids);
            this.request = this.request.map(r =>
              idSet.has(Number(r.ID_Request))
                ? { ...r, Status: 'Complete', Selection: false }
                : r
            );
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
            }
            this.Detail_Purchase();
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
        if (isPlatformBrowser(this.platformId)) {
          const base64 = res.imageData.split(',')[1];
          const binary = atob(base64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        }
      },
      error: err => { alert('ไม่สามารถโหลด PDF ได้'); }
    });
  }

  fileName = "ExcelSheet.xlsx";

  // ✅ แก้ไขส่วนนี้ด้วย เพื่อความปลอดภัยของ SSR (เพราะใช้ document)
  exportexcel() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // ห้ามรันบน server
    }

    const table = document.getElementById("table-data") as HTMLTableElement;
    if (!table) {
      console.error("Table not found!");
      return;
    }

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

    const selectedRows = Array.from(tbody.querySelectorAll("tr")).filter(row => {
      const checkbox = row.querySelector<HTMLInputElement>('input[type="checkbox"]');
      return checkbox?.checked;
    });

    if (selectedRows.length === 0) {
      Swal.fire({ icon: 'warning', title: 'No rows selected', text: 'Please select at least one row to export.' });
      return;
    }

    const tempTable = document.createElement("table");
    const exportThead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    thead.querySelectorAll("th").forEach((th, index) => {
      if (!["0", "1", "25", "26"].includes(index.toString())) {
        const newTh = document.createElement("th");
        newTh.textContent = th.textContent?.trim() || '';
        headerRow.appendChild(newTh);
      }
    });
    exportThead.appendChild(headerRow);
    tempTable.appendChild(exportThead);

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
      const status = (item.Status ?? '').toLowerCase().trim();
      const matchStatus = status === 'waiting';

      const matchDivision = !this.Division_?.length || this.Division_.includes(item.Division);
      const matchItemNo = !this.ItemNo_?.length || this.ItemNo_.includes(item.ItemNo);
      const matchPartNo = !this.PartNo_?.length || this.PartNo_.includes(item.PartNo);
      const matchSpec = !this.Spec_?.length || this.Spec_.includes(item.SPEC);
      const matchProcess = !this.Process_?.length || this.Process_.includes(item.Process);
      const matchCase = !this.Case_?.length || this.Case_.includes(item.CASE);
      const matchDocNo = !this.DocumentNo_?.length || this.DocumentNo_.includes(item.DocNo);

      const fromDateObj = this.fromDate ? new Date(this.fromDate) : null;
      const toDateObj = this.toDate ? new Date(this.toDate) : null;

      const requestDate = item.DateTime_Record ? new Date(item.DateTime_Record) : null;
      const dueDate = item.DueDate ? new Date(item.DueDate) : null;

      let matchDate: boolean = true;

      if (fromDateObj && toDateObj) {
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

      return matchStatus && matchDivision && matchPartNo && matchItemNo && matchDate && matchSpec && matchProcess && matchCase && matchDocNo;
    });
  }

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

      if (['ReqDate', 'DueDate', 'DateTime_Record'].includes(key)) {
        const parseDate = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'string') {
            const parts = val.includes('-') ? val.split('-') : val.split('/');
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                return new Date(val).getTime();
              } else {
                const [d, m, y] = parts.map(Number);
                return new Date(y, m - 1, d).getTime();
              }
            }
          }
          if (val instanceof Date) return val.getTime();
          const t = new Date(val).getTime();
          return isNaN(t) ? 0 : t;
        };

        const dateA = parseDate(valA);
        const dateB = parseDate(valB);
        return this.sortAsc ? dateA - dateB : dateB - dateA;
      }

      if (!isNaN(valA) && !isNaN(valB)) {
        return this.sortAsc ? valA - valB : valB - valA;
      }

      return this.sortAsc
        ? String(valA ?? '').localeCompare(String(valB ?? ''))
        : String(valB ?? '').localeCompare(String(valA ?? ''));
    });
  }

  clearFilters() {
    this.Division_ = '';
    this.PartNo_ = '';
    this.ItemNo_ = '';
    this.Spec_ = '';
    this.Process_ = '';
    this.Case_ = '';
    this.DocumentNo_ = '';
    this.fromDate = '';
    this.toDate = '';
    this.onFilter();
  }
}