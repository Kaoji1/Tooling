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
//   editingIndex: { [key: string]: number | null } = {}; // เก็บแถวที่กำลังแก้ไขสำหรับแต่ละ key
//   request:any[]=[];
//   newRequestData: any = {};

  
//   selectAllChecked = false;

//   toggleAllCheckboxes() {
//     this.request.forEach(item => item.Selection = this.selectAllChecked);
//     localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
//   }

//   itemNo!: string;
//   displayIndex!: number;
//   items: any[] = [];


//   constructor(
//     private route: ActivatedRoute, 
//     private router: Router,
//     private DetailPurchase : DetailPurchaseRequestlistService) {}



//      async ngOnInit() {
//     this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';

//     const navigation = this.router.getCurrentNavigation();
//     this.items = navigation?.extras?.state?.['items'] || [];

//     const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
//     this.displayIndex = index >= 0 ? index + 1 : -1;

//     const storedRequest = localStorage.getItem('purchaseRequest');
//     if (storedRequest) {
//       this.request = JSON.parse(storedRequest);
//       console.log('โหลดข้อมูลจาก Local Storage:', this.request);
//     } else {
//       // รอโหลดข้อมูลจาก API ก่อน
//       await this.Detail_Purchase();
//     }
//   }


  
//   Detail_Purchase(): Promise<void> {
//     return new Promise((resolve, reject) => {
//       this.DetailPurchase.Detail_Request().subscribe({
//         next: (response: any[]) => {
//           const filtered = response.filter(item => item.ItemNo === this.itemNo)
//             .map(item => ({ ...item, Selection: false }));

//           const seen = new Set<number>();
//           const unique = filtered.filter(item => {
//             if (seen.has(item.ID_Request)) {
//               return false;
//             } else {
//               seen.add(item.ID_Request);
//               return true;
//             }
//           });

//           this.request = unique;

//           // เก็บลง localStorage
//           localStorage.setItem('purchaseRequest', JSON.stringify(this.request));

//           console.log('โหลดข้อมูลจาก API:', this.request);
//           resolve();
//         },
//         error: (e) => {
//           console.error(e);
//           reject(e);
//         }
//       });
//     });
//   }
// //   async ngOnInit() {
// //     this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';

// //     const navigation = this.router.getCurrentNavigation();
// //     this.items = navigation?.extras?.state?.['items'] || [];

// //     const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
// //     this.displayIndex = index >= 0 ? index + 1 : -1;

// //     const storedRequest = localStorage.getItem('purchaseRequest');
// //     if (storedRequest) {
// //       this.request = JSON.parse(storedRequest);
// //       console.log('โหลดข้อมูลจาก Local Storage:', this.request);
// //     } else {
    
// //     this.Detail_Purchase();
// //     // this.loadPurchaseFromDB();
// //   }
// // }

// // Detail_Purchase() {
// //   this.DetailPurchase.Detail_Request().subscribe({
// //     next: (response: any[]) => {
// //       // 1. กรองเฉพาะ ItemNo ที่ตรง
// //       const filtered = response.filter(item => item.ItemNo === this.itemNo)
// //         .map(item => ({
// //           ...item,
// //           Selection: false,
// //         }));

// //       // 2. กำจัด ID_Request ซ้ำ: เก็บเฉพาะตัวแรกที่เจอ
// //       const seen = new Set<number>();
// //       const unique = filtered.filter(item => {
// //         if (seen.has(item.ID_Request)) {
// //           return false; // ถ้ามีแล้ว ให้ข้าม
// //         } else {
// //           seen.add(item.ID_Request);
// //           return true; // ยังไม่เคยมี ให้เก็บไว้
// //         }
// //       });

// //       // 3. บันทึกเข้า request
// //       this.request = [...this.request, ...unique];

// //       localStorage.setItem('purchaseRequest', JSON.stringify(this.request));

// //       console.log('itemที่ส่ง', this.request);
// //     },
// //     error: (e: any) => console.error(e),
// //   });
// // }

// // loadPurchaseFromDB(){

// // }

