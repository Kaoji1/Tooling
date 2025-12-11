import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { DropdownSearchComponent } from '../../../components/dropdown-search/dropdown-search.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { NgForOf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { HistoryPrint } from '../../../core/services/HistoryPrint.service';

@Component({
  selector: 'app-history-print',
  standalone: true,
  imports: [RouterOutlet,
    SidebarComponent,
    DropdownSearchComponent,
    NotificationComponent,
    NgForOf,
    CommonModule,
    FormsModule,
    NgSelectModule],
  templateUrl: './history-print.component.html',
  styleUrl: './history-print.component.scss'
})

export class HistoryPrintComponent implements OnInit {

  history: any[] = [];           // เก็บข้อมูลเต็มจาก API
  requests: any[] = [];          // เก็บข้อมูลสำหรับกรอง
  filteredRequests: any[] = [];  // ข้อมูลที่แสดงหลังกรอง
  docNumbers: string[] = [];     // เก็บ DocNo ทั้งหมด
  selectedDocNo: string | null = null; // DocNo ที่เลือกใน Dropdown

  constructor(private historyService: HistoryPrint) { }

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.historyService.HistoryPrint().subscribe({
      next: (response: any[]) => {
        this.history = response;
        this.requests = response;
        this.docNumbers = Array.from(new Set(response.map(item => item.DocNo)));
        this.filteredRequests = [...this.requests]; // แสดงทั้งหมดตอนเริ่ม
      },
      error: (e) => console.error(e)
    });
  }

  onFilter() {
  if (!this.selectedDocNo) {
    this.filteredRequests = [...this.requests]; // แสดงทั้งหมด
  } else {
    this.filteredRequests = this.requests.filter(
      item => item.DocNo === this.selectedDocNo
    );
  }
}
onSort() {
  if (this.filteredRequests && this.filteredRequests.length > 0) {
    this.filteredRequests.sort((a, b) =>
      new Date(a.Date_Record).getTime() - new Date(b.Date_Record).getTime()
    );
  }
}


}
