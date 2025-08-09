import { Component, OnInit } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';


@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [SidebarPurchaseComponent,
    CommonModule,
    FormsModule, 
    RouterOutlet,
    NotificationComponent,
    NgSelectModule],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss'
})

export class DetailComponent implements OnInit {
  request:any[]=[];

  itemNo!: string;
  displayIndex!: number;
  items: any[] = [];


  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private DetailPurchase : DetailPurchaseRequestlistService) {}


  async ngOnInit() {
    this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';

    const navigation = this.router.getCurrentNavigation();
    this.items = navigation?.extras?.state?.['items'] || [];

    const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
    this.displayIndex = index >= 0 ? index + 1 : -1;

    
    this.Detail_Purchase();
  }

Detail_Purchase() {
  this.DetailPurchase.Detail_Request().subscribe({
    next: (response: any[]) => {
      // 1. กรองเฉพาะ ItemNo ที่ตรง
      const filtered = response.filter(item => item.ItemNo === this.itemNo)
        .map(item => ({
          ...item,
          Selection: false,
        }));

      // 2. กำจัด ID_Request ซ้ำ: เก็บเฉพาะตัวแรกที่เจอ
      const seen = new Set<number>();
      const unique = filtered.filter(item => {
        if (seen.has(item.ID_Request)) {
          return false; // ถ้ามีแล้ว ให้ข้าม
        } else {
          seen.add(item.ID_Request);
          return true; // ยังไม่เคยมี ให้เก็บไว้
        }
      });

      // 3. บันทึกเข้า request
      this.request = [...this.request, ...unique];

      console.log('itemที่ส่ง', this.request);
    },
    error: (e: any) => console.error(e),
  });
}

// เพิ่มฟังก์ชันเมื่อกดปุ่ม “Complete”
completeSelected() {
  const selectedItems = this.request.filter(item => item.Selection);
  if (selectedItems.length === 0) {
    alert('กรุณาเลือกข้อมูลที่ต้องการ');
    return;
  }

  selectedItems.forEach(item => {
    item.Status = 'Complete';

    this.DetailPurchase.updateStatusToComplete(item.ID_Request, item.Status).subscribe({
      next: () => {
        // เอาออกจากหน้าจอหลังอัปเดต
        this.request = this.request.filter(req => req.ID_Request !== item.ID_Request);
      },
      error: err => {
        console.error('เกิดข้อผิดพลาด:', err);
        alert('ไม่สามารถอัปเดตข้อมูลได้');
      }
    });
  });
}
}

// Detail_Purchase() {
//   this.DetailPurchase.Detail_Request().subscribe({
//     next: (response: any[]) => {
//       // กรองข้อมูลตาม itemNo ที่ได้จาก route
//       this.request = response.filter(item => item.ItemNo === this.itemNo);
//     },
//     error: (e: any) => console.error(e),
//   });
// }
// }


  // groupItemsByCase(items: any[]): { [case_: string]: any[] } {
  //   const grouped: { [case_: string]: any[] } = {};
  //   items.forEach((item) => {
  //     const caseKey = item.CASE || 'ไม่ระบุ';
  //     if (!grouped[caseKey]) grouped[caseKey] = [];
  //     grouped[caseKey].push(item);
  //   });
  //   return grouped;
  // }




// export class DetailComponent implements OnInit{
//   itemNo!: string;
//   displayIndex!: number;
  
//   items: any[] = [];


//   constructor(private route: ActivatedRoute) {}

//   ngOnInit(): void {
//     this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';

//   const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
//     this.displayIndex = index >= 0 ? index + 1 : -1;
// }

// 





//ปัจจุบัน// import { Component, OnInit } from '@angular/core';
// import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
// import { NotificationComponent } from '../../../components/notification/notification.component';
// import { RouterOutlet } from '@angular/router';
// import { ActivatedRoute, Router } from '@angular/router';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';


// @Component({
//   selector: 'app-detail',
//   standalone: true,
//   imports: [SidebarPurchaseComponent,
//     CommonModule,
//     FormsModule, 
//     RouterOutlet,
//     NotificationComponent,
//     NgSelectModule],
//   templateUrl: './detail.component.html',
//   styleUrl: './detail.component.scss'
// })

// export class DetailComponent implements OnInit {
//   request: any[] = [];
//   itemNo!: string;
//   displayIndex!: number;
//   items: any[] = [];
//   caseKeys = [];
//   editingIndex: { [key: string]: number | null } = {};

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private DetailPurchase: DetailPurchaseRequestlistService
//   ) {}

//   ngOnInit() {
//     this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';
//     console.log('itemNo จาก route:', this.itemNo);

//     const navigation = this.router.getCurrentNavigation();
//     this.items = navigation?.extras?.state?.['items'] || [];
//     console.log('items จาก navigation state:', this.items);

//     const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
//     this.displayIndex = index >= 0 ? index + 1 : -1;
//     console.log('displayIndex:', this.displayIndex);

//     this.Detail_Purchase();
//   }

