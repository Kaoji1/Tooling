import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { CartService } from '../../../core/services/cart.service';
import { SendrequestService } from '../../../core/services/SendRequest.service';
import { FileUploadSerice } from '../../../core/services/FileUpload.service';



@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, FormsModule, CommonModule, NotificationComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  groupedCart: { [case_: string]: any[] } = {};
  editingIndex: { [case_: string]: number | null } = {};
  checkedCases: { [case_: string]: boolean } = {};
  file: any;

  constructor(
    private cartService: CartService,
    private sendrequestService: SendrequestService,
    private FileUploadSerice : FileUploadSerice
  ) {}

  ngOnInit(): void {
    this.loadCartFromDB();
    
  }

  loadCartFromDB() {
  this.cartService.getCartFromDB().subscribe({
    next: (data) => {
      this.groupedCart = this.groupItemsByCase(data);

      for (const case_ in this.groupedCart) {
        this.editingIndex[case_] = null;

        // โหลดชื่อไฟล์เฉพาะกลุ่มที่มีรายการจริง
        const groupItems = this.groupedCart[case_];
        if (groupItems && groupItems.length > 0) {
          this.loadImage(case_);
        }
      }
    },
    error: (err) => {
      console.error('โหลดข้อมูล Cart ล้มเหลว:', err);
      alert('ไม่สามารถโหลดรายการตะกร้าได้');
    }
  });
}
      callLoadImage(caseKey: string): boolean {
      if (!this.imageMap[caseKey]) {
        this.loadImage(caseKey);
      }
      return true;
    }

groupItemsByCase(items: any[]): { [case_: string]: any[] } {
  const grouped: { [case_: string]: any[] } = {};

  items.forEach((item) => {
    const caseKey = item.CASE || 'ไม่ระบุ';

    if (!grouped[caseKey]) {
      grouped[caseKey] = [];
    }

    // เงื่อนไขซ้ำ: ต้องตรงกันทุกฟิลด์เหล่านี้
    const existingItem = grouped[caseKey].find(i =>
      i.PartNo === item.PartNo &&
      i.Process === item.Process &&
      i.Fac === item.Fac &&
      i.ITEM_NO === item.ITEM_NO &&
      i.SPEC === item.SPEC
    );

    if (existingItem) {
      // ถ้าซ้ำ → รวม QTY เข้าด้วยกัน
      existingItem.QTY += item.QTY;
    } else {
      // ถ้าไม่ซ้ำ → เพิ่มใหม่
      grouped[caseKey].push(item);
    }
  });

  return grouped;
}

  startEdit(case_: string, index: number) {
    this.editingIndex[case_] = index;
  }

  saveEdit(case_: string, index: number) {
    const item = this.groupedCart[case_][index];
    this.cartService.updateItemInDB(item).subscribe({
      next: () => {
        alert('บันทึกข้อมูลเรียบร้อย');
        this.editingIndex[case_] = null;
      },
      error: () => alert('เกิดข้อผิดพลาดในการบันทึก'),
    });
  }

removeItem(case_: string, index: number) {
  const item = this.groupedCart[case_][index];
  const id = item.ID_Cart || item.id || item.ItemID;

  console.log(' ลบ ID:', id); // เช็คว่าเป็น undefined หรือเปล่า

  if (!id) {
    alert('ไม่พบรหัส ID_Cart สำหรับลบ');
    return;
  }

  this.cartService.removeItemFromDB(id).subscribe({
    next: () => {
      this.groupedCart[case_].splice(index, 1);
      if (this.groupedCart[case_].length === 0) {
        delete this.groupedCart[case_];
      }
    },
    error: (err) => {
      console.error('ลบไม่สำเร็จ:', err);
      alert('ลบไม่สำเร็จ');
    }
  });
}

async CreateDocByCase() {
  if (!this.groupedCart || Object.keys(this.groupedCart).length === 0) {
    alert('ไม่มีรายการในตะกร้า');
    return;
  }

  const createdDocs: string[] = [];

  for (const caseKey in this.groupedCart) {
    if (!this.checkedCases[caseKey]) continue;

    const groupItems = this.groupedCart[caseKey];
    if (groupItems.length === 0) continue;

    const firstItem = groupItems[0];
    const case_ = firstItem.CASE;
    const process = firstItem.Process;
    const factory = firstItem.Fac || '';

    //  ตรวจสอบไฟล์แนบจาก imageMap ที่โหลดไว้
    const imageInfo = this.imageMap[caseKey];
    const fileName = imageInfo?.fileName || null;
    const fileData = imageInfo?.imageData || null;
    console.log('case:',process)

    if (!case_ || !process || !factory) {
      alert(`ข้อมูลไม่ครบ กรุณาตรวจสอบ Case: ${case_} | Process: ${process} | Factory: ${factory}`);
      continue;
    }

    try {
      const res = await this.sendrequestService.GenerateNewDocNo(case_, process, factory).toPromise();
      const docNo = res.DocNo;

      groupItems.forEach((item: any) => {
        item.Doc_no = docNo;
        item.FileName = fileName;
        item.FileData = fileData;
      });

      await this.sendrequestService.SendRequest(groupItems).toPromise();
      await this.cartService.deleteItemsByCase(case_).toPromise();

      createdDocs.push(`📄 ${docNo} | ${groupItems.length} รายการ`);

      delete this.groupedCart[caseKey];
      delete this.checkedCases[caseKey];

    } catch (err) {
      console.error(`ส่ง ${case_} ล้มเหลว`, err);
      alert(`ส่ง ${case_} ล้มเหลว`);
    }
  }

  // เพิ่มการแจ้งเตือนด้านล่าง
  if (createdDocs.length > 0) {
    alert('สร้างและส่งเอกสารสำเร็จ:\n\n' + createdDocs.join('\n'));
  } else {
    alert('ไม่มีเอกสารใดถูกสร้าง กรุณาติ๊กก่อนส่ง');
  }
}
selectedFiles: { [caseKey: string]: File | null } = {};
uploadStatusMap: { [caseKey: string]: string } = {};
uploadStatus = '';


