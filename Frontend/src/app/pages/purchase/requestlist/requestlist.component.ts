import { Component, OnInit } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PurchaseRequestService } from '../../../core/services/PurchaseRequest.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-requestlist',
  standalone: true,
  imports: [RouterOutlet,
    SidebarPurchaseComponent,
    NotificationComponent,
    FormsModule,
    NgSelectModule,
    CommonModule],
  templateUrl: './requestlist.component.html',
  styleUrl: './requestlist.component.scss'
})
export class RequestlistComponent implements OnInit  {
  request:any[]=[];

  categoryList: { label: string; value: string }[] = [];
  Catagory_: string | null = null;
  selectedCase: string = '';
  data:any[]=[];
  filteredRequests: any[]=[];
  fromDate: string | null = null;
  toDate: string | null = null;
  // router: any;

  
  constructor( //โหลดทันทีที่รันที่จำเป็นต้องใช้ตอนเริ่มเว็ป
      private purchaserequest: PurchaseRequestService, 
      private router: Router
     
    ) {}

// ใช้ฟิลด์ Category จาก DB โดยตรง
goToDetail(itemNo: string, category: string) {
  const itemsInCategory = this.request.filter(x =>
    String(x.ItemNo) === String(itemNo) &&
    String(x.Category ?? 'Unknown') === String(category) // หรือ x.Case_
  );

  this.router.navigate(['/purchase/detail', itemNo], {
    queryParams: { category },
    state: { items: itemsInCategory }
  });
}

async ngOnInit()  {
    this.Purchase_Request();
  }

Purchase_Request() {
  this.purchaserequest.Purchase_Request().subscribe({
    next: (response: any[]) => {
      console.log('📥 ข้อมูลจาก API:', response);

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
          const key = `${itemNo}_${category}`; // backtick

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

      this.request = Array.from(groupedMap.values()).map(group => ({
        ...group.item,
        Req_QTY: group.Req_QTY
      }));

      this.filteredRequests = [...this.request]; //  แสดงทั้งหมดตั้งแต่ต้น

      const uniqueCategories = Array.from(
        new Set(this.request.map(r => r.Category).filter(Boolean))
      );
      this.categoryList = uniqueCategories.map(cat => ({ label: cat, value: cat }));
    },
    error: (e: any) => console.error('❌ API error:', e),
  });
}



//  กรองตามช่วงวันที่,case
onFilter() {
  this.filteredRequests = this.request.filter(item => {
    const itemDate = new Date(item.DateRequest || item.DueDate);

    const matchDate =
      (!this.fromDate || itemDate >= new Date(this.fromDate)) &&
      (!this.toDate || itemDate <= new Date(this.toDate));


    const matchCategory =
      !this.Catagory_ || item.Category === this.Catagory_;

    return matchDate && matchCategory;
  });
}
  onSort() {
    this.filteredRequests.sort((a, b) => {
      const dateA = new Date(a.DueDate).getTime();
      const dateB = new Date(b.DueDate).getTime();
      return dateA - dateB; // เรียงจากเก่า -> ใหม่
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
