import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { DropdownSearchComponent } from '../../../components/dropdown-search/dropdown-search.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { NgForOf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { UserHistoryService } from '../../../core/services/UserHistory.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterOutlet, 
    SidebarComponent, 
    DropdownSearchComponent, 
    NotificationComponent, 
    NgForOf,
    CommonModule,
    FormsModule,
    NgSelectModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];
  statussList:{ label: string, value: string }[] = [];
  partNoList: { label: string, value: string }[] = [];
  selectedPartNo: string | null = null;

  fromDate: string = '';
  toDate: string = '';
  Status_: string | null = null;



  constructor(private userhistory: UserHistoryService) {
   
  }

  ngOnInit() {
    this.User_History();
  }

  User_History() {
    this.userhistory.User_History().subscribe({
      next: (response: any[]) => {
        this.requests = [...response];
        this.filteredRequests = [...this.requests]; // แสดงทั้งหมดก่อน
        const uniquePartNo = [...new Set(this.requests.map(r => r.PartNo))];
        this.partNoList = uniquePartNo.map(p => ({
          label: p,
          value: p
        }));
        const uniqueStatus = [...new Set(this.requests.map(r => r.Status))];
        this.statussList = uniqueStatus.map(s => ({
          label: s,
          value: s
        }));
      },
      error: (e: any) => console.error(e),
    });
  }

  //  กรองตามช่วงวันที่, PartNo, Status
  onFilter() {
    this.filteredRequests = this.requests.filter(item => {
      const itemDate = new Date(item.DateRequest || item.DueDate);

      const matchDate =
        (!this.fromDate || itemDate >= new Date(this.fromDate)) &&
        (!this.toDate || itemDate <= new Date(this.toDate));

      const matchPartNo =
        !this.selectedPartNo || item.PartNo === this.selectedPartNo;

      const matchStatus =
        !this.Status_ || item.Status === this.Status_;

      return matchDate && matchPartNo && matchStatus;
    });
  }

  //  เรียงลำดับจาก DueDate เก่าสุด -> ล่าสุด
  onSort() {
    this.filteredRequests.sort((a, b) => {
      const dateA = new Date(a.DueDate).getTime();
      const dateB = new Date(b.DueDate).getTime();
      return dateA - dateB; // เรียงจากเก่า -> ใหม่
    });
  }
}

