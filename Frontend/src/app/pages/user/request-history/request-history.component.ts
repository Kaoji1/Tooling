import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
// import { HttpClientModule } from '@angular/common/http'; // Uncomment when service is ready
// import Swal from 'sweetalert2';
// import * as XLSX from 'xlsx';

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
    isLoading: boolean = false;

    // Dropdown Lists for Filtering
    divisionList: any[] = [];
    partNoList: any[] = [];
    processList: any[] = [];
    itemNoList: any[] = [];

    // Filter Models
    selectedDivisions: any[] = [];
    selectedPartNos: any[] = [];
    selectedProcesses: any[] = [];
    selectedItemNos: any[] = [];
    reqDate: string = '';

    // Sorting
    sortKey: string = '';
    sortAsc: boolean = true;

    fileName = "RequestHistory.xlsx";

    constructor() { }

    ngOnInit() {
        this.loadHistory();
    }

    loadHistory() {
        // TODO: Replace with actual service call when API is ready
        // this.isLoading = true;

        // Mock data for UI development based on requested columns
        this.historyList = [

        ];

        this.extractDropdowns();
        this.filteredList = [...this.historyList];
        // this.isLoading = false;
    }

    extractDropdowns() {
        this.divisionList = [...new Set(this.historyList.map(i => i.Div))].filter(x => x).map(x => ({ label: x, value: x }));
        this.partNoList = [...new Set(this.historyList.map(i => i.Part_No))].filter(x => x).map(x => ({ label: x, value: x }));
        this.processList = [...new Set(this.historyList.map(i => i.Process))].filter(x => x).map(x => ({ label: x, value: x }));
        this.itemNoList = [...new Set(this.historyList.map(i => i.Item_No))].filter(x => x).map(x => ({ label: x, value: x }));
    }

    onFilter() {
        this.filteredList = this.historyList.filter(item => {
            // Filter by Dropdowns (Multi-select)
            const matchDivision = !this.selectedDivisions?.length || this.selectedDivisions.includes(item.Div);
            const matchPartNo = !this.selectedPartNos?.length || this.selectedPartNos.includes(item.Part_No);
            const matchProcess = !this.selectedProcesses?.length || this.selectedProcesses.includes(item.Process);
            const matchItemNo = !this.selectedItemNos?.length || this.selectedItemNos.includes(item.Item_No);

            // Filter by Date
            let matchDate = true;
            if (this.reqDate) {
                const itemDate = new Date(item.Req_Date);
                itemDate.setHours(0, 0, 0, 0);
                const filterDate = new Date(this.reqDate);
                filterDate.setHours(0, 0, 0, 0);

                if (itemDate.getTime() !== filterDate.getTime()) {
                    matchDate = false;
                }
            }

            return matchDivision && matchPartNo && matchProcess && matchItemNo && matchDate;
        });
    }

    clearFilters() {
        this.selectedDivisions = [];
        this.selectedPartNos = [];
        this.selectedProcesses = [];
        this.selectedItemNos = [];
        this.reqDate = '';
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

            if (key === 'Req_Date') {
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

    exportExcel() {
        // TODO: Implement excel export
        alert("Export to Excel functionality to be implemented.");
    }
}
