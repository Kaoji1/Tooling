import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { ReturnService } from '../../../core/services/return.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-return-history',
    standalone: true,
    imports: [CommonModule, SidebarComponent, HttpClientModule, FormsModule, NgSelectModule],
    templateUrl: './return-history.component.html',
    styleUrls: ['./return-history.component.scss']
})
export class ReturnHistoryComponent implements OnInit {
    historyList: any[] = [];
    filteredList: any[] = [];
    isLoading: boolean = true;
    selectAllCheck: boolean = false;

    // Dropdown Lists
    divisionList: any[] = [];
    partNoList: any[] = [];
    itemNoList: any[] = [];
    docNoList: any[] = [];
    statusList: any[] = [];

    // Filter Models
    selectedDivisions: any[] = [];
    selectedPartNos: any[] = [];
    selectedItemNos: any[] = [];
    selectedDocNos: any[] = [];
    fromDate: string = '';
    toDate: string = '';

    // Sorting
    sortKey: string = '';
    sortAsc: boolean = true;

    fileName = "ReturnHistory.xlsx";

    constructor(private returnService: ReturnService) { }

    ngOnInit() {
        this.loadHistory();
    }

    loadHistory() {
        this.isLoading = true;
        this.returnService.getReturnHistory().subscribe({
            next: (data) => {
                console.log('Return History Data:', data);
                this.historyList = data.map(item => ({
                    ...item,
                    Selection: false, // For checkbox
                    // Ensure fields are strings for search
                    Division: item.Division || '',
                    PartNo: item.PartNo || '',
                    ItemNo: item.ItemNo || '',
                    Doc_No: item.Doc_No || '',
                    Status: item.Status || 'Pending'
                }));

                this.extractDropdowns();
                this.filteredList = [...this.historyList]; // Initial display
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading history:', err);
                this.isLoading = false;
                Swal.fire('Error', 'Failed to load history data.', 'error');
            }
        });
    }

    extractDropdowns() {
        this.divisionList = [...new Set(this.historyList.map(i => i.Division))].filter(x => x).map(x => ({ label: x, value: x }));
        this.partNoList = [...new Set(this.historyList.map(i => i.PartNo))].filter(x => x).map(x => ({ label: x, value: x }));
        this.itemNoList = [...new Set(this.historyList.map(i => i.ItemNo))].filter(x => x).map(x => ({ label: x, value: x }));
        this.docNoList = [...new Set(this.historyList.map(i => i.Doc_No))].filter(x => x).map(x => ({ label: x, value: x }));
        // Status if needed
    }

    onFilter() {
        this.filteredList = this.historyList.filter(item => {
            // Filter by Dropdowns (Multi-select)
            const matchDivision = !this.selectedDivisions?.length || this.selectedDivisions.includes(item.Division);
            const matchPartNo = !this.selectedPartNos?.length || this.selectedPartNos.includes(item.PartNo);
            const matchItemNo = !this.selectedItemNos?.length || this.selectedItemNos.includes(item.ItemNo);
            const matchDocNo = !this.selectedDocNos?.length || this.selectedDocNos.includes(item.Doc_No);

            // Filter by Date
            let matchDate = true;
            if (this.fromDate || this.toDate) {
                const itemDate = new Date(item.DateTime_Record);
                itemDate.setHours(0, 0, 0, 0); // Ignore time

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

            return matchDivision && matchPartNo && matchItemNo && matchDocNo && matchDate;
        });
    }

    clearFilters() {
        this.selectedDivisions = [];
        this.selectedPartNos = [];
        this.selectedItemNos = [];
        this.selectedDocNos = [];
        this.fromDate = '';
        this.toDate = '';
        this.onFilter();
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

            if (key === 'DateTime_Record' || key === 'Return_Date') {
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
    }

    // Checkbox Logic
    toggleAllCheckboxes() {
        this.filteredList.forEach(item => item.Selection = this.selectAllCheck);
    }

    onCheckboxChange(item: any) {
        // If one is unchecked, uncheck "Select All"
        if (!item.Selection) {
            this.selectAllCheck = false;
        }
    }

    getRowClass(item: any): string {
        return item.Selection ? 'row-selected' : '';
    }

    // Export Logic
    exportExcel() {
        const selected = this.filteredList.filter(i => i.Selection);
        const dataToExport = selected.length > 0 ? selected : this.filteredList; // Export selected or all visible

        if (dataToExport.length === 0) {
            Swal.fire('Warning', 'No data to export', 'warning');
            return;
        }

        // Map to nice column names
        const exportData = dataToExport.map((item, index) => ({
            'No.': index + 1,
            'Doc No': item.Doc_No,
            'Date': item.DateTime_Record,
            'Employee ID': item.Employee_ID,
            'Return By': item.Return_By,
            'Division': item.Division,
            'Facility': item.Facility,
            'Part No': item.PartNo,
            'Item Name': item.ItemName,
            'Spec': item.Spec,
            'QTY': item.QTY,
            'Remark': item.Remark,
            'Status': item.Status
        }));

        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'History');
        XLSX.writeFile(wb, this.fileName);
    }

    // Placeholder for AS400 Button (if visual only for now)
    exportAS400() {
        Swal.fire('Info', 'AS400 Export not configured for Return History yet.', 'info');
    }
}