//   addNewRequest(newRequestData: any) {
//   this.DetailPurchase.insertRequest(newRequestData).subscribe({
//     next: (res) => {
//       alert('เพิ่มข้อมูลสำเร็จ');
//       // สมมติ API ส่งกลับข้อมูลที่เพิ่มมาใหม่ ให้เราเอามาเพิ่มใน request พร้อมบันทึกใน localStorage
//       this.request.push({ ...res, Selection: false });
//       localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
//     },
//     error: (err) => {
//       console.error('เพิ่มข้อมูลไม่สำเร็จ', err);
//       alert('เพิ่มข้อมูลไม่สำเร็จ');
//     }
//   });
// }




// // เพิ่มฟังก์ชันเมื่อกดปุ่ม “Complete”
// completeSelected() {
//   const selectedItems = this.request.filter(item => item.Selection);
//   if (selectedItems.length === 0) {
//     alert('กรุณาเลือกข้อมูลที่ต้องการ');
//     return;
//   }


  

//   selectedItems.forEach(item => {
//     item.Status = 'Complete';

//     this.DetailPurchase.updateStatusToComplete(item.ID_Request, item.Status).subscribe({
//       next: () => {
//         // เอาออกจากหน้าจอหลังอัปเดต
//         this.request = this.request.filter(req => req.ID_Request !== item.ID_Request);

//         localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
//       },
//       error: err => {
//         console.error('เกิดข้อผิดพลาด:', err);
//         alert('ไม่สามารถอัปเดตข้อมูลได้');
//       }
//     });
//   });
// }
//   startEdit(caseKey: string, rowIndex: number): void {
//     this.editingIndex[caseKey] = rowIndex;
//   }

// saveEdit(caseKey: string, rowIndex: number): void {
//   console.log(`บันทึกข้อมูล caseKey: ${caseKey}, แถว: ${rowIndex}`);

//   const itemToUpdate = this.request.find(item => item.ID_Request === caseKey);
//   if (!itemToUpdate) {
//      alert('ไม่พบข้อมูลที่จะแก้ไข');
//     return;
//   }
// };
// }
//     // เรียก API เพื่ออัพเดต (ตัวอย่าง)
// // this.DetailPurchase.updateRequest(itemToUpdate).subscribe({
// //   next: () => {
// //     alert('บันทึกข้อมูลเรียบร้อยแล้ว');
// //     this.editingIndex[caseKey] = null;

// //     // อัพเดตข้อมูลใน Local Storage หลังบันทึก
// //     localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
// //   },
// //   error: (err) => {
// //     console.error('เกิดข้อผิดพลาดในการบันทึก:', err);
// //     alert('บันทึกข้อมูลไม่สำเร็จ');
// //   }
// // });
// // }
// // }

import { Component, OnInit } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';
import { FileReadService } from '../../../core/services/FileRead.service';


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
   editingIndex: { [key: string]: number | null } = {}; // เก็บแถวที่กำลังแก้ไขสำหรับแต่ละ key
  request:any[]=[];
  newRequestData: any = {};

selectAllChecked = false;

  toggleAllCheckboxes() {
    this.request.forEach(item => item.Selection = this.selectAllChecked);
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
  }

  itemNo!: string;
  displayIndex!: number;
  items: any[] = [];


  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private DetailPurchase : DetailPurchaseRequestlistService,
    private FileReadService : FileReadService
) {}


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


