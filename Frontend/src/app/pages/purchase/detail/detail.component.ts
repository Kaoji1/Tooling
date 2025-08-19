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
  // request: { Setup: any[]; Other: any[] } = { Setup: [], Other: [] }; // แยกเป็น Setup กับ Other
  newRequestData: any = {};
  selectAllChecked = false;
category = '';
  
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
  this.route.paramMap.subscribe(p => {
    this.itemNo = p.get('itemNo') || '';
  });

  // อ่าน category จาก query param
  this.route.queryParamMap.subscribe(q => {
    this.category = q.get('category') || '';
    this.Detail_Purchase();               // โหลดใหม่เมื่อ category เปลี่ยน
  });
}

// โหลดรายการ purchase request จาก backend
Detail_Purchase() {
  this.DetailPurchase.Detail_Request().subscribe({
    next: (response: any[]) => {
      //  กรองด้วย ItemNo + Category จาก DB ตรงๆ
      const filtered = (response || [])
        .filter(it => it.ItemNo === this.itemNo && String(it.Category ?? 'Unknown') === this.category)
        .map(it => ({ ...it, Selection: false }));

      // กันซ้ำ
      const seen = new Set<number>();
      const unique = filtered.filter(it => !seen.has(it.ID_Request) && seen.add(it.ID_Request));

      //  ไม่ append เพื่อไม่ให้ผสม
      this.request = unique;
    },
    error: e => console.error('Error Detail_Purchase:', e)
  });
}

  toggleAllCheckboxes() {
    this.request.forEach(it => it.Selection = this.selectAllChecked);
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
  }

  
// เพิ่มแถวใหม่
// เพิ่มแถวใหม่
addNewRequest(newRequestData: any, rowIndex: number) {
  console.log('เรียก addNewRequest:', newRequestData, 'rowIndex:', rowIndex);

  // เรียก backend insert
  this.DetailPurchase.insertRequest(newRequestData).subscribe({
    next: res => {
      console.log('ผลลัพธ์จาก backend insertRequest:', res);

      // ตรวจสอบว่ามี newId กลับมาหรือไม่
      if (!res.ID_Request) {
        alert('Backend ไม่ส่งข้อมูลกลับมา');
        return;
      }

      // สร้างแถวใหม่พร้อมข้อมูลจาก backend
      const newRow = { ...newRequestData, ...res, Selection: false, isNew: true };

      // แทรกแถวใหม่หลังแถวปัจจุบัน
      this.request.splice(rowIndex + 1, 0, newRow);

      // อัปเดต editingIndex สำหรับแถวใหม่
      this.editingIndex[newRow.ID_Request] = rowIndex + 1;

      console.log('request หลังเพิ่มแถวใหม่:', this.request);
      console.log('editingIndex หลังเพิ่มแถวใหม่:', this.editingIndex);

      // เก็บใน localStorage
      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));

      alert('เพิ่มข้อมูลสำเร็จ');
    },
    error: err => {
      console.error('Error addNewRequest:', err);
      alert(err.error?.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    }
  });
}

startEdit(caseKey: number, rowIndex: number) {
  console.log('เรียก startEdit caseKey:', caseKey, 'rowIndex:', rowIndex);
  this.editingIndex[caseKey] = rowIndex;
  console.log('editingIndex หลัง startEdit:', this.editingIndex);
}

saveEdit(caseKey: number, rowIndex: number) {
  console.log('เรียก saveEdit caseKey:', caseKey, 'rowIndex:', rowIndex);
  const item = this.request[rowIndex];
  console.log('item ที่จะบันทึก:', item);

  if (!item) {
    console.warn('ไม่พบ item ที่แถวนี้:', rowIndex);
    return;
  }

  if (item.isNew) {
    console.log('กำลังบันทึกแถวใหม่...');
    this.DetailPurchase.insertRequest(item).subscribe({
      next: res => {
        this.request[rowIndex] = { ...item, ...res, isNew: false, Selection: false };
        delete this.editingIndex[caseKey];

        console.log('request หลัง saveEdit แถวใหม่:', this.request);
        console.log('editingIndex หลัง saveEdit แถวใหม่:', this.editingIndex);

        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        alert('บันทึกแถวใหม่เรียบร้อย');
      },
      error: err => { 
        console.error('Error saveEdit แถวใหม่:', err); 
        alert('เกิดข้อผิดพลาดในการบันทึกแถวใหม่'); 
      }
    });
  } else {
    console.log('กำลังอัพเดตแถวเดิม...');
    this.DetailPurchase.updateRequest(item).subscribe({
      next: res => {
        this.request[rowIndex] = { ...item, ...res, isNew: false };
        delete this.editingIndex[caseKey];

        console.log('request หลัง saveEdit แถวเดิม:', this.request);
        console.log('editingIndex หลัง saveEdit แถวเดิม:', this.editingIndex);

        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        alert('บันทึกแถวเรียบร้อย');
      },
      error: err => { 
        console.error('Error saveEdit แถวเดิม:', err); 
        alert('เกิดข้อผิดพลาดในการบันทึกแถว'); 
      }
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

  const selectedItems = this.request.filter(it => it.Selection && it.Status === 'Waiting');
  if (selectedItems.length === 0) {
    alert('กรุณาเลือกข้อมูลที่ต้องการ (สถานะ Waiting)');
    return;
  }

  this.isCompleting = true;

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
        const insertRes: any = await this.DetailPurchase.insertRequest(item).toPromise();
        if (insertRes && insertRes.ID_Request) item.ID_Request = insertRes.ID_Request;
        else throw new Error('Backend ไม่ส่ง ID กลับมา');

        await this.DetailPurchase.updateStatusToComplete(item.ID_Request, 'Complete').toPromise();
      } else {
        await this.DetailPurchase.updateStatusToComplete(item.ID_Request, 'Complete').toPromise();
      }

      // ลบแถวที่สำเร็จ
      this.request = this.request.filter(r => r.ID_Request !== item.ID_Request);
      console.log('อัปเดตสำเร็จและลบแถว ID:', item.ID_Request);

    } catch (err) {
      item.Status = prevStatus;
      console.error('Error completeSelected ID:', item.ID_Request, err);
      alert(`อัปเดต ID:${item.ID_Request} ไม่สำเร็จ`);
    } finally {
      processNext(index + 1);
    }
  };

  processNext(0);
}

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

