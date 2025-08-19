import { Component, OnInit } from '@angular/core';
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
  imports: [SidebarPurchaseComponent, RouterOutlet, NotificationComponent, CommonModule, FormsModule],
  templateUrl: './history-request.component.html',
  styleUrls: ['./history-request.component.scss']
})
export class HistoryRequestComponent implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];
  statussList: { label: string, value: string }[] = [];
  partNoList: { label: string, value: string }[] = [];
  selectedPartNo: string | null = null;
  selectAllCheck: boolean = false;

  fromDate: string = '';
  toDate: string = '';
  Status_: string | null = 'Complete'; // ตั้งค่าเริ่มต้นเป็น Complete

  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private purchasehistory: PurchaseHistoryservice) {}

  ngOnInit() {
    this.loadPurchaseHistory();
  }

toggleAllCheckboxes() {
    this.requests.forEach(item => item.Selection = this.selectAllCheck);
    localStorage.setItem('purchaseRequest', JSON.stringify(this.requests));
  }  


loadPurchaseHistory() {
  console.log('--- loadPurchaseHistory เริ่มต้น ---');
  this.purchasehistory.Purchase_History().subscribe({
    next: (response: any[]) => {
      console.log('Raw response from API:', response);

      // แทนค่า null/undefined ด้วยค่า default
      this.requests = response.map(item => ({
        ...item,
        PartNo: item.PartNo ?? '',
        Status: item.Status ?? '',
        DateRequest: item.DateRequest ?? item.DueDate ?? '',
        ItemNo: item.ItemNo ?? '-',
        MFG_Order_No: item.MFG_Order_No ?? '-',
        Document_No: item.Document_No ?? '-',
        Stock_Location: item.Stock_Location ?? '-',
        QTY: item.QTY ?? 0,
        MC_No: item.MC_No ?? '-'
      }));

      // กรองเฉพาะ Status = 'Complete'
      this.filteredRequests = this.requests.filter(r => r.Status === 'Complete');
      console.log('Filtered requests after Status=Complete:', this.filteredRequests);

      // สร้าง PartNo dropdown แบบไม่รวมค่าว่าง
      // const uniquePartNo = [...new Set(this.requests.map(r => r.PartNo).filter(p => p))];
      // this.partNoList = uniquePartNo.map(p => ({ label: p, value: p }));
      // console.log('PartNo dropdown list:', this.partNoList);

      // // สร้าง Status dropdown แบบไม่รวมค่าว่าง
      // const uniqueStatus = [...new Set(this.requests.map(r => r.Status).filter(s => s))];
      // this.statussList = uniqueStatus.map(s => ({ label: s, value: s }));
      // console.log('Status dropdown list:', this.statussList);

      // // เรียงลำดับตาม DueDate (null-safe)
      // this.filteredRequests.sort((a, b) => {
      //   const dateA = a.DueDate ? new Date(a.DueDate).getTime() : 0;
      //   const dateB = b.DueDate ? new Date(b.DueDate).getTime() : 0;
      //   return dateA - dateB;
      // });

      console.log('Filtered requests after sortByDueDate:', this.filteredRequests);
    },
    error: e => console.error('Error from API:', e)
  });
}
getRowClass(item: any): string {
  if (item.Selection) {
    return 'row-selected'; // ถ้าติ๊ก checkbox
  }
  return ''; // ปกติ
}

// onFilter() {
//   console.log('--- onFilter เริ่มต้น ---');
//   console.log('Current filter values: fromDate=', this.fromDate, 'toDate=', this.toDate, 'Status_=', this.Status_, 'selectedPartNo=', this.selectedPartNo);

//   this.filteredRequests = this.requests.filter(item => {
//     const itemDate = new Date(item.DateRequest || item.DueDate);
//     const matchDate =
//       (!this.fromDate || itemDate >= new Date(this.fromDate)) &&
//       (!this.toDate || itemDate <= new Date(this.toDate));

//     const matchStatus = !this.Status_ || item.Status === this.Status_;
//     const matchPartNo = !this.selectedPartNo || item.PartNo === this.selectedPartNo;

