import { Component,OnInit} from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-history-request',
  standalone: true,
  imports: [SidebarPurchaseComponent,RouterOutlet,NotificationComponent],
  templateUrl: './history-request.component.html',
  styleUrl: './history-request.component.scss'
})
export class HistoryRequestComponent {

}
// export class HistoryRequestComponent implements OnInit {
//   request: any[] = [];
//   filterRequest: any[] = [];
//   statList: { label: string, value: string }[] = [];
//   completeNoList: { label: string, value: string }[] = [];
//   selectedPartNo: string | null = null;

//   fromDate: string = '';
//   toDate: string = '';
//   Status_: string | null = null;

//   // เพิ่มตัวแปรสำหรับเก็บสถานะการเรียงลำดับ
//   sortOrder: 'asc' | 'desc' = 'desc'; // ค่าเริ่มต้น: ล่าสุด -> เก่าสุด

//   constructor(
//     private purchaserequest: PurchaseRequestService,
//     private router: Router
//   ) {}

//   goToDetail(itemNo: string) {
//     this.router.navigate(['/purchase/detail', itemNo], {
//       state: { items: this.request }
//     });
//   }

//   ngOnInit() {
//     this.Purchase_Request();
//   }

//   Purchase_Request() {
//     this.purchaserequest.Purchase_Request().subscribe({
//       next: (response: any[]) => {
//         this.request = [...this.request, ...response];
//         this.filterRequest = [...this.request];
//         this.initDropdowns();
//         this.sortByDueDate(this.sortOrder); // เรียงลำดับตอนโหลดครั้งแรก
//       },
//       error: (e: any) => console.error(e),
//     });
//   }

//   initDropdowns() {
//     const uniquePartNo = [...new Set(this.request.map(r => r.PartNo))];
//     this.completeNoList = uniquePartNo.map(p => ({
//       label: p,
//       value: p
//     }));

//     const uniqueStatus = [...new Set(this.request.map(r => r.Status))];
//     this.statList = uniqueStatus.map(s => ({
//       label: s,
//       value: s
//     }));
//   }

//   onFilter() {
//     this.filterRequest = this.request.filter(item => {
//       const itemDate = new Date(item.DateRequest || item.DueDate);

//       const matchDate =
//         (!this.fromDate || itemDate >= new Date(this.fromDate)) &&
//         (!this.toDate || itemDate <= new Date(this.toDate));

//       const matchStatus =
//         !this.Status_ || item.Status === this.Status_;

//       return matchDate && matchStatus;
//     });

//     // เรียงลำดับหลังกรองข้อมูลเสร็จ
//     this.sortByDueDate(this.sortOrder);
//   }

//   // ฟังก์ชันเรียงลำดับข้อมูลตาม DueDate
//   sortByDueDate(order: 'asc' | 'desc') {
//     this.sortOrder = order;
//     this.filterRequest.sort((a, b) => {
//       const dateA = new Date(a.DueDate).getTime();
//       const dateB = new Date(b.DueDate).getTime();

//       if (order === 'asc') {
//         return dateA - dateB; // เก่าสุด -> ล่าสุด
//       } else {
//         return dateB - dateA; // ล่าสุด -> เก่าสุด
//       }
//     });
//   }
// }
