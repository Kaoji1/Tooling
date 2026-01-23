import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  styleUrls: ['./detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailComponent implements OnInit {
  userRole: string = 'view';
  allRequests: any[] = [];
  filteredRequests: any[] = [];
  request: any[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 1;
  displayedRequests: any[] = [];
  pages: number[] = [];

  // Date Filter
  dateFilterType: 'both' | 'req' | 'due' = 'both';
  fromDate: string = '';
  toDate: string = '';

  // Dropdown Lists
  divisionList = [
    { label: 'GM', value: '7122' },
    { label: 'PMC', value: '71DZ' }
  ];
  PartNoList: any[] = [];
  ItemNoList: any[] = [];
  SpecList: any[] = [];
  ProcessList: any[] = [];
  ReqDateList: any[] = [];
  DueDateList: any[] = [];
  CaseList: any[] = [];
  DocumentNoList: any[] = [];

  // Selected Filters
  Division_: string | null = null;
  PartNo_: string | null = null;
  ItemNo_: string | null = null;
  Spec_: string | null = null;
  Process_: string | null = null;
  ReqDate_: string | null = null;
  DueDate_: string | null = null;
  Case_: string | null = null;
  DocumentNo_: string | null = null;

  // Selected Item Details
  PartNo: any[] = [];
  ItemNo: any[] = [];
  SPEC: any[] = [];

  // Sorting & Editing
  sortKey: string = '';
  sortAsc: boolean = true;
  editingIndex: { [key: string]: number | null } = {};
  newRequestData: any = {};
  selectAllChecked = false;

  itemNo!: string;
  displayIndex!: number;
  items: any[] = [];
  highlightedRow: number | null = null;

  // Document Filter
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
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  isViewer(): boolean {
    return this.authService.isViewer();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(p => {
      this.itemNo = p.get('itemNo') || '';
    });

    if (isPlatformBrowser(this.platformId)) {
      this.Detail_Purchase();
      this.get_ItemNo();

      const savedRequests = localStorage.getItem('purchaseRequest');
      if (savedRequests) {
        try {
          const parsed = JSON.parse(savedRequests);
          if (Array.isArray(parsed)) {
            this.request = parsed.map(r => ({
              ...r,
              QTY: r.QTY ?? r.Req_QTY,
              _parsedRequestDate: r.DateTime_Record ? new Date(r.DateTime_Record) : null,
              _parsedDueDate: r.DueDate ? new Date(r.DueDate) : null
            }));
            this.updatePagination();
          }
        } catch (e) {
          console.error("Error parsing localStorage", e);
        }
      }
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.request.length / this.pageSize) || 1;
    this.pages = Array.from({ length: Math.min(5, this.totalPages) }, (_, i) => i + 1);

    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedRequests = this.request.slice(startIndex, endIndex);

    this.cdr.markForCheck();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  Detail_Purchase() {
    this.DetailPurchase.Detail_Request().subscribe({
      next: (response: any[]) => {
        if (!Array.isArray(response)) {
          this.allRequests = [];
          this.request = [];
          this.updatePagination();
          return;
        }

        const mapped = response.map(it => ({
          ...it,
          ID_Request: Number(it.ID_Request),
          Selection: false,
          QTY: it.QTY ?? it.Req_QTY,
          ACCOUNT: it.ACCOUNT ?? it.account,
          MCQTY: it.MCQTY ?? it.MCNo, // Map MCNo to MCQTY
          _parsedRequestDate: it.DateTime_Record ? new Date(it.DateTime_Record) : null,
          _parsedDueDate: it.DueDate ? new Date(it.DueDate) : null
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
        this.updatePagination();

        this.SpecList = Array.from(new Set(this.allRequests.map(x => x.SPEC))).map(x => ({ label: x, value: x }));
        this.ProcessList = Array.from(new Set(this.allRequests.map(x => x.Process))).map(x => ({ label: x, value: x }));
        this.CaseList = Array.from(new Set(this.allRequests.map(x => x.CASE))).map(x => ({ label: x, value: x }));
        this.PartNoList = Array.from(new Set(this.allRequests.map(x => x.PartNo))).map(x => ({ label: x, value: x }));
        this.ItemNoList = Array.from(new Set(this.allRequests.map(x => x.ItemNo))).map(x => ({ label: x, value: x }));
        this.DocumentNoList = Array.from(new Set(this.allRequests.map(x => x.DocNo))).map(x => ({ label: x, value: x }));

        this.cdr.markForCheck();
      },
      error: e => console.error('❌ Error Detail_Purchase:', e)
    });
  }

  get_ItemNo() {
    this.DetailPurchase.get_ItemNo().subscribe({
      next: (response: any[]) => {
        const uniqueItems = new Map();
        response.forEach(item => {
          if (item.ItemNo && !uniqueItems.has(item.ItemNo)) {
            uniqueItems.set(item.ItemNo, {
              ...item,
              ACCOUNT: item.ACCOUNT ?? item.account ?? ''
            });
          }
        });
        this.ItemNo = Array.from(uniqueItems.values());
        this.cdr.markForCheck();
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
        this.updatePagination();

        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        }
        Swal.fire({ icon: 'success', title: 'Successfully Added Data Row', showConfirmButton: false, timer: 1330 });
      },
      error: err => { }
    });
  }

  startEdit(caseKey: number, rowIndex: number) {
    // Note: rowIndex passed here is likely likely from displayedRequests (0-49) if called from template
    // Ideally, pass ID_Request instead of index to be safe
    this.editingIndex[caseKey] = rowIndex;
  }

  saveEdit(caseKey: number, rowIndex: number) {
    // Use ID to find the actual item in the full list
    const realIndex = this.request.findIndex(r => r.ID_Request === caseKey);
    const item = this.request[realIndex];

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
          this.request[realIndex] = mergeSafe(item, res);
          delete this.editingIndex[caseKey];
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          }
          this.updatePagination();
          Swal.fire({ icon: 'success', title: 'Your work has been saved', showConfirmButton: false, timer: 1330 });
        },
        error: (err) => {
          this.request[realIndex] = snapshot;
          alert('เกิดข้อผิดพลาดในการบันทึกแถวใหม่');
        }
      });
    } else {
      this.DetailPurchase.updateRequest(item).subscribe({
        next: (res) => {
          this.request[realIndex] = mergeSafe(item, res);
          delete this.editingIndex[caseKey];
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          }
          this.updatePagination();
          Swal.fire({ icon: 'success', title: 'Your work has been saved', showConfirmButton: false, timer: 1330 });
        },
        error: (err) => {
          this.request[realIndex] = snapshot;
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
    // Determine real index based on current page
    const realIndex = (this.currentPage - 1) * this.pageSize + rowIndex;
    const item = this.request[realIndex];

    if (!item) return;

    if (item.isNew) {
      this.request.splice(realIndex, 1);
      delete this.editingIndex[item.ID_Request];
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
      }
      this.updatePagination();
      alert('ลบแถวเรียบร้อย');
    } else {
      this.DetailPurchase.deleteRequest(item.ID_Request).subscribe({
        next: () => {
          this.request.splice(realIndex, 1);
          delete this.editingIndex[item.ID_Request];
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          }
          this.updatePagination();
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
            this.cdr.markForCheck();
          },
          error: err => {
            Swal.fire({ icon: 'error', title: 'Bulk update failed', text: err?.error?.message || '' });
            this.cdr.markForCheck();
          },
          complete: () => {
            this.isCompleting = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: err => {
        Swal.fire({ icon: 'error', title: 'Update QTY failed', text: err?.error?.message || '' });
        this.isCompleting = false;
        this.cdr.markForCheck();
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

  exportexcel() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // 1. Get filtered items that are selected
    const selectedItems = this.request.filter(item => item.Selection);

    if (selectedItems.length === 0) {
      Swal.fire({ icon: 'warning', title: 'No rows selected', text: 'Please select at least one row to export.' });
      return;
    }

    // 2. Map data to match the table structure
    const dataToExport = selectedItems.map((item, index) => {
      // Find original index if needed, or just use current loop index + 1
      return {
        'No.': index + 1,
        'Document': item.DocNo || '',
        'Requester': item.Requester || '',
        'Account': item.ACCOUNT || '',
        'Division': item.Division || '',
        'Part No.': item.PartNo || '',
        'Item No.': item.ItemNo || '',
        'Spec': item.SPEC || '',
        'Process': item.Process || '',
        'MC Type': item.MCType || '',
        'Fac': item.Fac || '',
        'DWG': item.DwgRev || '',
        'On Hand': item.ON_HAND || '',
        'Req QTY': item.Req_QTY || '',
        'QTY': item.QTY || '',
        'MC No.': item.MCQTY || '',
        'Req Date': item.DateTime_Record ? new Date(item.DateTime_Record).toLocaleDateString('en-GB') : '',
        'Due Date': item.DueDate ? new Date(item.DueDate).toLocaleDateString('en-GB') : '',
        'Case': item.CASE || '',
        'Status': item.Status || '',
        'Phone Number': item.PhoneNo || '',
        'Remark': item.Remark || ''
      };
    });

    // 3. Generate Worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);

    // 4. Create Workbook and Append Sheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // 5. Save File
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
            this.updatePagination();
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

      const requestDate = item._parsedRequestDate;
      const dueDate = item._parsedDueDate;

      const fromDateObj = this.fromDate ? new Date(this.fromDate) : null;
      const toDateObj = this.toDate ? new Date(this.toDate) : null;

      let matchDate: boolean = true;
      if (fromDateObj && toDateObj) {
        matchDate = !!(requestDate && dueDate && requestDate.toDateString() === fromDateObj.toDateString() && dueDate.toDateString() === toDateObj.toDateString());
      } else if (fromDateObj) {
        matchDate = !!(requestDate && requestDate.toDateString() === fromDateObj.toDateString());
      } else if (toDateObj) {
        matchDate = !!(dueDate && dueDate.toDateString() === toDateObj.toDateString());
      }

      return matchStatus && matchDivision && matchPartNo && matchItemNo && matchDate && matchSpec && matchProcess && matchCase && matchDocNo;
    });

    this.currentPage = 1;
    this.updatePagination();
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
              if (parts[0].length === 4) { return new Date(val).getTime(); }
              else { const [d, m, y] = parts.map(Number); return new Date(y, m - 1, d).getTime(); }
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
    this.updatePagination();
  }

  // Helper for template
  min(a: number, b: number): number {
    return Math.min(a, b);
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

  trackByRequestId(index: number, item: any): number {
    return item.ID_Request;
  }
}