//     const result = matchDate && matchStatus && matchPartNo;
//     console.log(`Item: ${item.PartNo}, Status: ${item.Status}, Date: ${itemDate} -> match: ${result}`);
//     return result;
//   });

  // this.sortByDueDate();
  // console.log('Filtered requests after onFilter & sort:', this.filteredRequests);


// sortByDueDate() {
//   console.log('--- sortByDueDate เริ่มต้น ---');
//   this.filteredRequests.sort((a, b) => {
//     const dateA = new Date(a.DueDate).getTime();
//     const dateB = new Date(b.DueDate).getTime();
//     return dateA - dateB; // เก่าสุด → ล่าสุด
//   });
//   console.log('Filtered requests after sortByDueDate:', this.filteredRequests);



  showSuccessAlert() {
    Swal.fire({
      title: 'Export To AS400?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      customClass: { confirmButton: 'btn btn-success me-3', cancelButton: 'btn btn-danger' },
      buttonsStyling: false
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Export AS400 Success!', icon: 'success' });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({ title: 'Cancelled', icon: 'error' });
      }
    });
  }

  showAlert() {
    Swal.fire({
      title: 'Export To Excel?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      customClass: { confirmButton: 'btn btn-success me-3', cancelButton: 'btn btn-danger' },
      buttonsStyling: false
    }).then(result => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'Export AS400 Success!', icon: 'success' });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({ title: 'Cancelled', icon: 'error' });
      }
    });
  }

  
}


// import { Component,OnInit} from '@angular/core';
// import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
// import { NotificationComponent } from '../../../components/notification/notification.component';
// import { RouterOutlet } from '@angular/router';
// import { PurchaseHistoryservice } from '../../../core/services/PurchaseHistory.service';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import Swal from 'sweetalert2';
// // import { ExportToExcelService } from '../../core/services/ExportToExcel.service';

// @Component({
//   selector: 'app-history-request',
//   standalone: true,
//   imports: [SidebarPurchaseComponent,RouterOutlet,NotificationComponent,CommonModule,FormsModule],
//   templateUrl: './history-request.component.html',
//   styleUrl: './history-request.component.scss'
// })
// export class HistoryRequestComponent implements OnInit {
// requests: any[] = [];
// filteredRequests: any[] = [];
// statussList: { label: string, value: string }[] = [];
// partNoList: { label: string, value: string }[] = [];
// selectedPartNo: string | null = null;

// fromDate: string = '';
// toDate: string = '';
// Status_: string | null = null;

// sortOrder: 'asc' | 'desc' = 'asc';

// constructor(private purchasehistory: PurchaseHistoryservice) {}

// ngOnInit() {
// this.Purchase_History();
// }

// Purchase_History() {
// this.purchasehistory.Purchase_History().subscribe({
// next: (response: any[]) => {
//  console.log(' Raw response:', response); // ตรวจว่า API ส่งข้อมูลมาไหม

// this.requests = [...response];
// this.filteredRequests = [...this.requests];

//  console.log(' All requests:', this.requests); // ดูข้อมูลทั้งหมด
//  console.log(' กำลังกรองเฉพาะ Status = "complete"');

// // กรองเฉพาะ Status = 'complete'
// this.filteredRequests = this.requests.filter(r => r.Status === 'Complete');

//  console.log(' Filtered requests:', this.filteredRequests); // หลังกรอง

// // PartNo dropdown
// const uniquePartNo = [...new Set(this.requests.map(r => r.PartNo))];
// this.partNoList = uniquePartNo.map(p => ({
// label: p,
// value: p
// }));
//  console.log(' PartNo List:', this.partNoList);

// // Status dropdown
// const uniqueStatus = [...new Set(this.requests.map(r => r.Status))];
// this.statussList = uniqueStatus.map(s => ({
// label: s,
// value: s
// }));

// this.onFilter();
//  console.log(' Status List:', this.statussList);
// },
// error: (e: any) => {
//  console.error(' Error from API:', e);
// }
// });
// }

// onFilter() {
//     this.filteredRequests = this.requests.filter(item => {
//       const itemDate = new Date(item.DateRequest || item.DueDate);

//       const matchDate =
//         (!this.fromDate || itemDate >= new Date(this.fromDate)) &&
//         (!this.toDate || itemDate <= new Date(this.toDate));

