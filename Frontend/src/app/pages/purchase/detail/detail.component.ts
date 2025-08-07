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
      // กรองเฉพาะข้อมูลที่ ItemNo ตรงกับ itemNo จาก route
      const filtered = response.filter(item => item.ItemNo === this.itemNo)
      .map(item => ({
        ...item,
        Selection: false,
      }));
      this.request = [...this.request, ...filtered];
    },
    error: (e: any) => console.error(e),
  });
}

// เพิ่มฟังก์ชันเมื่อกดปุ่ม “Complete”
completeSelected() {
  const selectedItems = this.request.filter(item => item.Selection);
console.log('hello',selectedItems)
  if (selectedItems.length === 0) {
    alert('กรุณาเลือกข้อมูลที่ต้องการ');
    return;
  }

  // เปลี่ยนสถานะเป็น 'Complete'
  selectedItems.forEach(item => item.Status = 'Complete');

  // เรียก service เพื่ออัปเดต
  const docNos = selectedItems.map(item => item.DocNo);
  console.log('test',docNos)
  this.DetailPurchase.updateStatusToComplete(docNos).subscribe({
    next: () => {
      // ลบรายการที่เลือกออกจาก list บนหน้า UI
      this.request = this.request.filter(item => !item.Selection);
    },
    error: err => {
      console.error('เกิดข้อผิดพลาด:', err);
      alert('ไม่สามารถอัปเดตข้อมูลได้');
    
    }
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
