import { Component, OnInit } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PurchaseRequestService } from '../../../core/services/PurchaseRequest.service';

@Component({
  selector: 'app-requestlist',
  standalone: true,
  imports: [RouterOutlet,
    SidebarPurchaseComponent,
    NotificationComponent,
    FormsModule,
    CommonModule],
  templateUrl: './requestlist.component.html',
  styleUrl: './requestlist.component.scss'
})
export class RequestlistComponent   {
  request:any[]=[];

   selectedCase: string = '';
   data:any[]=[];
  // router: any;

  
  constructor( //โหลดทันทีที่รันที่จำเป็นต้องใช้ตอนเริ่มเว็ป
      private purchaserequest: PurchaseRequestService, 
      private router: Router
     
    ) {}

    goToDetail(itemNo: string) {
  console.log('Going to detail for ItemNo:', itemNo); // debug
  this.router.navigate(['/purchase/detail', itemNo], {
    state: { items: this.request }
  });
}

async ngOnInit()  {
    this.Purchase_Request();
  }

Purchase_Request() {
  this.purchaserequest.Purchase_Request().subscribe({
    next: (response: any[]) => {
      this.request = [...this.request, ...response];//เรียงข้อมูลต่อล่าง

      // สร้างรายการ PartNo ที่ไม่ซ้ำ

    },
    error: (e: any) => console.error(e),
  });
}
}

// item = {
//     inputDate: new Date()
//   };
//   requestItems: any[] = [];

//   constructor(private router: Router) {}


//   ngOnInit() {
//     this.loadRequest();
//   }

//   viewDetail(item: any) {
//     localStorage.setItem('selectedItem', JSON.stringify(item));
//     this.router.navigate(['/detail']);
//   }

//   loadRequest() {
//     const storedRequest = sessionStorage.getItem('request');
//     if (storedRequest) {
//       const simpleRequest = JSON.parse(storedRequest);
//       this.requestItems = simpleRequest.map((requestItem: any) => {
//         const detail = MOCKDATA.find(d => d.partNo === requestItem.partNo);
//         return {
//           ...detail,
//           qty: requestItem.qty,
//           Process: requestItem.process,
//           Spec: requestItem.spec,
//           MachineType: requestItem.machineType,
//           inputDate: requestItem.inputDate,
//           setupDate: requestItem.setupDate,
//           factory: requestItem.factory,
//           division: requestItem.division,
//           case: requestItem.case,
//           caseother: requestItem.caseother,
//           machineNoother: requestItem.machineNoother
//         };
//       });
//     }
//     // Do not remove 'request' here to retain data across navigations
//   }

//   Create_Doc() {
//     if (confirm('Do you want to create this document?')) {
//       const createdDocNo = 'DOC-' + new Date().getTime();
//       const itemsToSave = [...this.requestItems];

//       const doc = {
//         doc_no: createdDocNo,
//         items: itemsToSave,
//         date: new Date().toLocaleDateString(),
//         status: 'Pending'
//       };

//       const existingDocs = sessionStorage.getItem('created_docs');
//       const docs = existingDocs ? JSON.parse(existingDocs) : [];

//       this.requestItems = []; // Clear the displayed items
//       sessionStorage.removeItem('request'); // Clear the request data after creation

//       docs.push(doc);
//       sessionStorage.setItem('created_docs', JSON.stringify(docs));

//       alert(`Document created successfully!\nDoc No: ${createdDocNo}`);
//       this.router.navigate(['/requestlist']);
//     }
//   }