//       const matchStatus =
//         !this.Status_ || item.Status === this.Status_;

//       return matchDate && matchStatus;
//     });

//     this.onSort();
//   }

//     //  เรียงลำดับจาก DueDate เก่าสุด -> ล่าสุด
//   onSort() {
//     this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';

//     this.filteredRequests.sort((a, b) => {
//       const dateA = new Date(a.DueDate).getTime();
//       const dateB = new Date(b.DueDate).getTime();
//       return dateA - dateB; // เรียงจากเก่า -> ใหม่
//     });

// //   getStatusClass(status: string): string {
// //   const s = status?.toLowerCase().trim();
// //   if (s === 'complete') return 'bg-complete';
// //   if (s === 'waiting') return 'bg-waiting';
 
// //   return '';
// // }
//   }

// showSuccessAlert(){
//   const swalWithBootstrapButtons = Swal.mixin({
//   customClass: {
//     confirmButton: "btn btn-success me-3",
//     cancelButton: "btn btn-danger"
//   },
//   buttonsStyling: false
// });
// swalWithBootstrapButtons.fire({
//   title: "Export To AS400?",
//   // text: "You won't be able to revert this!",
//   icon: "warning",
//   showCancelButton: true,
//   confirmButtonText: "Yes",
//   cancelButtonText: "No",
//   // reverseButtons: true
// }).then((result) => {
//   if (result.isConfirmed) {
//     swalWithBootstrapButtons.fire({
//       title: "Export AS400 Success!",
//       // text: "Your file has been deleted.",
//       icon: "success"
//     });
//   } else if (
//     /* Read more about handling dismissals below */
//     result.dismiss === Swal.DismissReason.cancel
//   ) {
//     swalWithBootstrapButtons.fire({
//       title: "Cancelled",
//       // text: "Your imaginary file is safe :)",
//       icon: "error"
//     });
//   }
// });
// }
//  showAlert(): void {
//     const swalWithBootstrapButtons = Swal.mixin({
//       customClass: {
//         confirmButton: "btn btn-success me-3",
//         cancelButton: "btn btn-danger"
//       },
//       buttonsStyling: false
//     });

//     swalWithBootstrapButtons.fire({
//       title: "Export To Excel?",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes",
//       cancelButtonText: "No",
//     }).then((result) => {
//       if (result.isConfirmed) {
//         swalWithBootstrapButtons.fire({
//           title: "Export AS400 Success!",
//           icon: "success"
//         });
//       } else if (result.dismiss === Swal.DismissReason.cancel) {
//         swalWithBootstrapButtons.fire({
//           title: "Cancelled",
//           icon: "error"
//         });
//       }
//     });
//   }
// }
//   ExportToExcelService() {
//     this.ExportToExcelService.downloadExcel().subscribe((res: Blob) => {
//       const url = window.URL.createObjectURL(res);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'RequestHistory.xlsx'; // ชื่อไฟล์
//       a.click();
//       window.URL.revokeObjectURL(url);
//     }, error => {
//       console.error('Export failed', error);
//     });
//   }
// }









// ExportToExcel(){
//     const swalWithBootstrapButtons = Swal.mixin({
//   customClass: {
//     confirmButton: "btn btn-success me-3",
//     cancelButton: "btn btn-danger"
//   },
//   buttonsStyling: false
// });
// swalWithBootstrapButtons.fire({
//   title: "Export To AS400?",
//   // text: "You won't be able to revert this!",
//   icon: "warning",
//   showCancelButton: true,
//   confirmButtonText: "Yes",
//   cancelButtonText: "No",
//   // reverseButtons: true
// }).then((result) => {
//   if (result.isConfirmed) {
//     swalWithBootstrapButtons.fire({
//       title: "Export AS400 Success!",
//       // text: "Your file has been deleted.",
//       icon: "success"
//     });
//   } else if (
//     /* Read more about handling dismissals below */
//     result.dismiss === Swal.DismissReason.cancel
//   ) {
//     swalWithBootstrapButtons.fire({
//       title: "Cancelled",
//       // text: "Your imaginary file is safe :)",
//       icon: "error"
//     });
//   }
// });
// }







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