//   Detail_Purchase() {
//     this.DetailPurchase.Detail_Request().subscribe({
//       next: (response: any[]) => {
//         console.log('ข้อมูลจาก API:', response);

//         const filtered = response.filter(item => item.ItemNo === this.itemNo)
//           .map(item => ({
//             ...item,
//             Selection: false,
//           }));
//         console.log('ข้อมูลหลังกรองตาม itemNo:', filtered);

//         const seen = new Set<number>();
//         const unique = filtered.filter(item => {
//           if (seen.has(item.ID_Request)) {
//             return false;
//           } else {
//             seen.add(item.ID_Request);
//             return true;
//           }
//         });

//         console.log('ข้อมูลหลังกรองไม่ซ้ำ ID_Request:', unique);

//         this.request = unique;
//       },
//       error: (e: any) => console.error('Error ใน Detail_Purchase:', e),
//     });
//   }

//   startEdit(caseKey: string, i: number) {
//     console.log(`เริ่มแก้ไข caseKey=${caseKey}, index=${i}`);
//     this.editingIndex[caseKey] = i;
//   }

//   saveEdit(caseKey: string, i: number) {
//     const item = this.request[i];
//     if (!item) {
//       console.warn('ไม่พบ item ที่ index:', i);
//       return;
//     }

//     console.log('ข้อมูลที่จะบันทึก:', { ID_Request: item.ID_Request, QTY: item.QTY, Remark: item.Remark });

//     this.DetailPurchase.updateItem({ID_Request: item.ID_Request, QTY: item.QTY, Remark: item.Remark}).subscribe({
//       next: () => {
//         console.log('บันทึกข้อมูลเรียบร้อย');
//         alert('บันทึกข้อมูลเรียบร้อย');
//         this.editingIndex[caseKey] = null;
//       },
//       error: (err) => {
//         console.error('เกิดข้อผิดพลาดในการบันทึก:', err);
//         alert('เกิดข้อผิดพลาดในการบันทึก');
//       },
//     });
//   }

//   cancelEdit(caseKey: string) {
//     console.log('ยกเลิกแก้ไข caseKey:', caseKey);
//     this.editingIndex[caseKey] = null;
//     this.Detail_Purchase();
//   }

//   completeSelected() {
//     const selectedItems = this.request.filter(item => item.Selection);
//     console.log('รายการที่เลือกเพื่อ Complete:', selectedItems);

//     if (selectedItems.length === 0) {
//       alert('กรุณาเลือกข้อมูลที่ต้องการ');
//       return;
//     }

//     selectedItems.forEach(item => {
//       item.Status = 'Complete';
//       this.DetailPurchase.updateStatusToComplete(item.ID_Request, item.Status).subscribe({
//         next: () => {
//           console.log('อัปเดตสถานะ Complete สำเร็จสำหรับ ID_Request:', item.ID_Request);
//           this.request = this.request.filter(req => req.ID_Request !== item.ID_Request);
//         },
//         error: err => {
//           console.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ:', err);
//           alert('ไม่สามารถอัปเดตข้อมูลได้');
//         }
//       });
//     });
//   }
// }














// import { Component, OnInit } from '@angular/core';
// import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
// import { NotificationComponent } from '../../../components/notification/notification.component';
// import { RouterOutlet } from '@angular/router';
// import { ActivatedRoute, Router } from '@angular/router';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';


// @Component({
//   selector: 'app-detail',
//   standalone: true,
//   imports: [SidebarPurchaseComponent,
//     CommonModule,
//     FormsModule, 
//     RouterOutlet,
//     NotificationComponent,
//     NgSelectModule],
//   templateUrl: './detail.component.html',
//   styleUrl: './detail.component.scss'
// })

// export class DetailComponent implements OnInit {
//   request: any[] = [];
//   itemNo!: string;
//   displayIndex!: number;
//   items: any[] = [];
//   caseKeys = []; // array ของข้อมูลที่ใช้ใน *ngFor
//   editingIndex: { [key: string]: number | null } = {}; // ถ้าใช้แบบ object

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private DetailPurchase: DetailPurchaseRequestlistService
//   ) {}

//   ngOnInit() {
//     this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';
//     const navigation = this.router.getCurrentNavigation();
//     this.items = navigation?.extras?.state?.['items'] || [];
//     const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
//     this.displayIndex = index >= 0 ? index + 1 : -1;
//     this.Detail_Purchase();
//   }

  
//   Detail_Purchase() {
//     this.DetailPurchase.Detail_Request().subscribe({
//       next: (response: any[]) => {
//         const filtered = response.filter(item => item.ItemNo === this.itemNo)
//           .map(item => ({
//             ...item,
//             Selection: false,
//           }));
//         const seen = new Set<number>();
//         const unique = filtered.filter(item => {
//           if (seen.has(item.ID_Request)) {
//             return false;
//           } else {
//             seen.add(item.ID_Request);
//             return true;
//           }
//         });
//         this.request = unique;
//       },
//       error: (e: any) => console.error(e),
//     });
//   }

//   startEdit(caseKey: string, i: number) {
//     this.editingIndex[caseKey] = i;
//   }

