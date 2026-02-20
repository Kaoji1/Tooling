import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { Subscription, interval } from 'rxjs'; // Import interval and Subscription

@Component({
    selector: 'app-detailcasesetup',
    standalone: true,
    imports: [CommonModule, FormsModule, NgSelectModule, SidebarPurchaseComponent],
    templateUrl: './detailcasesetup.component.html',
    styleUrls: ['./detailcasesetup.component.scss']
})
export class DetailCaseSetupComponent implements OnInit, OnDestroy {

    private refreshSubscription: Subscription = new Subscription(); // To manage the interval subscription

    // Data
    allRequests: any[] = [];
    displayedRequests: any[] = []; // Full filtered list (Pattern A)
    request: any[] = []; // Synced with displayedRequests for compatibility

    // Pivot Arrays for Filters
    divisionList: any[] = [];
    StatusList = [
        { label: 'Wait', value: 'Waiting' },
        { label: 'Complete', value: 'Complete' }
    ];

    RequesterList: any[] = [];
    FacList: any[] = [];
    CaseList: any[] = [];
    ModelList: any[] = [];
    ProcessList: any[] = [];
    MCTypeList: any[] = [];
    DocNoList: any[] = [];
    ToolingList = [
        { label: 'Cutting Tool', value: 'Cutting Tool' },
        { label: 'Setup Tool', value: 'Setup Tool' }
    ];
    PartNoList: any[] = [];
    ItemNoList: any[] = [];
    MRNoList: any[] = [];


    // Selected Filters
    Division_: string | null = null;
    Status_: string | null = null;
    Requester_: string | null = null;
    Fac_: string | null = null;
    Case_: string | null = null;
    Model_: string | null = null;
    Process_: string | null = null;
    MCType_: string | null = null;
    DocNo_: string | null = null;
    reqDateFrom: string | null = null;
    DueDateFilter_: string | null = null;

    PartNo_: string | null = null;
    ItemNoFilter_: string | null = null;
    Tooling_: string | null = 'Setup Tool';
    MRNo_: string | null = null;


    // Pagination
    currentPage: number = 1;
    pageSize: number = 20;
    totalPages: number = 1;
    pages: number[] = [];

    // Sorting
    sortKey: string = '';
    sortAsc: boolean = true;
    selectAllChecked: boolean = false;
    isLoading: boolean = false;
    editingIndex: { [key: string]: number | null } = {};
    highlightedRow: number | null = null;
    isCompleting = false;

    constructor(
        private detailService: DetailPurchaseRequestlistService,
        private cdRef: ChangeDetectorRef,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit() {
        this.fetchData();
        // Auto-refresh every 10 seconds
        if (isPlatformBrowser(this.platformId)) {
            this.get_ItemNo();
            this.refreshSubscription = interval(10000).subscribe(() => {
                // Only fetch if no unsaved changes (editing, selected, or dirty)
                if (!this.hasUnsavedChanges()) {
                    this.fetchData(true); // Pass true to indicate background refresh
                }
            });
        }
    }

    ngOnDestroy() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
    }

    fetchData(isBackgroundRefresh = false) {
        // ... (existing logic) -> modify fetchData slightly to not show loading spinner if background refresh

        if (!isBackgroundRefresh) {
            // Only show full loading state on initial load or manual refresh
            // You might want to set a loading flag here if you had one, but currently we just fetch
            this.isLoading = true;
        }

        this.detailService.Detail_CaseSetup().subscribe({
            next: (res: any) => { // Explicitly typed as any
                if (!Array.isArray(res)) {
                    this.allRequests = [];
                    this.displayedRequests = [];
                    this.request = [];
                    this.updatePagination();
                    this.isLoading = false;
                    return;
                }

                this.allRequests = res.map(item => ({
                    ...item,
                    ID_Request: item.ID_Request ?? item.OriginalID,
                    Public_Id: item.Public_Id || item.ID_Request || item.OriginalID,
                    Selection: false,
                    QTY: item.QTY ?? item.Req_QTY,
                    // Store original state for Inhibition check
                    _originalItemNo: item.ItemNo,
                    _originalSPEC: item.SPEC,
                    _originalQTY: item.QTY ?? item.Req_QTY,
                    Req_ItemName: item.ItemName,
                    Req_SPEC: item.SPEC,
                    Req_ItemNo: item.ItemNo,
                    TableType: (item.ToolingType === 'CuttingTool') ? 'Cutting' : 'Setup'
                }));

                this.filteredListToDisplay(); // Initial Copy
                this.populateDropdowns();
                this.onFilter();
                this.isLoading = false;
                this.cdRef.detectChanges();
            },
            error: (err: any) => {
                console.error('Error fetching Case Setup data:', err);
                this.isLoading = false;
            }
        });
    }

