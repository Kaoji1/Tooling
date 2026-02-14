import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription, interval } from 'rxjs';
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
export class DetailComponent implements OnInit, OnDestroy {
  userRole: string = 'view';
  allRequests: any[] = [];
  filteredRequests: any[] = [];
  request: any[] = [];
  allSetupRequests: any[] = [];
  setupRequests: any[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 1;
  displayedRequests: any[] = [];
  pages: number[] = [];

  private refreshSubscription: Subscription = new Subscription();

  // Date Filter
  dateFilterType: 'both' | 'req' | 'due' = 'both';
  // Req Date Filter
  reqDateFrom: string | null = null;
  reqDateTo: string | null = null;

  // Due Date Filter
  dueDateFrom: string | null = null;
  dueDateTo: string | null = null;

  // Dropdown Lists
  divisionList = [
    { label: 'GM', value: '7122' },
    { label: 'PMC', value: '71DZ' }
  ];
  StatusList = [
    { label: 'Wait', value: 'Waiting' },
    { label: 'Complete', value: 'Complete' }
  ];
  ToolingList = [
    { label: 'Cutting Tool', value: 'Cutting Tool' },
    { label: 'Setup Tool', value: 'Setup Tool' }
  ];

  PartNoList: any[] = [];
  ItemNoList: any[] = [];
  SpecList: any[] = [];
  ProcessList: any[] = [];
  ReqDateList: any[] = [];
  DueDateList: any[] = [];
  CaseList: any[] = [];
  DocumentNoList: any[] = [];
  MCTypeList: any[] = [];
  MRNoList: any[] = [];
  FacList: any[] = []; // Fac List

  // Selected Filters
  Division_: string | null = null;
  PartNo_: string | null = null;
  ItemNo_: string | null = null;
  Spec_: string | null = null;
  Process_: string | null = null;
  Fac_: string | null = null; // Fac Filter
  ReqDate_: string | null = null;
  DueDate_: string | null = null;
  Case_: string | null = null;
  DocumentNo_: string | null = null;
  Status_: string | null = null;
  Tooling_: string | null = null;

  // New Filters
  MRNo_: string | null = null;
  DueDateFilter_: string | null = null;
  MCType_: string | null = null;
  ItemNoFilter_: string | null = null;

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

    this.route.queryParams.subscribe(params => {
      if (params['case']) {
        this.Case_ = params['case'];
        // Reverted: Case Setup view is now separate component
        this.Tooling_ = 'Cutting Tool';
      }
      if (params['tool']) {
        this.Tooling_ = params['tool'];
      }
      // If no params, Tooling_ remains null (Blank Page)
    });

    if (isPlatformBrowser(this.platformId)) {
      this.Detail_Purchase();
      this.loadSetupData();
      this.get_ItemNo();

      // Auto-refresh every 10 seconds
      this.refreshSubscription = interval(10000).subscribe(() => {
        // Only fetch if no unsaved changes (editing, selected, or dirty)
        if (!this.hasUnsavedChanges()) {
          // We need to pass a flag to Data_Purchase to avoid spinner
          this.Detail_Purchase(true);
          // Also refresh setup data if needed
          this.loadSetupData();
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.request.length / this.pageSize) || 1;

    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    // Sliding window logic
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + 4);

    // Adjust if we are near the end and the window is smaller than 5
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    this.pages = [];
    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }

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

  hasUnsavedChanges(): boolean {
    // 1. Is any row currently in edit mode?
    if (Object.keys(this.editingIndex).length > 0) return true;

    // 2. Is any row selected? (User might be batching)
    if (this.request.some(r => r.Selection)) return true;

    // 3. Has any row been modified but not saved? (Dirty check)
    const isDirty = this.request.some(it => {
      const itemNoChanged = (it.ItemNo || '') !== (it.Req_ItemNo || '');
      const specChanged = (it.SPEC || '') !== (it.Req_SPEC || '');
      const qtyChanged = (it.QTY ?? 0) !== (it.Req_QTY ?? (it.QTY ?? 0));
      return itemNoChanged || specChanged || qtyChanged;
    });

    return isDirty;
  }

  Detail_Purchase(isBackgroundRefresh = false) {
    // If not background refresh, show spinner (if you have one, currently no global spinner variable used here directly or it's not shown in snippet)
    // But this method just fetches data.

    this.DetailPurchase.Detail_Request().subscribe({
      next: (response: any[]) => {
        if (!Array.isArray(response)) {
          this.allRequests = [];
          this.request = [];
          this.updatePagination();
          return;
        }

        const validResponse = response.filter(it => !['SET', 'Set', 'Setup'].includes(it.CASE));

        const mapped = validResponse.map(it => ({
          ...it,
          ID_Request: Number(it.ID_Request),
          Selection: false,
          QTY: it.QTY ?? it.Req_QTY,
          ACCOUNT: it.ACCOUNT ?? it.account,
          MCQTY: it.MCQTY ?? it.MCNo, // Map MCNo to MCQTY
          _parsedRequestDate: it.DateTime_Record ? new Date(it.DateTime_Record) : null,
          _parsedDueDate: it.DueDate ? new Date(it.DueDate) : null,
          // Store original request info for Production columns
          Req_ItemNo: it.ItemNo,
          Req_PartNo: it.PartNo,
          Req_SPEC: it.SPEC,
          Req_ItemName: it.ItemName
          // MFGOrderNo logic removed to use Backend value
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

        this.SpecList = Array.from(new Set(this.allRequests.map(x => x.SPEC))).filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.ProcessList = Array.from(new Set(this.allRequests.map(x => x.Process))).filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.CaseList = Array.from(new Set(this.allRequests.map(x => x.CASE))).filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.PartNoList = Array.from(new Set(this.allRequests.map(x => x.PartNo))).filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.ItemNoList = Array.from(new Set(this.allRequests.map(x => x.ItemNo))).filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.DocumentNoList = Array.from(new Set(this.allRequests.map(x => x.DocNo))).filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.MCTypeList = Array.from(new Set(this.allRequests.map(x => x.MCType))).filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.MRNoList = Array.from(new Set(this.allRequests.map(x => x.MR_No))).filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.FacList = Array.from(new Set(this.allRequests.map(x => x.Fac))).filter(x => x).sort().map(x => ({ label: x, value: x }));

        this.cdr.markForCheck();
      },
      error: e => console.error('❌ Error Detail_Purchase:', e)
    });
  }

  loadSetupData() {
    this.DetailPurchase.Detail_Request_Setup().subscribe({
      next: (response: any[]) => {
        if (!Array.isArray(response)) {
          this.allSetupRequests = [];
          this.setupRequests = [];
          // this.updatePagination(); // Might need separate pagination or unified
          return;
        }

        const mapped = response.map(it => ({
          ...it,
          ID_Request: Number(it.ID_RequestSetupTool), // Map ID for compatibility
          Selection: false,
          QTY: it.QTY ?? it.Req_QTY,
          MCQTY: it.MCQTY ?? it.MCNo, // Map MCNo to MCQTY Setup Tool
          _parsedRequestDate: it.DateTime_Record ? new Date(it.DateTime_Record) : null,
          _parsedDueDate: it.DueDate ? new Date(it.DueDate) : null
        }));

        this.allSetupRequests = mapped;
        this.setupRequests = [...mapped];

        // Merge lists for dropdowns if needed, or keeping separate?
        // For now, let's just load it.
        this.cdr.markForCheck();
      },
      error: e => console.error('❌ Error loadSetupData:', e)
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

  // Old onItemNoChange removed to fix duplicate


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
    this.editingIndex = {};
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

  stopEdit(id: number) {
    delete this.editingIndex[id];
  }

  syncSpecWithItemNo(row: any) {
    if (!row || !row.ItemNo) return;
    const list = this.ItemNo || [];
    const targetItemNo = String(row.ItemNo).trim();

    const found = list.find((x: any) => {
      const xItemNo = (typeof x === 'string' ? x : x?.ItemNo);
      return String(xItemNo).trim() === targetItemNo;
    });

    if (found && typeof found !== 'string') {
      const spec = (found as any).SPEC || (found as any).Specification || (found as any).Spec;
      if (typeof spec !== 'undefined' && spec !== null) {
        row.SPEC = String(spec);
      } else {
        row.SPEC = ''; // Reset if not found? Or keep old? Better to update if found.
      }

      const itemName = (found as any).ItemName || (found as any).EnglishName || (found as any).Name;
      if (typeof itemName !== 'undefined' && itemName !== null) {
        row.ItemName = String(itemName);
      } else {
        row.ItemName = '';
      }
    }
  }

  onItemNoChange(event: any, item: any) {
    this.syncSpecWithItemNo(item);
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

            // Remove from request (displayed list)
            this.request = this.request.filter(r => !idSet.has(Number(r.ID_Request)));

            // Remove from allRequests (source list)
            this.allRequests = this.allRequests.filter(r => !idSet.has(Number(r.ID_Request)));

            // Remove from setup requests if applicable
            this.allSetupRequests = this.allSetupRequests.filter(r => !idSet.has(Number(r.ID_Request)));
            this.setupRequests = this.setupRequests.filter(r => !idSet.has(Number(r.ID_Request)));

            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
            }

            // Re-apply filter and pagination
            this.onFilter();
            // this.updatePagination(); // onFilter calls updatePagination

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

  confirmItem(item: any) {
    if (!item) return;

    // Use Req_QTY if QTY is empty
    if (item.QTY == null || item.QTY === '') item.QTY = item.Req_QTY ?? 0;

    if (item.QTY == null || item.QTY === '') {
      Swal.fire({ icon: 'warning', title: 'Incomplete data', text: 'Please fill QTY before confirming.' });
      return;
    }

    const id = Number(item.ID_Request);
    if (!Number.isInteger(id)) return;

    this.isCompleting = true;

    // 1. Update Request details first
    this.DetailPurchase.updateRequest(item).subscribe({
      next: () => {
        // 2. Update Status to Complete
        this.DetailPurchase.updateStatusToComplete([id], 'Complete').subscribe({
          next: () => {
            // Remove from view
            this.request = this.request.filter(r => r.ID_Request !== item.ID_Request);
            this.allRequests = this.allRequests.filter(r => r.ID_Request !== item.ID_Request);
            this.allSetupRequests = this.allSetupRequests.filter(r => r.ID_Request !== item.ID_Request);
            this.setupRequests = this.setupRequests.filter(r => r.ID_Request !== item.ID_Request);

            // Remove explicit editing index if any
            delete this.editingIndex[item.ID_Request];

            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
            }

            // Re-apply filters
            this.onFilter();

            Swal.fire({ icon: 'success', title: 'Confirmed!', showConfirmButton: false, timer: 1200 });
            this.cdr.markForCheck();
          },
          error: err => {
            Swal.fire({ icon: 'error', title: 'Confirm failed', text: err?.message || 'Update status failed' });
          },
          complete: () => {
            this.isCompleting = false;
            this.cdr.markForCheck();
          }
        });
      },
      error: err => {
        Swal.fire({ icon: 'error', title: 'Save failed', text: err?.message || 'Update details failed' });
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
        'Item Name': item.ItemName || '',
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
    const source = (this.Tooling_ === 'Setup Tool') ? this.allSetupRequests : this.allRequests;

    this.request = source.filter(item => {
      const status = (item.Status ?? '').toLowerCase().trim();

      const matchStatus = !this.Status_?.length || this.Status_.toLowerCase().includes(status);

      const matchDivision = !this.Division_?.length || this.Division_.includes(item.Division);
      const matchProcess = !this.Process_?.length || this.Process_.includes(item.Process);
      const matchCase = !this.Case_?.length || this.Case_.includes(item.CASE);

      // Tooling_ is now a Switcher, not a Row Filter.
      // If it's 'Cutting Tool', we assume ALL current data is Cutting Tool (or handled elsewhere).
      // So we generally always return true for this filter in this context.
      const matchTooling = true;

      const requestDate = item._parsedRequestDate;

      // --- Req Date Filter ---
      const reqFrom = this.reqDateFrom ? new Date(this.reqDateFrom) : null;
      if (reqFrom) reqFrom.setHours(0, 0, 0, 0);

      let matchReqDate = true;
      if (this.reqDateFrom && requestDate && reqFrom) {
        const rDate = new Date(requestDate);
        rDate.setHours(0, 0, 0, 0);
        // Single date match as per Return List style
        matchReqDate = rDate.getTime() === reqFrom.getTime();
      }

      // --- New Filters ---
      const matchMRNo = !this.MRNo_?.length || (item.RefNo && item.RefNo.toLowerCase().includes(this.MRNo_.toLowerCase()));
      const matchMCType = !this.MCType_?.length || (item.MCType && item.MCType.toLowerCase().includes(this.MCType_.toLowerCase()));
      const matchItemNo = !this.ItemNoFilter_?.length || (item.ItemNo && item.ItemNo.toLowerCase().includes(this.ItemNoFilter_.toLowerCase()));
      const matchPartNo = !this.PartNo_?.length || (item.PartNo && item.PartNo.toLowerCase().includes(this.PartNo_.toLowerCase()));

      // --- Due Date Filter ---
      let matchDueDate = true;
      if (this.DueDateFilter_ && item.DueDate) {
        const dueFilter = new Date(this.DueDateFilter_);
        dueFilter.setHours(0, 0, 0, 0);

        const itemDueDate = new Date(item.DueDate);
        itemDueDate.setHours(0, 0, 0, 0);

        matchDueDate = itemDueDate.getTime() === dueFilter.getTime();
      }

      return matchStatus && matchDivision && matchProcess && matchCase && matchReqDate && matchTooling && matchMRNo && matchMCType && matchItemNo && matchDueDate && matchPartNo;
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
    this.Process_ = null;
    this.Case_ = null;
    this.Status_ = null;
    this.reqDateFrom = null;

    // Clear new filters
    this.MRNo_ = null;
    this.DueDateFilter_ = null;
    this.MCType_ = null;
    this.ItemNoFilter_ = null;
    this.PartNo_ = null;

    this.onFilter();
  }

  trackByRequestId(index: number, item: any): number {
    return item.ID_Request;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Check if click is inside an editable area or related controls
    const isInput = target.closest('input');
    const isSelect = target.closest('ng-select');
    const isDropdown = target.closest('.ng-dropdown-panel'); // ng-select dropdown
    const isButton = target.closest('button'); // OK button or others

    // If click is on any interaction element, do not clear
    if (isInput || isSelect || isDropdown || isButton) {
      return;
    }

    // Also check if we are clicking strictly on the "span" that triggers edit?
    // If we handle stopPropagation in HTML, we don't need to check here.
    // If we don't handle stopPropagation, we need to check if target matching the trigger.
    // Let's assume we will add stopPropagation in HTML for robustness.

    // If clicking on empty space or non-interactive parts of table, clear edits
    this.editingIndex = {}; // Force Rebuild
  }
}