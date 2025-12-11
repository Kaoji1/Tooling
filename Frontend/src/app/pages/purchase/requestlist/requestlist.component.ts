import { Component, OnInit } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationPurchaseComponent } from '../../../components/notification/notificationPurchase.component';
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
    NotificationPurchaseComponent,
    FormsModule,
    NgSelectModule,
    CommonModule],
  templateUrl: './requestlist.component.html',
  styleUrl: './requestlist.component.scss'
})
export class RequestlistComponent implements OnInit  {
  request:any[]=[];

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
    String(x.Category ?? 'Unknown') === String(category)
  );

  // เก็บก่อน navigation
  sessionStorage.setItem('request_filters', JSON.stringify({
    fromDate: this.fromDate,
    toDate: this.toDate,
    Catagory_: this.Catagory_
  }));
  sessionStorage.setItem('request_data', JSON.stringify(this.filteredRequests));

  this.router.navigate(['/purchase/detail', itemNo], {
    queryParams: { category },
    state: { items: itemsInCategory }
  });
}
// goToDetail(itemNo: string, category: string) {
//   const itemsInCategory = this.request.filter(x =>
//     String(x.ItemNo) === String(itemNo) &&
//     String(x.Category ?? 'Unknown') === String(category) // หรือ x.Case_
//   );

//   this.router.navigate(['/purchase/detail', itemNo], {
//     queryParams: { category },
//     state: { items: itemsInCategory }
//   });
// }

async ngOnInit()  {
     // โหลดฟิลเตอร์จาก sessionStorage ถ้ามี
  const savedFromDate = sessionStorage.getItem('fromDate');
  const savedToDate = sessionStorage.getItem('toDate');
  const savedCategory = sessionStorage.getItem('Category');

  const savedRequests = sessionStorage.getItem('request_data');
  const savedDivision = sessionStorage.getItem('Division');
  const savedProcess = sessionStorage.getItem('Process');
  const savedItem = sessionStorage.getItem('Item');
  
  this.fromDate = savedFromDate ? savedFromDate : null;
  this.toDate = savedToDate ? savedToDate : null;
  this.Catagory_ = savedCategory ? savedCategory : null;
  this.Division_ = savedDivision ? savedDivision : null;
  this.Process_ = savedProcess ? savedProcess : null;
  this.Item_ = savedItem ? savedItem : null;

  await this.Purchase_Request();

  this.Purchase_Request();
  }

  Purchase_Request(): Promise<void> { 
  // ทำให้ฟังก์ชันนี้ return Promise เพื่อให้เราสามารถ await ได้
  return new Promise((resolve, reject) => {
    this.purchaserequest.Purchase_Request().subscribe({
      next: (response: any[]) => {
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
          }
        });

        this.request = Array.from(groupedMap.values()).map(group => ({
          ...group.item,
          Req_QTY: group.Req_QTY
        }));

        this.filteredRequests = [...this.request]; 
        // <-- บรรทัดนี้เพิ่ม: เพื่อแสดงข้อมูลทั้งหมดก่อนจะทำการกรองตามฟิลเตอร์

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

        resolve(); // <-- บรรทัดนี้เพิ่ม: ให้ Promise สำเร็จหลังโหลดข้อมูล
      },
      error: (e: any) => {
        console.error('❌ API error:', e);
        reject(e); // <-- บรรทัดนี้เพิ่ม: ให้ Promise ล้มเหลวถ้า API error
      },
    });
  });
}

// Purchase_Request() {
//   this.purchaserequest.Purchase_Request().subscribe({
//     next: (response: any[]) => {
//       // console.log('📥 ข้อมูลจาก API:', response);

//       const groupedMap = new Map<string, {
//         Req_QTY: number,
//         ID_Requests: Set<number>,
//         item: any
//       }>();

//       response.forEach(item => {
//         if (item.Status === 'Waiting') {
//           const itemNo = item.ItemNo;
//           const category = item.Category || '';
//           const idRequest = item.ID_Request;
//           const key = `${itemNo}_${category}`; // backtick

//           if (groupedMap.has(key)) {
//             const group = groupedMap.get(key)!;
//             if (!group.ID_Requests.has(idRequest)) {
//               group.Req_QTY += Number(item.Req_QTY);
//               group.ID_Requests.add(idRequest);
//             }
//           } else {
//             groupedMap.set(key, {
//               Req_QTY: Number(item.Req_QTY),
//               ID_Requests: new Set<number>([idRequest]),
//               item: { ...item }
//             });
//           }
//         }
//       });