// ฟังก์ชันเลือกไฟล์แบบแยก Case
onFileSelected(event: Event, caseKey: string): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.selectedFiles[caseKey] = input.files[0];
    console.log(`Selected file for ${caseKey}:`, this.selectedFiles[caseKey]);
    
  }
}


uploadFile(caseKey:string):void {
  console.log("เลือกก",this.selectedFiles)
  console.log("caseKey:",caseKey)
  console.log("file from key:",this.selectedFiles[caseKey]);
const file=this.selectedFiles[caseKey];
if(!file){
  this.uploadStatus = `กรุณาเลือกไฟล์`
  console.log(this.uploadStatus);
  return;
}
this.FileUploadSerice.FileUpload(file,caseKey).subscribe ({
  
  next : (response) => {
    console.log('ส่งไฟลแล้ว',file);
    this.uploadStatus = `อัปโหลดเรียบร้อยแล้ว ${caseKey}`;
    this.selectedFiles[caseKey] = null ;
    this.loadImage(caseKey);
    
  },
  error: err => {
    this.uploadStatus = `ล้มเหลวการอัปโหลด เคส ${caseKey}`;
    console.error(err);
  }
});
}


imageMap: { [key: string]: { fileName: string, imageData: string } } = {};

loadImage(caseKey: string) {
  this.FileUploadSerice.GetImage(caseKey).subscribe({
    next: (res) => {
      this.imageMap[caseKey] = res;
    },
    error: () => {
      console.error(`โหลดภาพล้มเหลวสำหรับ ${caseKey}`);
    }
  });
}

loadPdf(caseKey: string) {
  this.FileUploadSerice.GetImage(caseKey).subscribe({
    next: (res) => {
      const pdfWindow = window.open();
      if (pdfWindow) {
        pdfWindow.document.write(`
          <iframe width="100%" height="100%" src="${res.imageData}"></iframe>
        `);
      }
    },
    error: () => {
      alert("ไม่สามารถโหลดไฟล์ PDF ได้");
    }
  });
}

clearSelectedCases() {
  for (const caseKey in this.checkedCases) {
    if (this.checkedCases[caseKey]) {
       delete this.groupedCart[caseKey];
    }
  }
    this.checkedCases = {};
  }
openPdfFromPath(filePath: string) {
  if (!filePath) {
    alert('ไม่พบพาธของไฟล์');
    return;
  }

  this.FileUploadSerice.loadPdfFromPath(filePath).subscribe({
    next: (res) => {
      // 1. แยก base64 ออกจาก prefix
      const base64 = res.imageData.split(',')[1];

      // 2. แปลง base64 เป็น binary
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // 3. แปลงเป็น Blob
      const blob = new Blob([bytes], { type: 'application/pdf' });

      // 4. สร้าง URL จาก Blob
      const blobUrl = URL.createObjectURL(blob);

      // 5. เปิดแท็บใหม่
      window.open(blobUrl, '_blank');
    },
    error: () => {
      alert('ไม่สามารถโหลด PDF ได้');
    }
  });
}

}

 // อัปโหลดไฟล์ของเคสเดียว
//  uploadFile(caseKey: string): void {
//   const file = this.selectedFiles[caseKey];

//   console.log(' เริ่มอัปโหลดเคส:', caseKey);
//   console.log(' ไฟล์ที่เลือก:', file);

//   if (!file) {
//     this.uploadStatus = `กรุณาเลือกไฟล์สำหรับเคส ${caseKey} ก่อนอัปโหลด`;
//     console.warn(` ไม่พบไฟล์สำหรับเคส: ${caseKey}`);
//     return;
//   }

//   const formData = new FormData();
//   formData.append('file', file);
//   formData.append('caseKey', caseKey);

//   console.log(' FormData ที่จะส่ง:', {
//     fileName: file.name,
//     caseKey: caseKey
//   });

//   this.FileUploadSerice.FileUpload(formData).subscribe({
//     next: () => {
//       console.log(` อัปโหลดสำเร็จสำหรับเคส: ${caseKey}`);
//       this.uploadStatus = `อัปโหลดไฟล์สำเร็จสำหรับเคส ${caseKey}`;
//       this.selectedFiles[caseKey] = null;
//     },
//     error: (err: { message: any }) => {
//       console.error(` อัปโหลดล้มเหลวสำหรับเคส: ${caseKey}`, err);
//       this.uploadStatus = `อัปโหลดล้มเหลวสำหรับเคส ${caseKey}: ${err.message || 'Unknown error'}`;
//     }
//   });
// }
//  uploadedFileNames: { [caseKey: string]: string } = {};

// loadFileName(caseKey: string): void {
//   this.FileUploadSerice.GetImage(caseKey).subscribe({
//     next: (res) => {
//       this.uploadedFileNames[caseKey] = res.fileName;
//     },
//     error: () => {
//       this.uploadedFileNames[caseKey] = ''; // ไม่พบก็ไม่โชว์อะไร
//     }
//   });
// }