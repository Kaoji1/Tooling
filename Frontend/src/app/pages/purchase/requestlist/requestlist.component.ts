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
      console.log('📥 ข้อมูลจาก API:', response); // ตรวจสอบข้อมูลที่ได้มา

      const groupedMap = new Map<string, {
        Req_QTY: number,
        ID_Requests: Set<number>,
        item: any
      }>();

      response.forEach(item => {
        if (item.Status === 'Waiting') {
          const itemNo = item.ItemNo;
          const category = item.Category || '';
          const idRequest = item.ID_Request;
          const key = `${itemNo}_${category}`; // ✅ ตรงนี้ต้องใช้ backtick

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
        }
      });

      // ✅ log รายการใน groupedMap
      console.log('🧩 groupedMap (หลังจากจัดกลุ่ม):', groupedMap);

      // แปลงเป็น array แล้วเก็บเข้า request
      this.request = Array.from(groupedMap.values()).map(group => ({
        ...group.item,
        Req_QTY: group.Req_QTY
      }));

      // ✅ log ค่าที่จะนำไปแสดง
      console.log('📊 this.request (ข้อมูลที่จะนำไปแสดง):', this.request);
    },

    error: (e: any) => console.error('❌ API error:', e),
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