    // Helper to sync lists
    filteredListToDisplay() {
        this.displayedRequests = [...this.allRequests];
        this.request = [...this.displayedRequests];
    }

    populateDropdowns() {
        // Optimize: Iterate once to build all sets
        const sets = {
            Requester: new Set<string>(),
            Fac: new Set<string>(),
            CASE: new Set<string>(),
            Model: new Set<string>(),
            Process: new Set<string>(),
            MCType: new Set<string>(),
            DocNo: new Set<string>(),
            PartNo: new Set<string>(),
            ItemNo: new Set<string>(),
            MR_No: new Set<string>()
        };

        this.allRequests.forEach(item => {
            if (item.Requester) sets.Requester.add(item.Requester);
            if (item.Fac) sets.Fac.add(item.Fac);
            if (item.CASE) sets.CASE.add(item.CASE);
            if (item.Model) sets.Model.add(item.Model);
            if (item.Process) sets.Process.add(item.Process);
            if (item.MCType) sets.MCType.add(item.MCType);
            if (item.DocNo) sets.DocNo.add(item.DocNo);
            if (item.PartNo) sets.PartNo.add(item.PartNo);
            if (item.ItemNo) sets.ItemNo.add(item.ItemNo);
            if (item.MR_No) sets.MR_No.add(item.MR_No);
        });

        const toSortedOptions = (set: Set<string>) => Array.from(set).sort().map(x => ({ label: x, value: x }));

        this.RequesterList = toSortedOptions(sets.Requester);
        this.FacList = toSortedOptions(sets.Fac);
        this.CaseList = toSortedOptions(sets.CASE);
        this.ModelList = toSortedOptions(sets.Model);
        this.ProcessList = toSortedOptions(sets.Process);
        this.MCTypeList = toSortedOptions(sets.MCType);
        this.DocNoList = toSortedOptions(sets.DocNo);
        this.PartNoList = toSortedOptions(sets.PartNo);
        this.ItemNoList = toSortedOptions(sets.ItemNo);
        this.MRNoList = toSortedOptions(sets.MR_No);

        // Hardcoded Division List
        this.divisionList = [
            { label: 'GM', value: '7122' },
            { label: 'PMC', value: '71DZ' }
        ];
    }

