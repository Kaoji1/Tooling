import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationPurchaseComponent } from '../../../components/notification/notificationPurchase.component';
import { RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
// Using ReturnService if available, otherwise just mock
import { ReturnService } from '../../../core/services/return.service';

@Component({
    selector: 'app-returnlist',
    standalone: true,
    imports: [
        RouterOutlet,
        SidebarPurchaseComponent,
        NotificationPurchaseComponent,
        FormsModule,
        NgSelectModule,
        CommonModule
    ],
    templateUrl: './returnlist.component.html',
    styleUrl: './returnlist.component.scss'
})
export class ReturnlistComponent implements OnInit {
    returns: any[] = [];

    divisionList: { label: string; value: string }[] = [];
    statusList: { label: string; value: string }[] = [];

    Division_: string | null = null;
    Status_: string | null = null;
    dateFilter: string | null = null;

    // Sorting
    sortKey: string = '';
    sortAsc: boolean = true;

    filteredReturns: any[] = [];

    // Pagination
    currentPage: number = 1;
    pageSize: number = 20;
    totalPages: number = 1;
    displayedReturns: any[] = [];
    pages: number[] = [];

    constructor(
        private returnService: ReturnService, // If not used yet, we might mock
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit() {
        this.statusList = [
            { label: 'Pending', value: 'Pending' },
            { label: 'Confirmed', value: 'Confirmed' },
            { label: 'Rejected', value: 'Rejected' },
            // Add more as needed
        ];

        // In real scenario:
        // this.loadReturns();
    }

    onFilter() {
        this.filteredReturns = this.returns.filter(item => {
            const matchDivision = !this.Division_ || item.division === this.Division_;
            const matchStatus = !this.Status_ || item.status === this.Status_;

            let matchDate = true;
            if (this.dateFilter) {
                const filterDate = new Date(this.dateFilter);
                filterDate.setHours(0, 0, 0, 0);
                const itemDate = new Date(item.returnDate);
                itemDate.setHours(0, 0, 0, 0);
                matchDate = itemDate.getTime() === filterDate.getTime();
            }

            return matchDivision && matchStatus && matchDate;
        });
        this.currentPage = 1;
        this.updatePagination();
    }

    clearFilters() {
        this.Division_ = null;
        this.Status_ = null;
        this.dateFilter = null;
        this.onFilter();
    }

    onSort(key: string) {
        if (this.sortKey === key) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortKey = key;
            this.sortAsc = true;
        }

        this.filteredReturns.sort((a, b) => {
            const valA = a[key] ?? '';
            const valB = b[key] ?? '';

            if (key.includes('Date')) {
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

        this.updatePagination();
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredReturns.length / this.pageSize) || 1;
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        this.displayedReturns = this.filteredReturns.slice(startIndex, startIndex + this.pageSize);

        // Simple pagination logic
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(this.totalPages, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

        this.pages = [];
        for (let i = startPage; i <= endPage; i++) {
            this.pages.push(i);
        }
    }

    onPageChange(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagination();
        }
    }

    exportToExcel() {
        console.log('Export to Excel clicked');
        // Implement export logic here
    }

    confirmReturn(item: any) {
        console.log('Confirm return for item:', item);
        // Implement confirm logic
        item.status = 'Confirmed';
    }
}
