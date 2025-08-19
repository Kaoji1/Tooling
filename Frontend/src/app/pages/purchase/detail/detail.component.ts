import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';
import { FileReadService } from '../../../core/services/FileRead.service';
import { lastValueFrom } from 'rxjs';

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
  editingIndex: { [key: string]: number | null } = {};
  request: any[] = [];
  newRequestData: any = {};
  selectAllChecked = false;

  category = '';
  itemNo = '';
  displayIndex = -1;
  items: any[] = [];
  highlightedRow: number | null = null;

  isCompleting = false; // กันกดซ้ำ

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private DetailPurchase: DetailPurchaseRequestlistService,
    private FileReadService: FileReadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(p => {
      this.itemNo = p.get('itemNo') || '';
    });

    // อ่าน category จาก query param
    this.route.queryParamMap.subscribe(q => {
      this.category = q.get('category') || '';
      this.Detail_Purchase(); // โหลดใหม่เมื่อ category เปลี่ยน
    });
  }

  // โหลดรายการ purchase request จาก backend
  Detail_Purchase() {
    this.DetailPurchase.Detail_Request().subscribe({
      next: (response: any[]) => {
        // กรองด้วย ItemNo + Category จาก DB ตรง ๆ
        const filtered = (response || [])
          .filter(it =>
            String(it.ItemNo) === String(this.itemNo) &&
            String(it.Category ?? 'Unknown') === String(this.category)
          )
          .map(it => ({ ...it, Selection: false }));

        // กันซ้ำด้วย ID_Request
        const seen = new Set<number>();
        const unique = filtered.filter(it => {
          const id = Number(it.ID_Request);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        // ไม่ append เพื่อไม่ให้ผสม
        this.request = unique;
      },
      error: e => console.error('Error Detail_Purchase:', e)
    });
  }

  // Select all
  toggleAllCheckboxes() {
    this.request.forEach(it => (it.Selection = this.selectAllChecked));
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
  }

  // trackBy ช่วยให้ render นิ่ง
  trackById = (_: number, r: any) => Number(r.ID_Request ?? -1);

  // เพิ่มแถวใหม่ (insert ด้านหน้า UI อย่างถูกต้อง)
  addNewRequest(newRequestData: any, rowIndex: number) {
    console.log('เรียก addNewRequest:', newRequestData, 'rowIndex:', rowIndex);

    this.DetailPurchase.insertRequest(newRequestData).subscribe({
      next: (res: any) => {
        console.log('ผลลัพธ์จาก backend insertRequest:', res);
        // backend ส่ง { message: 'เพิ่มข้อมูลสำเร็จ', ID_Request: 626 }
        const ID_Request = res?.ID_Request ?? res?.ID_Request;
        if (!ID_Request) {
          alert('Backend ไม่ส่ง ID ใหม่กลับมา');
          return;
        }

        // เติมฟิลด์ให้ครบเพื่อผ่าน filter (ItemNo + Category)
        const newRow = {
          ...newRequestData,
          ...res,
          ID_Request: ID_Request,
          ItemNo: newRequestData?.ItemNo ?? this.itemNo,
          Category: newRequestData?.Category ?? this.category,
          Selection: false,
          isNew: true
        };

        // อัปเดต array แบบ immutable เพื่อให้ Angular รีเฟรชทันที
        const insertAt = Math.max(0, (rowIndex ?? -1) + 1);
        this.request = [
          ...this.request.slice(0, insertAt),
          newRow,
          ...this.request.slice(insertAt)
        ];

        this.editingIndex[newRow.ID_Request] = insertAt;

        this.cdr.markForCheck();
        // this.cdr.detectChanges(); // ใช้ถ้ายังไม่อัปเดต

        console.log('request หลังเพิ่มแถวใหม่:', this.request);
        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        alert('เพิ่มข้อมูลสำเร็จ');
      },
      error: err => {
        console.error('Error addNewRequest:', err);
        alert(err?.error?.message ?? 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
      }
    });
  }

  startEdit(caseKey: number, rowIndex: number) {
    console.log('เรียก startEdit caseKey:', caseKey, 'rowIndex:', rowIndex);
    this.editingIndex[caseKey] = rowIndex;
    console.log('editingIndex หลัง startEdit:', this.editingIndex);
  }

  async saveEdit(caseKey: number, rowIndex: number) {
    const item = this.request[rowIndex];
    console.log('เรียก saveEdit caseKey:', caseKey, 'rowIndex:', rowIndex, 'item:', item);
    if (!item) return;

    try {
      if (item.isNew) {
        const res: any = await lastValueFrom(this.DetailPurchase.insertRequest(item));
        const ID_Request = res?.ID_Request ?? res?.ID_Request;
        if (!ID_Request) throw new Error('Backend ไม่ส่ง ID ใหม่กลับมา');

        this.request[rowIndex] = { ...item, ...res, ID_Request: ID_Request, isNew: false, Selection: false };
        delete this.editingIndex[caseKey];
        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        alert('บันทึกแถวใหม่เรียบร้อย');
      } else {
        const res: any = await lastValueFrom(this.DetailPurchase.updateRequest(item));
        this.request[rowIndex] = { ...item, ...res, isNew: false };
        delete this.editingIndex[caseKey];
        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        alert('บันทึกแถวเรียบร้อย');
      }
    } catch (err) {
      console.error('Error saveEdit:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกแถว');
    }
  }

  // ลบแถว
  deleteRow(rowIndex: number) {
    const item = this.request[rowIndex];
    console.log('เรียก deleteRow rowIndex:', rowIndex, 'item:', item);
    if (!item) return;

    if (item.isNew) {
      // ยังไม่ได้บันทึก DB ลบทิ้งหน้า UI ได้เลย
      this.request = this.request.filter((_, i) => i !== rowIndex);
      delete this.editingIndex[item.ID_Request];
      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
      alert('ลบแถวเรียบร้อย');
    } else {
      this.DetailPurchase.deleteRequest(Number(item.ID_Request)).subscribe({
        next: () => {
          this.request = this.request.filter(r => Number(r.ID_Request) !== Number(item.ID_Request));
          delete this.editingIndex[item.ID_Request];
          localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
          alert('ลบข้อมูลสำเร็จ');
        },
        error: err => {
          console.error('Error deleteRow แถวเดิม:', err);
          alert('ไม่สามารถลบข้อมูลได้');
        }
      });
    }
  }

  // ลบรายการด้วย ID (ฟังก์ชันแยก)
  deleteItem(id: string) {
    console.log('เรียก deleteItem id:', id);
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return;

    this.DetailPurchase.deleteRequest(Number(id)).subscribe({
      next: () => {
        this.request = this.request.filter(item => Number(item.ID_Request) !== Number(id));
        console.log('request หลัง deleteItem:', this.request);
      },
      error: err => {
        console.error('Error deleteItem:', err);
        alert('เกิดข้อผิดพลาดในการลบ');
      }
    });
  }

  // ทำ Complete ทีละรายการ (กันกดซ้ำ และไม่ใช้ toPromise)
  async completeSelected() {
    if (this.isCompleting) return;

    const selectedItems = this.request.filter(it => it.Selection && it.Status === 'Waiting');
    if (selectedItems.length === 0) {
      alert('กรุณาเลือกข้อมูลที่ต้องการ (สถานะ Waiting)');
      return;
    }

    this.isCompleting = true;

    for (const item of selectedItems) {
      const prevStatus = item.Status;

      try {
        item.Status = 'Complete'; // optimistic update

        if (item.isNew) {
          const insertRes: any = await lastValueFrom(this.DetailPurchase.insertRequest(item));
          const ID_Request = insertRes?.ID_Request ?? insertRes?.ID_Request;
          if (!ID_Request) throw new Error('Backend ไม่ส่ง ID กลับมา');

          item.ID_Request = ID_Request;
          await lastValueFrom(this.DetailPurchase.updateStatusToComplete(item.ID_Request, 'Complete'));
        } else {
          await lastValueFrom(this.DetailPurchase.updateStatusToComplete(item.ID_Request, 'Complete'));
        }

        // ลบแถวที่เสร็จ
        this.request = this.request.filter(r => Number(r.ID_Request) !== Number(item.ID_Request));
      } catch (err) {
        item.Status = prevStatus; // rollback
        console.error('Error completeSelected ID:', item.ID_Request, err);
        alert(`อัปเดต ID: ${item.ID_Request} ไม่สำเร็จ`);
      }
    }

    this.isCompleting = false;
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
}