    onFilter() {
        this.displayedRequests = this.allRequests.filter(req => {
            const matchDiv = !this.Division_ || req.Division === this.Division_;
            const matchStatus = !this.Status_ || (req.Status && req.Status.toLowerCase().includes(this.Status_.toLowerCase()));
            const matchRequester = !this.Requester_ || req.Requester === this.Requester_;
            const matchFac = !this.Fac_ || req.Fac == this.Fac_;
            const matchCase = !this.Case_ || req.CASE === this.Case_;
            const matchModel = !this.Model_ || req.Model === this.Model_;
            const matchPartNo = !this.PartNo_ || req.PartNo === this.PartNo_;
            const matchProcess = !this.Process_ || req.Process === this.Process_;
            const matchMCType = !this.MCType_ || req.MCType === this.MCType_;
            const matchDocNo = !this.DocNo_ || (req.DocNo && req.DocNo.toLowerCase().includes(this.DocNo_.toLowerCase()));
            const matchMRNo = !this.MRNo_ || (req.MR_No && req.MR_No.toLowerCase().includes(this.MRNo_.toLowerCase()));
            const matchItemNo = !this.ItemNoFilter_ || (req.ItemNo && req.ItemNo.toLowerCase().includes(this.ItemNoFilter_.toLowerCase()));

            let matchDate = true;
            if (this.reqDateFrom) {
                const recDate = new Date(req.DateTime_Record).setHours(0, 0, 0, 0);
                const filterDate = new Date(this.reqDateFrom).setHours(0, 0, 0, 0);
                matchDate = recDate === filterDate;
            }

            let matchDueDate = true;
            if (this.DueDateFilter_) {
                const dueDate = new Date(req.DueDate).setHours(0, 0, 0, 0);
                const filterDueDate = new Date(this.DueDateFilter_).setHours(0, 0, 0, 0);
                matchDueDate = dueDate === filterDueDate;
            }

            return matchDiv && matchStatus && matchRequester && matchFac && matchCase && matchModel && matchPartNo && matchProcess && matchMCType && matchDocNo && matchMRNo && matchItemNo && matchDate && matchDueDate;
        });

        // Sync request list
        this.request = [...this.displayedRequests];

        this.currentPage = 1;
        this.updatePagination();
    }

    clearFilters() {
        this.Status_ = null;
        this.Requester_ = null;
        this.Fac_ = null;
        this.Case_ = null;
        this.Model_ = null;
        this.PartNo_ = null;
        this.Process_ = null;
        this.MCType_ = null;
        this.DocNo_ = null;
        this.reqDateFrom = null;
        this.DueDateFilter_ = null;
        this.MRNo_ = null;
        this.ItemNoFilter_ = null;
        this.onFilter();
    }

    onSort(key: string) {
        if (this.sortKey === key) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortKey = key;
            this.sortAsc = true;
        }

        this.displayedRequests.sort((a, b) => {
            const valA = a[key];
            const valB = b[key];

            if (['DateTime_Record', 'StartTime', 'DueDate'].includes(key)) {
                const dateA = valA ? new Date(valA).getTime() : 0;
                const dateB = valB ? new Date(valB).getTime() : 0;
                return this.sortAsc ? dateA - dateB : dateB - dateA;
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                return this.sortAsc ? valA - valB : valB - valA;
            }

            const strA = String(valA || '').toLowerCase();
            const strB = String(valB || '').toLowerCase();

            if (strA < strB) return this.sortAsc ? -1 : 1;
            if (strA > strB) return this.sortAsc ? 1 : -1;
            return 0;
        });

