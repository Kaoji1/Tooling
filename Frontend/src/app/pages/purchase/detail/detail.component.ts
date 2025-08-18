
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
  imports: [
    SidebarPurchaseComponent,
    CommonModule,
    FormsModule,
    RouterOutlet,
    NotificationComponent,
    NgSelectModule
  ],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  editingIndex: { [key: string]: number | null } = {}; // เก็บแถวที่กำลังแก้ไข
  request: any[] = [];
  newRequestData: any = {};
  selectAllChecked = false;

  
  itemNo!: string;
  displayIndex!: number;
  items: any[] = [];
  highlightedRow: number | null = null; // ใช้ไฮไลต์แถวใหม่หรือแถวที่เลือก

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private DetailPurchase: DetailPurchaseRequestlistService,
    private FileReadService: FileReadService
  ) {}

  

  ngOnInit() {
    // ดึง ItemNo จาก route
    this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';

    // ดึงรายการ items จาก navigation state (ถ้ามี)
    const navigation = this.router.getCurrentNavigation();
    this.items = navigation?.extras?.state?.['items'] || [];

    const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
    this.displayIndex = index >= 0 ? index + 1 : -1;

    // โหลดข้อมูล purchase request
    this.Detail_Purchase();
  }

  // ฟังก์ชันติ๊ก select all checkbox
  toggleAllCheckboxes() {
    this.request.forEach(item => item.Selection = this.selectAllChecked);
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
  }

  // โหลดรายการ purchase request จาก backend
Detail_Purchase() {
  this.DetailPurchase.Detail_Request().subscribe({
    next: (response: any[]) => {
      console.log('Response จาก backend Detail_Request:', response);

      const filtered = response
        .filter(item => item.ItemNo === this.itemNo)
        .map(item => ({ ...item, Selection: false }));

      const seen = new Set<number>();
      const unique = filtered.filter(item => {
        if (seen.has(item.ID_Request)) return false;
        seen.add(item.ID_Request);
        return true;
      });

      this.request = [...this.request, ...unique];
      console.log('request หลังจาก Detail_Purchase:', this.request);
    },
    error: e => console.error('Error Detail_Purchase:', e)
  });
}

