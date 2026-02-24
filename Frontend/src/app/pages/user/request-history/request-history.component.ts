import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
import { PurchaseRequestService } from '../../../core/services/PurchaseRequest.service';

@Component({
    selector: 'app-request-history',
    standalone: true,
    imports: [CommonModule, FormsModule, NgSelectModule],
    templateUrl: './request-history.component.html',
    styleUrls: ['./request-history.component.scss']
})
export class RequestHistoryComponent implements OnInit {
    historyList: any[] = [];
    filteredList: any[] = [];
    paginatedList: any[] = [];
    isLoading: boolean = true;

    // Dropdown Lists for Filtering
    divisionList: any[] = [];
    partNoList: any[] = [];
    processList: any[] = [];
    itemNoList: any[] = [];
    statusList: any[] = [];
    toolingTypeList: any[] = [];

    // Filter Models
    selectedDivisions: any[] = [];
    selectedPartNos: any[] = [];
    selectedProcesses: any[] = [];
    selectedItemNos: any[] = [];
    selectedStatuses: any[] = [];
    selectedToolingTypes: any[] = [];
    fromDate: string = '';
    toDate: string = '';

    // Pagination
    currentPage: number = 1;
    pageSize: number = 20;
    totalPages: number = 1;
    pages: number[] = [];

    // Sorting
    sortKey: string = '';
    sortAsc: boolean = true;

    // Filter Popup State
    activeFilter: string | null = null;

    fileName = "RequestHistory.xlsx";

    constructor(private purchaseService: PurchaseRequestService) { }

    ngOnInit() {
        this.loadHistory();
    }

    loadHistory() {
        this.isLoading = true;
        this.purchaseService.Purchase_Request().subscribe({
            next: (data) => {
                this.historyList = data;
                this.extractDropdowns();
                this.filteredList = [...this.historyList];
                this.updatePaginatedList();
                this.isLoading = false;
            },
            error: (err) => {
                console.error("Error loading history:", err);
                this.isLoading = false;
                Swal.fire('Error', 'ไม่สามารถดึงข้อมูลประวัติได้', 'error');
            }
        });
    }

    // 🔄 Scroll Sync Logic
    syncScroll(source: HTMLElement, target: HTMLElement) {
        if (source.scrollLeft !== target.scrollLeft) {
            target.scrollLeft = source.scrollLeft;
        }
    }

    setDivisionFilter(div: string) {
        if (div === '') {
            this.selectedDivisions = [];
        } else {
            this.selectedDivisions = [div];
        }
        this.onFilter();
    }

    extractDropdowns(sourceList: any[] = this.historyList) {
        this.divisionList = [...new Set(sourceList.map(i => i.Division))].filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.partNoList = [...new Set(sourceList.map(i => i.PartNo))].filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.processList = [...new Set(sourceList.map(i => i.Process))].filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.itemNoList = [...new Set(sourceList.map(i => i.ItemNo))].filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.statusList = [...new Set(sourceList.map(i => i.Status))].filter(x => x).sort().map(x => ({ label: x, value: x }));
        this.toolingTypeList = [...new Set(sourceList.map(i => i.ToolingType))].filter(x => x).sort().map(x => ({ label: x, value: x }));
    }

    toggleFilter(column: string) {
        this.activeFilter = this.activeFilter === column ? null : column;
    }