        // Update synced list order
        this.request = [...this.displayedRequests];
        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.displayedRequests.length / this.pageSize) || 1;

        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(this.totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        this.pages = [];
        for (let i = startPage; i <= endPage; i++) {
            this.pages.push(i);
        }
    }

    // Computed property for slice (Pattern A)
    get paginatedItems() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.displayedRequests.slice(start, start + this.pageSize);
    }

    changePage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    hasUnsavedChanges(): boolean {
        // 1. Any row in edit mode?
        if (Object.keys(this.editingIndex).length > 0) return true;

        // 2. Any row selected?
        if (this.request.some(r => r.Selection)) return true;

        // 3. Any row dirty?
        const isDirty = this.request.some(it => {
            return it.ItemNo !== it._originalItemNo ||
                it.SPEC !== it._originalSPEC ||
                it.QTY !== it._originalQTY;
        });

        return isDirty;
    }

    toggleAllCheckboxes() {
        // Apply to current page only or all? 
        // DetailComponent applies to 'displayedRequests' which it considers the slice.
        // If I use 'paginatedItems' for checkboxes, I should flip them.
        this.paginatedItems.forEach(req => req.Selection = this.selectAllChecked);
    }

    trackByRequestId(index: number, item: any): string {
        return item.Public_Id || item.ID_Request;
    }

    min(a: number, b: number): number {
        return Math.min(a, b);
    }

    isViewer(): boolean {
        return false;
    }

    exportexcel() {
        if (!isPlatformBrowser(this.platformId)) return;

        const selectedItems = this.request.filter(item => item.Selection);

        if (selectedItems.length === 0) {
            Swal.fire({ icon: 'warning', title: 'No rows selected', text: 'Please select at least one row to export.' });
            return;
        }

        const dataToExport = selectedItems.map((item, index) => ({
            'No.': index + 1,
            'Document': item.DocNo || '',
            'Requester': item.Requester || '',
            'Division': item.Division || '',
            'Part No.': item.PartNo || '',
            'Item No.': item.ItemNo || '',
            'Item Name': item.ItemName || '',
            'Spec': item.SPEC || '',
            'Process': item.Process || '',
            'MC Type': item.MCType || '',
            'Fac': item.Fac || '',
            'On Hand': item.ON_HAND || '',
            'QTY': item.QTY || '',
            'MC No.': item.MCQTY || '',
            'Req Date': item.DateTime_Record ? new Date(item.DateTime_Record).toLocaleDateString('en-GB') : '',
            'Due Date': item.DueDate ? new Date(item.DueDate).toLocaleDateString('en-GB') : '',
            'Case': item.CASE || '',
            'Status': item.Status || '',
            'Phone Number': item.PhoneNo || '',
            'Remark': item.Remark || ''
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'CaseSetup_Export');
        XLSX.writeFile(wb, 'CaseSetup_Export.xlsx');
    }

    saveEdit(publicId: string) {
        const item = this.request.find(r => r.Public_Id === publicId);

        if (!item) return;

        this.syncSpecWithItemNo(item);
        const snapshot = { ...item };

        const hasId = item.ID_Request != null;

        if (!hasId) {
            // Logic for manual insert? (Not yet clear if used)
        } else {
            this.detailService.updateRequest(item).subscribe({
                next: (res) => {
                    item.isNew = false;
                    delete this.editingIndex[publicId];
                    this.updatePagination();
                    Swal.fire({ icon: 'success', title: 'Your work has been saved', showConfirmButton: false, timer: 1330 });
                    this.cdRef.detectChanges();
                },
                error: (err) => {
                    Object.assign(item, snapshot);
                    alert('เกิดข้อผิดพลาดในการบันทึกแถว');
                }
            });
        }
    }
    startEdit(publicId: string, index: number) {
        this.editingIndex = {};
        this.editingIndex[publicId] = index;
    }

    confirmItem(item: any) {
        if (!item) return;
        if (item.QTY == null || item.QTY === '') item.QTY = item.Req_QTY ?? 0;

        const idForUpdate = item.Public_Id || item.ID_Request;

        this.detailService.updateRequest(item).subscribe({
            next: () => {
                this.detailService.updateStatusToComplete([idForUpdate], 'Complete', item.TableType).subscribe({
                    next: () => {
                        this.removeFromLists(item.Public_Id);
                        delete this.editingIndex[item.Public_Id];
                        this.updatePagination();
                        Swal.fire({ icon: 'success', title: 'Confirmed!', showConfirmButton: false, timer: 1200 });
                        this.cdRef.detectChanges();
                    },
                    error: err => Swal.fire({ icon: 'error', title: 'Confirm failed', text: err?.message })
                });
            },
            error: err => Swal.fire({ icon: 'error', title: 'Save failed', text: err?.message })
        });
    }

    completeSelected() {
        if (this.isCompleting) return;

        const selectedItems = this.request.filter(it => it.Selection === true && it.Status !== 'Complete');

        if (selectedItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No items selected',
                text: 'Please select items to complete.',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to complete ${selectedItems.length} items. This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, complete them!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.isCompleting = true;
                const ids = selectedItems.map(item => item.Public_Id || item.ID_Request);

                this.detailService.updateStatusToComplete(ids, 'Complete').subscribe({
                    next: (res: any) => {
                        ids.forEach((id: string) => this.removeFromLists(id));
                        this.updatePagination();
                        this.isCompleting = false;
                        Swal.fire({
                            icon: 'success',
                            title: 'Completed!',
                            text: 'Selected items have been marked as complete.',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        this.cdRef.detectChanges();
                    },
                    error: (err: any) => {
                        console.error('Complete error', err);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to complete items. Please try again.',
                        });
                        this.isCompleting = false;
                        this.cdRef.detectChanges();
                    }
                });
            }
        });
    }

    removeFromLists(id: string) {
        this.request = this.request.filter(r => (r.Public_Id !== id && r.ID_Request !== id));
        this.displayedRequests = this.displayedRequests.filter(r => (r.Public_Id !== id && r.ID_Request !== id));
        this.allRequests = this.allRequests.filter(r => (r.Public_Id !== id && r.ID_Request !== id));
    }

    ItemNo: any[] = [];
    get_ItemNo() {
        this.detailService.get_ItemNo().subscribe({
            next: (response: any[]) => {
                // Remove unique filter to allow all items.
                // Backend orders by LAST_UPDATE DESC, so .find() will hit the latest one first.
                this.ItemNo = response.map(item => ({
                    ...item,
                    ACCOUNT: item.ACCOUNT ?? item.account ?? ''
                }));
            },
            error: (e: any) => console.error("Error API get_ItemNo:", e),
        });
    }

    syncSpecWithItemNo(row: any) {
        if (!row || !row.ItemNo) return;
        const targetItemNo = String(row.ItemNo).trim();
        const divisionId = row.Division || '71DZ'; // Default to PMC if not set

        // 1. Try local lookup first (for immediate feedback)
        const list = this.ItemNo || [];
        const foundLocal = list.find((x: any) => {
            const xItemNo = (typeof x === 'string' ? x : x?.ItemNo);
            return String(xItemNo).trim() === targetItemNo;
        });

        if (foundLocal && typeof foundLocal !== 'string') {
            this.updateRowWithFound(row, foundLocal);
        }

        // 2. Fetch from Server for precision and to solve "Delay/Missing" issues
        this.detailService.getItemDetailsByNo(targetItemNo, divisionId).subscribe({
            next: (foundServer: any) => {
                if (foundServer) {
                    this.updateRowWithFound(row, foundServer);
                }
            },
            error: (err) => {
                console.warn(`Item lookup failed for ${targetItemNo} on server:`, err);
                // If not found on server AND not found locally, clear values
                if (!foundLocal) {
                    row.SPEC = '';
                    row.ItemName = '';
                    this.cdRef.detectChanges();
                }
            }
        });
    }

    private updateRowWithFound(row: any, found: any) {
        const spec = found.SPEC || found.Specification || found.Spec;
        const itemName = found.ItemName || found.EnglishName || found.Name;
        const onHand = found.ON_HAND || found.STOCK_ON_HAND || found.OnHand || 0;
        const mainLocation = found.MAIN_LOCATION || found.MainLocation || '';

        if (typeof spec !== 'undefined' && spec !== null) {
            row.SPEC = String(spec).trim();
        }
        if (typeof itemName !== 'undefined' && itemName !== null) {
            row.ItemName = String(itemName).trim();
        }

        row.STOCK_ON_HAND = onHand;
        row.MAIN_LOCATION = mainLocation;

        this.cdRef.detectChanges();
    }

    onItemNoChange(event: any, item: any) {
        this.syncSpecWithItemNo(item);
    }

    stopEdit(id: string) {
        const item = this.request.find(r => r.Public_Id === id);
        if (item) {
            this.syncSpecWithItemNo(item);
        }
        delete this.editingIndex[id];
        this.cdRef.detectChanges();
    }
}