//       this.request = Array.from(groupedMap.values()).map(group => ({
//         ...group.item,
//         Req_QTY: group.Req_QTY
//       }));

//       this.filteredRequests = [...this.request]; //  แสดงทั้งหมดตั้งแต่ต้น

//       const uniqueCategories = Array.from(
//         new Set(this.request.map(r => r.Category).filter(Boolean))
//       );
//       this.categoryList = uniqueCategories.map(cat => ({ label: cat, value: cat }));
//     },
//     error: (e: any) => console.error('❌ API error:', e),
//   });
// }



// onFilter() {
//   // เก็บฟิลเตอร์ลง sessionStorage
//   if (this.fromDate) sessionStorage.setItem('fromDate', this.fromDate);
//   else sessionStorage.removeItem('fromDate');

//   if (this.toDate) sessionStorage.setItem('toDate', this.toDate);
//   else sessionStorage.removeItem('toDate');

//   if (this.Catagory_) sessionStorage.setItem('Category', this.Catagory_);
//   else sessionStorage.removeItem('Category');

//   this.filteredRequests = this.request.filter(item => {
//     const itemDate = new Date(item.DateRequest || item.DueDate);

//     const matchDate =
//       (!this.fromDate || itemDate >= new Date(this.fromDate)) &&
//       (!this.toDate || itemDate <= new Date(this.toDate));

//     const matchCategory =
//       !this.Catagory_ || item.Category === this.Catagory_;

//     return matchDate && matchCategory;
//   });
// }

onFilter() {
  this.filteredRequests = this.request.filter(item => {
    // ✅ ฟิลเตอร์ข้อความ
    const matchDivision = !this.Division_?.length || this.Division_.includes(item.Division);
    const matchCategory = !this.Catagory_?.length || this.Catagory_.includes(item.Category);
    const matchItemNo   = !this.Item_?.length   || this.Item_.includes(item.ItemNo);
    const matchProcess  = !this.Process_?.length  || this.Process_.includes(item.Process);

    // ✅ แปลง input เป็น Date object
    const fromDateObj = this.fromDate ? new Date(this.fromDate) : null;
    const toDateObj   = this.toDate   ? new Date(this.toDate)   : null;

    // ✅ แปลงข้อมูลจาก DB เป็น Date
    const reqDate = item.DateTime_Record ? new Date(item.DateTime_Record) : null;
    const dueDate = item.DueDate ? new Date(item.DueDate) : null;

    let matchDate: boolean = true;

    if (fromDateObj && toDateObj) {
      matchDate = !!(
    reqDate &&
    dueDate &&
    reqDate.toDateString() === fromDateObj.toDateString() &&
    dueDate.toDateString() === toDateObj.toDateString()
  );
} else if (fromDateObj) {
  matchDate = !!(reqDate && reqDate.toDateString() === fromDateObj.toDateString());
} else if (toDateObj) {
  matchDate = !!(dueDate && dueDate.toDateString() === toDateObj.toDateString());
}

    return matchDivision && matchCategory && matchItemNo && matchProcess && matchDate;
  });
}

 //  เรียงลำดับจาก DueDate เก่าสุด -> ล่าสุด
onSort(key: string) {
  if (this.sortKey === key) {
    // ถ้ากดซ้ำ → สลับ ASC/DESC
    this.sortAsc = !this.sortAsc;
  } else {
    this.sortKey = key;
    this.sortAsc = true;
  }

  this.filteredRequests.sort((a, b) => {
    const valA = a[key] ?? '';
    const valB = b[key] ?? '';

    // ✅ เช็คถ้าเป็น Date ให้แปลงเป็น number ก่อนเปรียบเทียบ
    const isDate = key === 'ReqDate' || key === 'DueDate';
    if (isDate) {
      const dateA = valA ? new Date(valA).getTime() : 0;
      const dateB = valB ? new Date(valB).getTime() : 0;
      return this.sortAsc ? dateA - dateB : dateB - dateA;
    }

    // ✅ ถ้าเป็น Number
    if (typeof valA === 'number' && typeof valB === 'number') {
      return this.sortAsc ? valA - valB : valB - valA;
    }

    // ✅ ถ้าเป็น String
    return this.sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });
}


  clearFilters() {
 this.Catagory_ = null;
  this.Division_ = null;
  this.Process_ = null;
  this.Item_ = null;
  this.fromDate = null;
  this.toDate = null;
  this.onFilter();
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
