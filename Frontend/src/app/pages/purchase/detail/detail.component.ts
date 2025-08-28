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
import Swal from 'sweetalert2';

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

  // Dropdown data
  PartNo_: any = null;
  ItemNo_: any = null;

  // option dropdown
  PartNo: any = [];
  ItemNo: any[] = [];
  SPEC: any[] = []; // เก็บข้อมูล SPEC ที่ดึงมาจาก API


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
    private FileReadService: FileReadService,
  ) {}



ngOnInit() {
  this.route.paramMap.subscribe(p => {
    this.itemNo = p.get('itemNo') || '';
  });

  // อ่าน category จาก query param
  this.route.queryParamMap.subscribe(q => {
    this.category = q.get('category') || '';
    this.Detail_Purchase();   
    this.get_ItemNo();            // โหลดใหม่เมื่อ category เปลี่ยน
  });
}

// โหลดรายการ purchase request จาก backend
Detail_Purchase() {
  this.DetailPurchase.Detail_Request().subscribe({
    next: (response: any[]) => {
      const filtered = (response || [])
        .filter(it => it.ItemNo === this.itemNo && String(it.Category ?? 'Unknown') === this.category)
        .map(it => ({
          ...it,
          ID_Request: Number(it.ID_Request),   // ✅ บังคับเป็น number
          Selection: false
        }));

      // ✅ กันซ้ำด้วย number แน่นอน
      const seen = new Set<number>();
      const unique = filtered.filter(it => {
        const id = Number(it.ID_Request);
        if (!Number.isFinite(id)) return true; // ถ้า id เพี้ยน ปล่อยผ่าน (หรือจะกรองทิ้งก็ได้)
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      this.request = unique;
    },
    error: e => console.error('Error Detail_Purchase:', e)
  });
}


// เรียกใช้ API
get_ItemNo() {
  this.DetailPurchase.get_ItemNo().subscribe({
    next: (response: any[]) => {
      // เก็บข้อมูล response ลงใน ItemNo
      console.log("Response raw จาก API:", response); // 👈 ดูว่ามีข้อมูลมั้ย
      this.ItemNo = response;
      this.ItemNo = response.filter((item, index, self) =>
          index === self.findIndex(obj => obj.ItemNo === item.ItemNo)
        );
     

      console.log("ItemNo ที่ได้จาก DB:", this.ItemNo);
    },
    error: (e: any) => console.error("Error API get_ItemNo:", e),
  });
}
onItemNoChange(selectedItemNo: string, row: any) {
  // หา object จาก list ItemNo ที่เลือก
  const selected = this.ItemNo.find(x => x.ItemNo === selectedItemNo);
  if (selected) {
    row.SPEC = selected.SPEC; 
    row.ON_HAND = selected.ON_HAND;   // อัปเดต SPEC ของแถวนั้น
  }
}

  toggleAllCheckboxes() {
    this.request.forEach(it => it.Selection = this.selectAllChecked);
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
  }


// เพิ่มแถวใหม่
// เพิ่มแถวใหม่
addNewRequest(newRequestData: any, rowIndex: number) {
  this.DetailPurchase.insertRequest(newRequestData).subscribe({
    next: res => {
      if (!res.ID_Request) { alert('Backend ไม่ส่งข้อมูลกลับมา'); return; }

      const newRow = {
        ...newRequestData,
        ...res,
        ID_Request: Number(res.ID_Request),  // ✅ บังคับเป็น number
        Selection: false,
        isNew: true
      };

      this.request.splice(rowIndex + 1, 0, newRow);
      this.editingIndex[newRow.ID_Request] = rowIndex + 1;

      localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
      Swal.fire({ icon: 'success', title: 'Successfully Added Data Row', showConfirmButton: false, timer: 1330 });
    },
    error: err => { /* ... */ }
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

  // อัปเดต SPEC ให้ตรงกับ ItemNo ล่าสุดก่อนยิง backend
  this.syncSpecWithItemNo(item);

  // เก็บสำเนาไว้สำหรับ rollback ถ้า error
  const snapshot = { ...item };

  // รวมผลตอบกลับ โดยไม่ให้ null/undefined มาทับค่าปัจจุบัน
  const mergeSafe = (original: any, resp: any) => {
    const merged = { ...original, ...(resp || {}) };
    // ✅ การันตี ID เป็น number เสมอ
    merged.ID_Request = Number(resp?.ID_Request ?? original.ID_Request);

    // ป้องกันค่าหาย
    if (resp?.ItemNo == null) merged.ItemNo = original.ItemNo;
    if (resp?.SPEC   == null) merged.SPEC   = original.SPEC;

    // คงสถานะ selection/flag ต่าง ๆ
    merged.Selection = !!original.Selection;
    merged.isNew = false; // ✅ บันทึกแล้วให้ไม่ถือว่าเป็นแถวใหม่อีก
    return merged;
  };

  // ✅ ใช้ "การมี ID จริง" เป็นตัวตัดสิน insert/update (เลิกพึ่ง isNew)
  const hasId = Number.isInteger(Number(item.ID_Request));

  if (!hasId) {
    console.log('กำลังบันทึกแถวใหม่ (insert)...');
    this.DetailPurchase.insertRequest(item).subscribe({
      next: (res) => {
        this.request[rowIndex] = mergeSafe(item, res);
        delete this.editingIndex[caseKey];

        console.log('request หลัง saveEdit แถวใหม่:', this.request);
        console.log('editingIndex หลัง saveEdit แถวใหม่:', this.editingIndex);

        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        Swal.fire({ icon: 'success', title: 'Your work has been saved', showConfirmButton: false, timer: 1330 });
      },
      error: (err) => {
        console.error('Error saveEdit แถวใหม่:', err);
        // rollback
        this.request[rowIndex] = snapshot;
        alert('เกิดข้อผิดพลาดในการบันทึกแถวใหม่');
      }
    });
  } else {
    console.log('กำลังอัพเดตแถวเดิม (update)...');
    this.DetailPurchase.updateRequest(item).subscribe({
      next: (res) => {
        // ❗ ไม่ reload รายการใหม่ เพื่อกันแถวหายจาก filter
        this.request[rowIndex] = mergeSafe(item, res);
        delete this.editingIndex[caseKey];

        console.log('request หลัง saveEdit แถวเดิม:', this.request);
        console.log('editingIndex หลัง saveEdit แถวเดิม:', this.editingIndex);

        localStorage.setItem('purchaseRequest', JSON.stringify(this.request));
        Swal.fire({ icon: 'success', title: 'Your work has been saved', showConfirmButton: false, timer: 1330 });
      },
      error: (err) => {
        console.error('Error saveEdit แถวเดิม:', err);
        // rollback
        this.request[rowIndex] = snapshot;
        alert('เกิดข้อผิดพลาดในการบันทึกแถว');
      }
    });
  }
}
 /** อัปเดต SPEC ให้ตรงกับ ItemNo ปัจจุบันของแถว ก่อนบันทึก */
syncSpecWithItemNo(row: any) {
  if (!row) return;

  // this.ItemNo อาจเป็นได้ทั้ง [{ItemNo, SPEC, ...}] หรือ string[]
  const list = this.ItemNo || [];

  // หา object ใน list ที่ ItemNo ตรงกับของแถว
  const found = list.find((x: any) => {
    const no = typeof x === 'string' ? x : x?.ItemNo;
    return no === row.ItemNo;
  });

  // ถ้า list เป็น object และมี SPEC -> อัปเดต SPEC ให้แถว
  if (found && typeof found !== 'string') {
    const spec = (found as any).SPEC;
    if (typeof spec !== 'undefined' && spec !== null) {
      row.SPEC = String(spec);
    }
  }
  // ถ้าไม่พบ ก็ไม่ต้องทำอะไร ปล่อย SPEC เดิมไว้
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

isCompleting = false;

completeSelected() {
  if (this.isCompleting) return;

  const ids: number[] = (this.request || [])
    .filter(it => it?.Selection === true && it?.Status === 'Waiting')
    .map(it => Number(it.ID_Request))
    .filter(Number.isInteger);

  if (ids.length === 0) {
    Swal.fire({ icon: 'error', title: 'Oops...', text: 'Please select at least one item to complete.' });
    return; // ❗️อย่าลืม return
  }

  this.isCompleting = true;

  // ✅ เรียกครั้งเดียว ส่งหลาย ID
  
this.DetailPurchase.updateStatusToComplete(ids, 'Complete').subscribe({
  next: () => {
    const idSet = new Set(ids);

    // (ถ้าจะคงแถวเดิมไว้ระหว่างรอรีโหลด)
    this.request = this.request.map(r =>
      idSet.has(Number(r.ID_Request))
        ? { ...r, Status: 'Complete', Selection: false, isNew: false }
        : r
    );
    localStorage.setItem('purchaseRequest', JSON.stringify(this.request));

    // 👇 เพิ่มแค่นี้: รีโหลดข้อมูลใหม่จาก backend
    this.Detail_Purchase();   // โหลดรายการตาม filter ปัจจุบัน
    // this.get_ItemNo();     // ถ้าต้องรีโหลด master ItemNo ด้วย ค่อยปลดคอมเมนต์

    Swal.fire({ icon: 'success', title: 'Complete!', text: `Updated ${ids.length} items.` }); // ใช้ backticks
  },
  error: err => {
    console.error('Bulk update failed:', err);
    Swal.fire({ icon: 'error', title: 'Bulk update failed', text: err?.error?.message || '' });
  },
  complete: () => { this.isCompleting = false; }
});
}

// เปิดไฟล์ PDF
openPdfFromPath(filePath: string) {
  console.log('เรียก openPdfFromPath path:', filePath);
  if (!filePath) { alert('ไม่พบ path ของไฟล์'); return; }

const cleanPath = filePath.replace(/^"|"$/g, '');

  this.FileReadService.loadPdfFromPath(cleanPath).subscribe({
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


deleteItem(id: string) {
  console.log('เรียก deleteItem id:', id);

  Swal.fire({
    title: 'Do you want to delete',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    customClass: {
      confirmButton: 'btn btn-success me-3',
      cancelButton: 'btn btn-danger'
    },
    buttonsStyling: false
  }).then((result) => {
    if (result.isConfirmed) {
      // เรียก API ลบ
      this.DetailPurchase.deleteRequest(Number(id)).subscribe({
        next: () => {
          console.log('ลบรายการสำเร็จ id:', id);
          this.request = this.request.filter(item => item.ID_Request !== id);
          console.log('request หลัง deleteItem:', this.request);
          Swal.fire({
            title: 'Delete Success!',
            icon: 'success'
          });
        },
        error: err => {
          console.error('Error deleteItem:', err);
          Swal.fire({
            title: 'เกิดข้อผิดพลาดในการลบ',
            icon: 'error'
          });
        }
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: 'Cancel Delete',
        icon: 'info'
      });
    }
  });
}
}