addNewRequest(newRequestData: any) {
  console.log('Sending request:', newRequestData); // debug
  this.DetailPurchase.insertRequest(newRequestData).subscribe({
    next: (res) => {
      console.log('Response:', res); // debug response
      if (!res.newId) {
        alert('Backend ไม่ส่งข้อมูลกลับมา');
        return;
      }
      this.request.push({ ...newRequestData, ...res, Selection: false });
      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
      alert('เพิ่มข้อมูลสำเร็จ');
    },
    error: (err) => {
      console.error('เพิ่มข้อมูลไม่สำเร็จ', err);
      alert(err.error?.message || 'เกิดข้อผิดพลาด');
    }
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
 startEdit(caseKey: string, rowIndex: number): void {
    this.editingIndex[caseKey] = rowIndex;
  }


saveEdit(caseKey: string, rowIndex: number): void {
  const itemToUpdate = this.request.find(item => item.ID_Request === caseKey);
  if (!itemToUpdate) { alert('ไม่พบข้อมูลที่จะแก้ไข'); return; }

  this.DetailPurchase.updateRequest(itemToUpdate).subscribe({
    next: (res: any) => {
      // อัปเดต array ด้วย response
      this.request[rowIndex] = { ...itemToUpdate, ...res };
      delete this.editingIndex[caseKey]; // ปิด mode edit
      alert('บันทึกข้อมูลสำเร็จ');
    },
    error: err => {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  });
}

openPdfFromPath(filePath: string) {
  if (!filePath) { alert('ไม่พบ path ของไฟล์'); return; }

  this.FileReadService.loadPdfFromPath(filePath).subscribe({
    next: (res: { fileName: string; imageData: string }) => {
      const base64 = res.imageData.split(',')[1];
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    },
    error: () => alert('ไม่สามารถโหลด PDF ได้')
  });
}
}

// openPdfFromCaseKey(caseKey: string) {
//   this.FileReadService.loadPdfFromPath(caseKey).subscribe({
//     next: (res: any) => {
//       const base64 = res.pdfData.split(',')[1];
//       const binary = atob(base64);
//       const len = binary.length;
//       const bytes = new Uint8Array(len);
//       for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

//       const blob = new Blob([bytes], { type: 'application/pdf' });
//       const blobUrl = URL.createObjectURL(blob);
//       window.open(blobUrl, '_blank');
//     },
//     error: (err) => {
//       alert(err.error?.error || 'ไม่สามารถโหลด PDF ได้');
//     }
//   });
// }
// }

// openPdfFromPath(filePath: string) {
//   if (!filePath) {
//     alert('ไม่พบพาธของไฟล์');
//     return;
//   }

//   this.FileReadService.loadPdfFromPath(filePath).subscribe({
//     next: (res) => {
//       // 1. แยก base64 ออกจาก prefix
//       const base64 = res.imageData.split(',')[1];

//       // 2. แปลง base64 เป็น binary
//       const binary = atob(base64);
//       const len = binary.length;
//       const bytes = new Uint8Array(len);
//       for (let i = 0; i < len; i++) {
//         bytes[i] = binary.charCodeAt(i);
//       }

//       // 3. แปลงเป็น Blob
//       const blob = new Blob([bytes], { type: 'application/pdf' });

//       // 4. สร้าง URL จาก Blob
//       const blobUrl = URL.createObjectURL(blob);

//       // 5. เปิดแท็บใหม่
//       window.open(blobUrl, '_blank');
//     },
//     error: () => {
//       alert('ไม่สามารถโหลด PDF ได้');
//     }
//   });

// }
// }

//   saveEdit(caseKey: string, rowIndex: number): void {
//   console.log(`บันทึกข้อมูล caseKey: ${caseKey}, แถว: ${rowIndex}`);

//   const itemToUpdate = this.request.find(item => item.ID_Request === caseKey);
//   if (!itemToUpdate) {
//     alert('ไม่พบข้อมูลที่จะแก้ไข');
//     return;
//   }
// // saveEdit(caseKey: string, rowIndex: number): void {
// //   console.log(`บันทึกข้อมูล caseKey: ${caseKey}, แถว: ${rowIndex}`);

// //   const itemToUpdate = this.request.find(item => item.ID_Request === caseKey);
// //   if (!itemToUpdate) {
// //      alert('ไม่พบข้อมูลที่จะแก้ไข');
// //     return;
// //   }
// };
//  // เรียก API ของ Service เพื่อบันทึกข้อมูล
//   this.DetailPurchase.updateRequest(itemToUpdate).subscribe({
//     next: (res: any) => {
//       console.log('บันทึกสำเร็จ:', res);

//       // อัปเดต array request ด้วยข้อมูลที่ได้จาก server (ถ้ามี)
//       this.request[rowIndex] = { ...itemToUpdate, ...res };

//       // ปิดโหมดแก้ไข
//       delete this.editingIndex[caseKey];

//       alert('บันทึกข้อมูลสำเร็จ');
//     },
//     error: (err) => {
//       console.error('เกิดข้อผิดพลาดในการบันทึก:', err);
//       alert(err.error?.message || 'ไม่สามารถบันทึกข้อมูลได้');
//     }
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
