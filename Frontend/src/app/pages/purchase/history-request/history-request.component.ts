import { Component,OnInit} from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { PurchaseHistoryservice } from '../../../core/services/PurchaseHistory.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-history-request',
  standalone: true,
  imports: [SidebarPurchaseComponent,RouterOutlet,NotificationComponent,CommonModule,FormsModule],
  templateUrl: './history-request.component.html',
  styleUrl: './history-request.component.scss'
})
export class HistoryRequestComponent implements OnInit {
requests: any[] = [];
filteredRequests: any[] = [];
statussList: { label: string, value: string }[] = [];
partNoList: { label: string, value: string }[] = [];
selectedPartNo: string | null = null;

fromDate: string = '';
toDate: string = '';
Status_: string | null = null;

sortOrder: 'asc' | 'desc' = 'asc';

constructor(private purchasehistory: PurchaseHistoryservice) {}

ngOnInit() {

this.Purchase_History();
}

Purchase_History() {
this.purchasehistory.Purchase_History().subscribe({
next: (response: any[]) => {
// console.log(' Raw response:', response); // ตรวจว่า API ส่งข้อมูลมาไหม

this.requests = [...response];
this.filteredRequests = [...this.requests];

// console.log(' All requests:', this.requests); // ดูข้อมูลทั้งหมด
// console.log(' กำลังกรองเฉพาะ Status = "complete"');

// กรองเฉพาะ Status = 'complete'
this.filteredRequests = this.requests.filter(r => r.Status === 'Complete');

// console.log(' Filtered requests:', this.filteredRequests); // หลังกรอง

// PartNo dropdown
const uniquePartNo = [...new Set(this.requests.map(r => r.PartNo))];
this.partNoList = uniquePartNo.map(p => ({
label: p,
value: p
}));
// console.log(' PartNo List:', this.partNoList);

// Status dropdown
const uniqueStatus = [...new Set(this.requests.map(r => r.Status))];
this.statussList = uniqueStatus.map(s => ({
label: s,
value: s
}));

this.onFilter();
// console.log(' Status List:', this.statussList);
},
error: (e: any) => {
// console.error(' Error from API:', e);
}
});
}

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

    this.onSort();
  }

    //  เรียงลำดับจาก DueDate เก่าสุด -> ล่าสุด
  onSort() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';

    this.filteredRequests.sort((a, b) => {
      const dateA = new Date(a.DueDate).getTime();
      const dateB = new Date(b.DueDate).getTime();
      return dateA - dateB; // เรียงจากเก่า -> ใหม่
    });
  }

showSuccessAlert(){
  const swalWithBootstrapButtons = Swal.mixin({
  customClass: {
    confirmButton: "btn btn-success me-3",
    cancelButton: "btn btn-danger"
  },
  buttonsStyling: false
});
swalWithBootstrapButtons.fire({
  title: "Export To AS400?",
  // text: "You won't be able to revert this!",
  icon: "warning",
  showCancelButton: true,
  confirmButtonText: "Yes",
  cancelButtonText: "No",
  // reverseButtons: true
}).then((result) => {
  if (result.isConfirmed) {
    swalWithBootstrapButtons.fire({
      title: "Export AS400 Success!",
      // text: "Your file has been deleted.",
      icon: "success"
    });
  } else if (
    /* Read more about handling dismissals below */
    result.dismiss === Swal.DismissReason.cancel
  ) {
    swalWithBootstrapButtons.fire({
      title: "Cancelled",
      // text: "Your imaginary file is safe :)",
      icon: "error"
    });
  }
});
}
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
