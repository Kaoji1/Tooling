import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationPurchaseComponent } from '../../../components/notification/notificationPurchase.component';
import { RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseRequestService } from '../../../core/services/PurchaseRequest.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-requestlist',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarPurchaseComponent,
    NotificationPurchaseComponent,
    FormsModule,
    NgSelectModule,
    CommonModule
  ],
  templateUrl: './requestlist.component.html',
  styleUrl: './requestlist.component.scss'
})
export class RequestlistComponent implements OnInit {
  request: any[] = [];

  categoryList: { label: string; value: string }[] = [];
  divisionList: { label: string; value: string }[] = [];
  processList: { label: string; value: string }[] = [];
  itemList: { label: string; value: string }[] = [];

  Catagory_: string | null = null;
  Case_: string | null = null;
  Division_: string | null = null;
  Process_: string | null = null;
  Item_: string | null = null;

  // การ sort ตาราง
  sortKey: string = '';   // คอลัมน์ที่ sort
  sortAsc: boolean = true; // true = ASC, false = DESC

  selectedCase: string = '';
  filteredRequests: any[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 1;
  displayedRequests: any[] = [];
  pages: number[] = []; // for pagination UI loop
  fromDate: string | null = null;
  toDate: string | null = null;

  constructor(
    private purchaserequest: PurchaseRequestService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  goToDetail(itemNo: string, category: string) {
    const itemsInCategory = this.request.filter(x =>
      String(x.ItemNo) === String(itemNo) &&
      String(x.Category ?? 'Unknown') === String(category)
    );

    // เช็คก่อนใช้ sessionStorage
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('request_filters', JSON.stringify({
        fromDate: this.fromDate,
        toDate: this.toDate,
        Catagory_: this.Catagory_,
        Division_: this.Division_,
        Process_: this.Process_,
        Item_: this.Item_
      }));
      sessionStorage.setItem('request_data', JSON.stringify(this.filteredRequests));
    }

    this.router.navigate(['/purchase/detail', itemNo], {
      queryParams: { category },
      state: { items: itemsInCategory }
    });
  }

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedFiltersStr = sessionStorage.getItem('request_filters');
      if (savedFiltersStr) {
        try {
          const filters = JSON.parse(savedFiltersStr);
          this.fromDate = filters.fromDate || null;
          this.toDate = filters.toDate || null;
          this.Catagory_ = filters.Catagory_ || null;
          this.Division_ = filters.Division_ || null;
          this.Process_ = filters.Process_ || null;
          this.Item_ = filters.Item_ || null;
        } catch (e) {
          console.error('Error parsing filters:', e);
        }
      }
    }

    await this.Purchase_Request();

    // หลังจากโหลดข้อมูลเสร็จ ถ้ามี filter ค้างอยู่ ให้ทำการ filter ข้อมูลทันที
    if (isPlatformBrowser(this.platformId)) {
      const savedFiltersStr = sessionStorage.getItem('request_filters');
      if (savedFiltersStr) {
        this.onFilter();
      }
    }
  }

  Purchase_Request(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.purchaserequest.Purchase_Request().subscribe({
        next: (response: any[]) => {
          const groupedMap = new Map<string, {
            Req_QTY: number,
            ID_Requests: Set<number>,
            item: any
          }>();

          response.forEach(item => {
            // ไม่ต้องเช็ค Status ที่นี่แล้วเพราะ Backend กรองมาให้
            const itemNo = item.ItemNo;
            const category = item.Category || '';
            const idRequest = item.ID_Request;
            const key = `${itemNo}_${category}`;

            if (groupedMap.has(key)) {
              const group = groupedMap.get(key)!;
              if (!group.ID_Requests.has(idRequest)) {
                group.Req_QTY += Number(item.Req_QTY);
                group.ID_Requests.add(idRequest);
              }
            } else {
              groupedMap.set(key, {
                Req_QTY: Number(item.Req_QTY),
                ID_Requests: new Set<number>([idRequest]),
                item: { ...item }
              });
            }
          });

          this.request = Array.from(groupedMap.values()).map(group => ({
            ...group.item,
            Req_QTY: group.Req_QTY,
            // Pre-calculate Date objects
            _parsedDateRecord: group.item.DateTime_Record ? new Date(group.item.DateTime_Record) : null
          }));

          this.filteredRequests = [...this.request];

          // Setup Dropdown Lists
          const uniqueDivisions = Array.from(new Set(this.request.map(r => r.Division).filter(Boolean)));
          this.divisionList = uniqueDivisions.map(div => ({ label: div, value: div }));

          const uniqueProcesses = Array.from(new Set(this.request.map(r => r.Process).filter(Boolean)));
          this.processList = uniqueProcesses.map(proc => ({ label: proc, value: proc }));

          const uniqueItems = Array.from(new Set(this.request.map(r => r.ItemNo).filter(Boolean)));
          this.itemList = uniqueItems.map(it => ({ label: it, value: it }));

          const uniqueCategories = Array.from(
            new Set(this.request.map(r => r.Category).filter(Boolean))
          );
          this.categoryList = uniqueCategories.map(cat => ({ label: cat, value: cat }));

          this.updatePagination();


          resolve();
        },
        error: (e: any) => {
          console.error('❌ API error:', e);
          reject(e);
        },
      });
    });
  }

  onFilter() {
    this.filteredRequests = this.request.filter(item => {
      const matchDivision = !this.Division_?.length || this.Division_.includes(item.Division);
      const matchCategory = !this.Catagory_?.length || this.Catagory_.includes(item.Category);
      const matchItemNo = !this.Item_?.length || this.Item_.includes(item.ItemNo);
      const matchProcess = !this.Process_?.length || this.Process_.includes(item.Process);

      const fromDateObj = this.fromDate ? new Date(this.fromDate) : null;
      if (fromDateObj) fromDateObj.setHours(0, 0, 0, 0);

      const toDateObj = this.toDate ? new Date(this.toDate) : null;
      if (toDateObj) toDateObj.setHours(23, 59, 59, 999);

      // Use pre-calculated date
      const reqDate = item._parsedDateRecord;

      let matchDate: boolean = true;
      if (reqDate) {
        if (fromDateObj && toDateObj) {
          matchDate = reqDate >= fromDateObj && reqDate <= toDateObj;
        } else if (fromDateObj) {
          matchDate = reqDate >= fromDateObj;
        } else if (toDateObj) {
          matchDate = reqDate <= toDateObj;
        }
      }

      return matchDivision && matchCategory && matchItemNo && matchProcess && matchDate;
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

    this.filteredRequests.sort((a, b) => {
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';

      const isDate = key.includes('Date') || key.includes('Time');
      if (isDate) {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
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
    this.totalPages = Math.ceil(this.filteredRequests.length / this.pageSize) || 1;

    // Ensure currentPage is valid
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedRequests = this.filteredRequests.slice(startIndex, endIndex);

    // Generate page numbers for UI (simple version, max 5 pages shown)
    // You might want a more complex logic for many pages, but this is a good start
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

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  clearFilters() {
    this.Catagory_ = null;
    this.Division_ = null;
    this.Process_ = null;
    this.Item_ = null;
    this.fromDate = null;
    this.toDate = null;

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('request_filters');
    }

    this.onFilter();
  }
}