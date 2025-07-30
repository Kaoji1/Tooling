import { Component } from '@angular/core';
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
export class HistoryComponent {
  requests:any[]=[];
  partNoList: { label: string, value: string }[] = [];
  selectedPartNo: string | null = null;
  filteredRequests: any[] = [];  // ข้อมูลที่กรองแล้ว
  Status:any;
  fromDate: string = '';         // เก็บค่าวันเริ่ม
  toDate: string = ''; 
  Status_:any[]=[];          // เก็บค่าวันสิ้นสุด
  
   constructor( //โหลดทันทีที่รันที่จำเป็นต้องใช้ตอนเริ่มเว็ป
      private userhistory: UserHistoryService,
      
    ) {
      this.Status = [
        { label: 'Compelet', value: 'compelet' }, // ตัวเลือกเคสที่ 1
        { label: 'Process', value: 'Process' }, // ตัวเลือกเคสที่ 2
        { label: 'USA', value: 'USA' }, // ตัวเลือกเคสที่ 3
        
      ];
    }
     ngOnInit()  {
      this.User_History();
      
  }

 User_History() {
  this.userhistory.User_History().subscribe({
    next: (response: any[]) => {
      this.requests = [...this.requests, ...response];//เรียงข้อมูลต่อล่าง

      // สร้างรายการ PartNo ที่ไม่ซ้ำ
      const uniquePartNo = [...new Set(this.requests.map(r => r.PartNo))];

      this.partNoList = uniquePartNo.map(p => ({
        label: p,
        value: p
      }));
    },
    error: (e: any) => console.error(e),
  });
}
onSort() {
  this.filteredRequests = this.requests.filter(item => {
    const itemDate = new Date(item.DateRequest);

    const matchDate =
      (!this.fromDate || itemDate >= new Date(this.fromDate)) &&
      (!this.toDate || itemDate <= new Date(this.toDate));

    const matchPartNo =
      !this.selectedPartNo || item.PartNo === this.selectedPartNo;

    return matchDate && matchPartNo;
  });
}
}