    @HostListener('document:click', ['$event'])
    closeFilter(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.filter-wrapper')) {
            this.activeFilter = null;
        }
    }

    onFilter() {
        this.filteredList = this.historyList.filter(item => this.checkItemMatch(item));
        this.currentPage = 1; // Reset to page 1 on filter
        this.updatePaginatedList();
        this.updateDropdownsCascading();
    }

    checkItemMatch(item: any, ignoreKey: string = ''): boolean {
        const matchDivision = ignoreKey === 'Division' || !this.selectedDivisions?.length || this.selectedDivisions.includes(item.Division);
        const matchPartNo = ignoreKey === 'PartNo' || !this.selectedPartNos?.length || this.selectedPartNos.includes(item.PartNo);
        const matchProcess = ignoreKey === 'Process' || !this.selectedProcesses?.length || this.selectedProcesses.includes(item.Process);
        const matchItemNo = ignoreKey === 'ItemNo' || !this.selectedItemNos?.length || this.selectedItemNos.includes(item.ItemNo);
        const matchStatus = ignoreKey === 'Status' || !this.selectedStatuses?.length || this.selectedStatuses.includes(item.Status);
        const matchToolingType = ignoreKey === 'ToolingType' || !this.selectedToolingTypes?.length || this.selectedToolingTypes.includes(item.ToolingType);

        // Date Filter
        let matchDate = true;
        if (ignoreKey !== 'DateTime_Record' && (this.fromDate || this.toDate)) {
            const itemDate = new Date(item.DateTime_Record);
            itemDate.setHours(0, 0, 0, 0);

            if (this.fromDate) {
                const start = new Date(this.fromDate);
                start.setHours(0, 0, 0, 0);
                if (itemDate < start) matchDate = false;
            }
            if (this.toDate) {
                const end = new Date(this.toDate);
                end.setHours(0, 0, 0, 0);
                if (itemDate > end) matchDate = false;
            }
        }

        return matchDivision && matchPartNo && matchProcess && matchItemNo && matchStatus && matchToolingType && matchDate;
    }

    updateDropdownsCascading() {
        this.divisionList = this.getUniqueValues('Division');
        this.partNoList = this.getUniqueValues('PartNo');
        this.processList = this.getUniqueValues('Process');
        this.itemNoList = this.getUniqueValues('ItemNo');
        this.statusList = this.getUniqueValues('Status');
        this.toolingTypeList = this.getUniqueValues('ToolingType');
    }

    getUniqueValues(key: string): any[] {
        const list = this.historyList
            .filter(item => this.checkItemMatch(item, key))
            .map(item => item[key]);
        return [...new Set(list)].filter(x => x).sort().map(x => ({ label: x, value: x }));
    }

    clearFilters() {
        this.activeFilter = null;
        this.selectedDivisions = [];
        this.selectedPartNos = [];
        this.selectedProcesses = [];
        this.selectedItemNos = [];
        this.selectedStatuses = [];
        this.selectedToolingTypes = [];
        this.fromDate = '';
        this.toDate = '';
        this.currentPage = 1;
        this.onFilter();
    }

    clearAll() {
        Swal.fire({
            title: 'Are you sure?',
            text: "ระบบจะทำการล้างรายการตัวกรองทั้งหมด",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, clear all!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.clearFilters();
                Swal.fire({
                    title: 'Cleared!',
                    text: 'ตัวกรองทั้งหมดถูกล้างเรียบร้อยแล้ว',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }

    // Sorting Logic
    onSort(key: string) {
        if (this.sortKey === key) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortKey = key;
            this.sortAsc = true;
        }

        this.filteredList.sort((a, b) => {
            const valA = a[key] ?? '';
            const valB = b[key] ?? '';

            if (key === 'DateTime_Record' || key === 'DueDate' || key === 'DateComplete') {
                const dateA = new Date(valA).getTime();
                const dateB = new Date(valB).getTime();
                return this.sortAsc ? dateA - dateB : dateB - dateA;
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                return this.sortAsc ? valA - valB : valB - valA;
            }

            return this.sortAsc
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA));
        });

        this.currentPage = 1;
        this.updatePaginatedList();
    }

    // 📄 Pagination Logic
    updatePaginatedList() {
        this.totalPages = Math.ceil(this.filteredList.length / this.pageSize);
        if (this.totalPages < 1) this.totalPages = 1;

        // Ensure current page is valid
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.paginatedList = this.filteredList.slice(startIndex, endIndex);

        this.generatePageNumbers();
    }

    generatePageNumbers() {
        const pagesToShow = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(pagesToShow / 2));
        let endPage = Math.min(this.totalPages, startPage + pagesToShow - 1);

        if (endPage - startPage + 1 < pagesToShow) {
            startPage = Math.max(1, endPage - pagesToShow + 1);
        }

        this.pages = [];
        for (let i = startPage; i <= endPage; i++) {
            this.pages.push(i);
        }
    }

    setPage(page: number) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.updatePaginatedList();

        // Scroll to top of table
        const table = document.querySelector('.table-responsive');
        if (table) table.scrollTop = 0;
    }

    exportExcel() {
        alert("Export to Excel functionality using combined view data to be implemented.");
    }
}