// เพิ่มแถวใหม่
addNewRequest(newRequestData: any, rowIndex: number) {
  console.log('เรียก addNewRequest:', newRequestData, 'rowIndex:', rowIndex);
  this.DetailPurchase.insertRequest(newRequestData).subscribe({
    next: res => {
      console.log('ผลลัพธ์จาก backend insertRequest:', res);
      if (!res.newId) { alert('Backend ไม่ส่งข้อมูลกลับมา'); return; }

      const newRow = { ...newRequestData, ...res, Selection: false, isNew: true };
      this.request.splice(rowIndex + 1, 0, newRow);
      this.editingIndex[newRow.ID_Request] = rowIndex + 1;

      console.log('request หลังเพิ่มแถวใหม่:', this.request);
      console.log('editingIndex หลังเพิ่มแถวใหม่:', this.editingIndex);

      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
      alert('เพิ่มข้อมูลสำเร็จ');
    },
    error: err => { console.error('Error addNewRequest:', err); alert(err.error?.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล'); }
  });
}

startEdit(caseKey: number, rowIndex: number) {
  console.log('เรียก startEdit caseKey:', caseKey, 'rowIndex:', rowIndex);
  this.editingIndex[caseKey] = rowIndex;
  console.log('editingIndex หลัง startEdit:', this.editingIndex);
}

saveEdit(caseKey: number, rowIndex: number) {
  const item = this.request[rowIndex];
  console.log('เรียก saveEdit caseKey:', caseKey, 'rowIndex:', rowIndex, 'item:', item);
  if (!item) return;

  if (item.isNew) {
    this.DetailPurchase.insertRequest(item).subscribe({
      next: res => {
        this.request[rowIndex] = { ...item, ...res, isNew: false, Selection: false };
        delete this.editingIndex[caseKey];

        console.log('request หลัง saveEdit แถวใหม่:', this.request);
        console.log('editingIndex หลัง saveEdit แถวใหม่:', this.editingIndex);

        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        alert('บันทึกแถวใหม่เรียบร้อย');
      },
      error: err => { console.error('Error saveEdit แถวใหม่:', err); alert('เกิดข้อผิดพลาดในการบันทึกแถวใหม่'); }
    });
  } else {
    this.DetailPurchase.updateRequest(item).subscribe({
      next: res => {
        this.request[rowIndex] = { ...item, ...res, isNew: false };
        delete this.editingIndex[caseKey];

        console.log('request หลัง saveEdit แถวเดิม:', this.request);
        console.log('editingIndex หลัง saveEdit แถวเดิม:', this.editingIndex);

        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        alert('บันทึกแถวเรียบร้อย');
      },
      error: err => { console.error('Error saveEdit แถวเดิม:', err); alert('เกิดข้อผิดพลาดในการบันทึกแถว'); }
    });
  }
}

// ลบแถว
deleteRow(rowIndex: number) {
  const item = this.request[rowIndex];
  console.log('เรียก deleteRow rowIndex:', rowIndex, 'item:', item);
  if (!item) return;

  if (item.isNew) {
    this.request.splice(rowIndex, 1);
    delete this.editingIndex[item.ID_Request];

    console.log('request หลัง deleteRow แถวใหม่:', this.request);
    console.log('editingIndex หลัง deleteRow แถวใหม่:', this.editingIndex);

    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
    alert('ลบแถวเรียบร้อย');
  } else {
    this.DetailPurchase.deleteRequest(item.ID_Request).subscribe({
      next: () => {
        this.request.splice(rowIndex, 1);
        delete this.editingIndex[item.ID_Request];

        console.log('request หลัง deleteRow แถวเดิม:', this.request);
        console.log('editingIndex หลัง deleteRow แถวเดิม:', this.editingIndex);

        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        alert('ลบข้อมูลสำเร็จ');
      },
      error: err => { console.error('Error deleteRow แถวเดิม:', err); alert('ไม่สามารถลบข้อมูลได้'); }
    });
  }
}

// ใน component
isCompleting = false; // กันกดซ้ำ

completeSelected() {
  if (this.isCompleting) return;

  // เลือกเฉพาะแถวที่ติ๊กและ Status = 'Waiting'
  const selectedItems = this.request.filter(it => it.Selection && it.Status === 'Waiting');

  if (selectedItems.length === 0) {
    alert('กรุณาเลือกข้อมูลที่ต้องการ (สถานะ Waiting)');
    return;
  }

  this.isCompleting = true;

  // ทำงานทีละตัวแบบ async
  const processNext = async (index: number) => {
    if (index >= selectedItems.length) {
      this.isCompleting = false;
      console.log('Complete ทุกแถวเสร็จสิ้น');
      return;
    }

    const item = selectedItems[index];
    const prevStatus = item.Status;

    try {
      item.Status = 'Complete'; // optimistic update

      if (item.isNew) {
        // แถวใหม่: ต้อง insert ก่อนแล้วอัปเดตสถานะ
        const insertRes: any = await this.DetailPurchase.insertRequest(item).toPromise();

        if (insertRes && insertRes.newId) {
          item.ID_Request = insertRes.newId;
        } else {
          throw new Error('Backend ไม่ส่ง ID กลับมา');
        }

        // อัปเดตสถานะ Complete หลัง insert
        await this.DetailPurchase.updateStatusToComplete(item.ID_Request, 'Complete').toPromise();
      } else {
        // แถวเดิม: อัปเดตสถานะ Complete เลย
        await this.DetailPurchase.updateStatusToComplete(item.ID_Request, 'Complete').toPromise();
      }

      //  ลบแถวที่สำเร็จ
      this.request = this.request.filter(r => r.ID_Request !== item.ID_Request);

      console.log('อัปเดตสำเร็จและลบแถว ID:', item.ID_Request);
    } catch (err) {
      // rollback ถ้า fail
      item.Status = prevStatus;
      console.error('Error completeSelected ID:', item.ID_Request, err);
      alert(`อัปเดต ID:${item.ID_Request} ไม่สำเร็จ`);
    } finally {
      // ประมวลผลตัวต่อไป
      processNext(index + 1);
    }
  };

  processNext(0);
}

// completeSelected() {
//   if (this.isCompleting) return;

//   // เลือกเฉพาะแถวที่ติ๊กและ Status = 'Waiting'
//   const selectedItems = this.request.filter(it => it.Selection && it.Status === 'Waiting');

//   if (selectedItems.length === 0) {
//     alert('กรุณาเลือกข้อมูลที่ต้องการ (สถานะ Waiting)');
//     return;
//   }

//   this.isCompleting = true;

//   // ทำงานทีละตัวแบบ async
//   const processNext = async (index: number) => {
//     if (index >= selectedItems.length) {
//       this.isCompleting = false;
//       console.log('Complete ทุกแถวเสร็จสิ้น');
//       return;
//     }

//     const item = selectedItems[index];
//     const prevStatus = item.Status;

//     try {
//       item.Status = 'Complete'; // optimistic update

//       // เรียก API อัปเดต Status
//       await this.DetailPurchase.updateStatusToComplete(item.ID_Request, 'Complete').toPromise();

//       // ✅ ลบแถวที่สำเร็จ
//       this.request = this.request.filter(r => r.ID_Request !== item.ID_Request);

//       console.log('อัปเดตสำเร็จและลบแถว ID:', item.ID_Request);
//     } catch (err) {
//       // rollback ถ้า fail
//       item.Status = prevStatus;
//       console.error('Error completeSelected ID:', item.ID_Request, err);
//       alert(`อัปเดต ID:${item.ID_Request} ไม่สำเร็จ`);
//     } finally {
//       // ประมวลผลตัวต่อไป
//       processNext(index + 1);
//     }
//   };

//   processNext(0);
// }

// เปิดไฟล์ PDF
openPdfFromPath(filePath: string) {
  console.log('เรียก openPdfFromPath path:', filePath);
  if (!filePath) { alert('ไม่พบ path ของไฟล์'); return; }

  this.FileReadService.loadPdfFromPath(filePath).subscribe({
    next: res => {
      console.log('ผลลัพธ์ loadPdfFromPath:', res);
      const base64 = res.imageData.split(',')[1];
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    },
    error: err => { console.error('Error openPdfFromPath:', err); alert('ไม่สามารถโหลด PDF ได้'); }
  });
}

// ลบรายการด้วย ID
deleteItem(id: string) {
  console.log('เรียก deleteItem id:', id);
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return;

  this.DetailPurchase.deleteRequest(Number(id)).subscribe({
    next: () => {
      console.log('ลบรายการสำเร็จ id:', id);
      this.request = this.request.filter(item => item.ID_Request !== id);
      console.log('request หลัง deleteItem:', this.request);
    },
    error: err => { console.error('Error deleteItem:', err); alert('เกิดข้อผิดพลาดในการลบ'); }
  });
}
}

