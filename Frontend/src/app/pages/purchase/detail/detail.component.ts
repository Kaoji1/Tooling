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