//   saveEdit(caseKey: string, i: number) {
//     const item = this.request[i];
//     if (!item) return;

//     this.DetailPurchase.updateItem({ID_Request:item.ID_Request, QTY:item.QTY, Remark:item.Remark}).subscribe({
//       next: () => {
//         alert('บันทึกข้อมูลเรียบร้อย');
//         this.editingIndex[caseKey] = null;
//       },
//       error: () => alert('เกิดข้อผิดพลาดในการบันทึก'),
//     });
//   }

//   cancelEdit(caseKey: string) {
//     this.editingIndex[caseKey] = null;
//     this.Detail_Purchase();
//   }

//   completeSelected() {
//     const selectedItems = this.request.filter(item => item.Selection);
//     if (selectedItems.length === 0) {
//       alert('กรุณาเลือกข้อมูลที่ต้องการ');
//       return;
//     }

//     selectedItems.forEach(item => {
//       item.Status = 'Complete';
//       this.DetailPurchase.updateStatusToComplete(item.ID_Request, item.Status).subscribe({
//         next: () => {
//           this.request = this.request.filter(req => req.ID_Request !== item.ID_Request);
//         },
//         error: err => {
//           console.error('เกิดข้อผิดพลาด:', err);
//           alert('ไม่สามารถอัปเดตข้อมูลได้');
//         }
//       });
//     });
//   }
// }

// export class DetailComponent implements OnInit {
//   request:any[]=[];

//   itemNo!: string;
//   displayIndex!: number;
//   items: any[] = [];
//   editingIndex: { [case_: string]: number | null } = {};



//   constructor(
//     private route: ActivatedRoute, 
//     private router: Router,
//     private DetailPurchase : DetailPurchaseRequestlistService) {}


//   async ngOnInit() {
//     this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';

//     const navigation = this.router.getCurrentNavigation();
//     this.items = navigation?.extras?.state?.['items'] || [];

//     const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
//     this.displayIndex = index >= 0 ? index + 1 : -1;

    
//     this.Detail_Purchase();
//   }

// Detail_Purchase() {
//   this.DetailPurchase.Detail_Request().subscribe({
//     next: (response: any[]) => {
//       // 1. กรองเฉพาะ ItemNo ที่ตรง
//       const filtered = response.filter(item => item.ItemNo === this.itemNo)
//         .map(item => ({
//           ...item,
//           Selection: false,
//         }));

//     const seen = new Set<number>();
//         const unique = filtered.filter(item => {
//           if (seen.has(item.ID_Request)) {
//             return false;
//           } else {
//             seen.add(item.ID_Request);
//             return true;
//           }
//         });

//         // กำหนดใหม่ ไม่สะสมซ้ำ
//         this.request = unique;

//         console.log('itemที่ส่ง', this.request);
//       },
//       error: (e: any) => console.error(e),
//     });
//   }

//   // ฟังก์ชันเริ่มแก้ไข
//   startEdit(index: number) {
//   this.editingIndex = index;  
// }
// }

//   // ฟังก์ชันบันทึกแก้ไข QTY
// saveEdit(index: number) {
//   if (index < 0 || index >= this.request.length) {
//     console.error('index ไม่ถูกต้อง:', index);
//     return;
//   }

//   const item = this.request[index];
//   if (!item) {
//     console.error('ไม่พบ item ที่ index:', index);
//     return;
//   }

//   if (item.QTY == null) {
//     alert('กรุณากรอกจำนวน QTY ก่อนบันทึก');
//     return;
//   }

//   this.DetailPurchase.updateQty(item.ID_Request, item.QTY).subscribe({
//     next: () => {
//       alert('บันทึกข้อมูลเรียบร้อย');
//       this.editingIndex = null;
//     },
//     error: (err) => {
//       console.error('เกิดข้อผิดพลาดในการบันทึก:', err);
//       alert('เกิดข้อผิดพลาดในการบันทึก');
//     },
//   });
// }







// Detail_Purchase() {
//   this.DetailPurchase.Detail_Request().subscribe({
//     next: (response: any[]) => {
//       // กรองข้อมูลตาม itemNo ที่ได้จาก route
//       this.request = response.filter(item => item.ItemNo === this.itemNo);
//     },
//     error: (e: any) => console.error(e),
//   });
// }
// }


  // groupItemsByCase(items: any[]): { [case_: string]: any[] } {
  //   const grouped: { [case_: string]: any[] } = {};
  //   items.forEach((item) => {
  //     const caseKey = item.CASE || 'ไม่ระบุ';
  //     if (!grouped[caseKey]) grouped[caseKey] = [];
  //     grouped[caseKey].push(item);
  //   });
  //   return grouped;
  // }




// export class DetailComponent implements OnInit{
//   itemNo!: string;
//   displayIndex!: number;
  
//   items: any[] = [];


//   constructor(private route: ActivatedRoute) {}

//   ngOnInit(): void {
//     this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';

//   const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
//     this.displayIndex = index >= 0 ? index + 1 : -1;
// }

// 
