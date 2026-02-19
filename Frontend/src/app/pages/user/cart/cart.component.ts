import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { CartService } from '../../../core/services/cart.service';
import { SendrequestService } from '../../../core/services/SendRequest.service';
import { FileUploadSerice } from '../../../core/services/FileUpload.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, FormsModule, CommonModule, NotificationComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  userRole: string = 'view';
  groupedCart: { [case_: string]: any[] } = {};
  editingIndex: { [case_: string]: number | null } = {};
  checkedCases: { [case_: string]: boolean } = {};
  file: any;
  employeeId: string | null = null; //กำหนดตัวแปลสำหรับเก็บค่าไอดีที่อยุ่ในsessionเมื่อlogin
  Role: string | null = null; //กำหนดตัวแปลสำหรับเก็บค่าไอดีที่อยุ่ในsessionเมื่อlogin

  constructor(
    private cartService: CartService,
    private sendrequestService: SendrequestService,
    private FileUploadSerice: FileUploadSerice,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  isViewer(): boolean {
    return this.authService.isViewer();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadCartFromDB();
    if (isPlatformBrowser(this.platformId)) {
      const userJson = localStorage.getItem('user'); // ดึง object ทั้งก้อน
      if (userJson) {
        try {
          const user = JSON.parse(userJson); // แปลง string เป็น object
          this.employeeId = user.Employee_ID; // ดึงเฉพาะ Employee_ID
          console.log('gggg', this.employeeId)
          this.Role = user.Role;
        } catch (e) {
          console.error('Error parsing user from sessionStorage', e);
          this.employeeId = null;
          this.Role = null;
        }
      } else {
        this.employeeId = null; // หรือกำหนด default ถ้าต้องการ
        this.Role = null;
      }
    }

    if (this.authService.isViewer()) {
      // console.log('User is viewer: view-only mode');
      // สามารถทำ logic ซ่อนหรือ disable ปุ่มแก้ไข/ลบได้ที่นี่
    }

    // console.log('login:', this.employeeId); // จะได้ 6020A
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
        if (isPlatformBrowser(this.platformId)) {
          alert('ไม่สามารถโหลดรายการตะกร้าได้');
        }
      }
    });
  }
  callLoadImage(caseKey: string): boolean {
    if (!this.imageMap[caseKey]) {
      this.loadImage(caseKey);
    }
    return true;
  }

  groupItemsByCase(items: any[]): { [key: string]: any[] } {
    const grouped: { [key: string]: any[] } = {};

    items.forEach((item) => {
      const case_ = item.CASE || item.Case_ || 'ไม่ระบุ';
      const fac = item.Fac || '-';
      const process = item.Process || '-';

      const groupKey = ` ${case_}___${fac}___${process}`; // ใช้ ___ เพื่อแยกชัดเจน

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }

      const existing = grouped[groupKey].find(existingItem =>
        existingItem.PartNo === item.PartNo &&
        existingItem.ItemNo === item.ItemNo &&
        existingItem.SPEC === item.SPEC &&
        existingItem.Process === item.Process &&
        existingItem.MC === item.MC &&
        existingItem.Fresh_QTY === item.Fresh_QTY &&
        existingItem.Reuse_QTY === item.Reuse_QTY
      );

      if (existing) {
        existing.QTY += Number(item.QTY || 0);
      } else {
        grouped[groupKey].push({ ...item });
      }
    });

    return grouped;
  }
  startEdit(case_: string, index: number) {
    this.editingIndex[case_] = index;
  }

  saveEdit(case_: string, index: number) {
    const editedItem = this.groupedCart[case_][index];
    const editedPartNo = editedItem.PartNo;
    const newPathDwg = editedItem.PathDwg;
    const newPathLayout = editedItem.PathLayout;

    const groupItems = this.groupedCart[case_];
    const updatedItems = groupItems.map((item: any) => {
      if (item.PartNo === editedPartNo) {
        item.PathDwg = newPathDwg;
        item.PathLayout = newPathLayout;
      }
      return item;
    });

    this.cartService.updateMultipleItemsInDB(updatedItems).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Save',
          text: 'UpdateComplete',
          showConfirmButton: false,
          timer: 1500
        });
        this.editingIndex[case_] = null;
      },
      error: () => alert('Error Occurred Recording'),
    });
  }

  removeItem(case_: string, index: number) {
    const matchItem = this.groupedCart[case_][index];

    // สร้างเงื่อนไขจับคู่รายการที่เหมือนกัน
    const matchCriteria = {
      PartNo: matchItem.PartNo,
      ItemNo: matchItem.ItemNo,
      SPEC: matchItem.SPEC,
      Process: matchItem.Process,
      MC: matchItem.MC,
      Fresh_QTY: matchItem.Fresh_QTY,
      Reuse_QTY: matchItem.Reuse_QTY
    };

    // หารายการทั้งหมดที่ตรงกันในกลุ่มเดียวกัน
    const itemsToDelete = this.groupedCart[case_].filter(item =>
      item.PartNo === matchCriteria.PartNo &&
      item.ItemNo === matchCriteria.ItemNo &&
      item.SPEC === matchCriteria.SPEC &&
      item.Process === matchCriteria.Process &&
      item.MC === matchCriteria.MC &&
      item.Fresh_QTY === matchCriteria.Fresh_QTY &&
      item.Reuse_QTY === matchCriteria.Reuse_QTY
    );

    if (itemsToDelete.length === 0) {
      Swal.fire('The item you want to delete was not found', '', 'info');
      return;
    }

    // ยืนยันก่อนลบ
    Swal.fire({
      title: 'Do you want to delete?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {

        // 🔧 ประกาศ id ภายใน map เพื่อส่งให้ Service ลบ
        const deleteObservables = itemsToDelete.map(item => {
          const id = item.ID_Cart || item.id || item.ItemID;
          return this.cartService.removeItemFromDB(id);
        });

        // รันลบทั้งหมดพร้อมกัน
        Promise.all(deleteObservables.map(obs => obs.toPromise()))
          .then(() => {
            // ลบออกจาก frontend
            this.groupedCart[case_] = this.groupedCart[case_].filter(existing =>
              !(
                existing.PartNo === matchCriteria.PartNo &&
                existing.ItemNo === matchCriteria.ItemNo &&
                existing.SPEC === matchCriteria.SPEC &&
                existing.Process === matchCriteria.Process &&
                existing.MC === matchCriteria.MC &&
                existing.Fresh_QTY === matchCriteria.Fresh_QTY &&
                existing.Reuse_QTY === matchCriteria.Reuse_QTY
              )
            );

            if (this.groupedCart[case_].length === 0) {
              delete this.groupedCart[case_];
            }

            Swal.fire('Delete Complete', ` ${itemsToDelete.length} Item has been Delete `, 'success');
          })
          .catch(err => {
            console.error('ลบไม่สำเร็จ:', err);
            Swal.fire('Error', 'Unable to delete all items', 'error');
          });
      }
    });
  }
  async CreateDocByCase() {
    if (!this.groupedCart || Object.keys(this.groupedCart).length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'There are no items in the cart',
        text: 'Please add items before proceeding',
        confirmButtonText: 'OK'
      });
      return;
    }

    const createdDocs: string[] = [];
    let currentUser: any = {};
    if (isPlatformBrowser(this.platformId)) {
      currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    }
    const employessName = currentUser.Employee_Name || 'Unknow';

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
      // console.log('case:',process)

      if (!case_ || !process || !factory) {
        if (isPlatformBrowser(this.platformId)) {
          alert(`The information is incomplete. Please check Case: ${case_} | Process: ${process} | Factory: ${factory}`);
        }
        continue;
      }

      try {
        const res = await this.sendrequestService.GenerateNewDocNo(case_, process, factory).toPromise();
        const docNo = res.DocNo;

        groupItems.forEach((item: any) => {
          item.Doc_no = docNo;
          item.FileName = fileName;
          item.FileData = fileData;
          item.Employee_Name = employessName;
        });
        // console.log('EMP:',groupItems)

        await this.sendrequestService.SendRequest(groupItems).toPromise();
        await this.cartService.deleteItemsByCaseProcessFac(case_, process, factory).toPromise();

        createdDocs.push(`📄 ${docNo} | ${groupItems.length} list`);

        delete this.groupedCart[caseKey];
        delete this.checkedCases[caseKey];

      } catch (err) {
        console.error(`ส่ง ${case_} ล้มเหลว`, err);
        if (isPlatformBrowser(this.platformId)) {
          alert(`ส่ง ${case_} ล้มเหลว`);
        }
      }
    }

    // เพิ่มการแจ้งเตือนด้านล่าง
    if (createdDocs.length > 0) {
      Swal.fire({
        icon: 'success',
        title: 'Documents Created and Sent Successfully',
        html: createdDocs.join('<br>'), // ใช้ <br> เพื่อขึ้นบรรทัดใหม่
        confirmButtonText: 'Ok'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'No Documents Created',
        text: 'Please select items before sending',
        confirmButtonText: 'Ok'
      });
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
      // console.log(`Selected file for ${caseKey}:`, this.selectedFiles[caseKey]);

    }
  }


  uploadFile(caseKey: string): void {
    // console.log("เลือกก",this.selectedFiles)
    // console.log("caseKey:",caseKey)
    // console.log("file from key:",this.selectedFiles[caseKey]);
    const file = this.selectedFiles[caseKey];
    if (!file) {
      this.uploadStatus = `Please select file`
      // console.log(this.uploadStatus);
      return;
    }
    this.FileUploadSerice.FileUpload(file, caseKey).subscribe({

      next: (response) => {
        // console.log('File sent',file);
        this.uploadStatus = `Uploaded Complete ${caseKey}`;
        this.selectedFiles[caseKey] = null;
        this.loadImage(caseKey);

      },
      error: err => {
        this.uploadStatus = `Failed to upload case ${caseKey}`;
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
        console.error(`Image loading failed ${caseKey}`);
      }
    });
  }

  loadPdf(caseKey: string) {
    this.FileUploadSerice.GetImage(caseKey).subscribe({
      next: (res) => {
        if (isPlatformBrowser(this.platformId)) {
          const pdfWindow = window.open();
          if (pdfWindow) {
            pdfWindow.document.write(`
                 <iframe width="100%" height="100%" src="${res.imageData}"></iframe>
               `);
          }
        }
      },
      error: () => {
        if (isPlatformBrowser(this.platformId)) {
          alert("Unable to load PDF file");
        }
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
      if (isPlatformBrowser(this.platformId)) {
        alert('File path not found');
      }
      return;
    }

    //  ลบเครื่องหมาย " ทั้งหน้าและหลังออก
    const cleanPath = filePath.replace(/^"|"$/g, '');

    this.FileUploadSerice.loadPdfFromPath(cleanPath).subscribe({
      next: (res) => {
        const base64 = res.imageData.split(',')[1];
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        window.open(blobUrl, '_blank');
      },
      error: () => {
        if (isPlatformBrowser(this.platformId)) {
          alert('Unable to load PDF file');
        }
      }
    });
  }

  getRowClass(item: any): string {
    const dwg = (item.PathDwg ?? '').toString().trim();
    const layout = (item.PathLayout ?? '').toString().trim();

    const hasDwg = dwg !== '';
    const hasLayout = layout !== '';

    if (hasDwg && hasLayout) return 'row-green';
    if (hasDwg || hasLayout) return 'row-orange';
    return 'row-red';
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



// groupItemsByCase(items: any[]): { [case_: string]: any[] } {
//   const grouped: { [case_: string]: any[] } = {};

//   items.forEach((item) => {
//     const caseKey = item.CASE || 'ไม่ระบุ';

//     if (!grouped[caseKey]) {
//       grouped[caseKey] = [];
//     }

//     // เงื่อนไขซ้ำ: ต้องตรงกันทุกฟิลด์เหล่านี้
//     const existingItem = grouped[caseKey].find(i =>
//       i.PartNo === item.PartNo &&
//       i.Process === item.Process &&
//       i.Fac === item.Fac &&
//       i.ITEM_NO === item.ITEM_NO &&
//       i.SPEC === item.SPEC &&
//       i.FreshQty	=== item.FreshQty	&&
//       i.ReuseQty	=== item.ReuseQty
//     );

//     if (existingItem) {
//       // ถ้าซ้ำ → รวม QTY เข้าด้วยกัน
//       existingItem.QTY += item.QTY;
//     } else {
//       // ถ้าไม่ซ้ำ → เพิ่มใหม่
//       grouped[caseKey].push(item);
//     }
//   });

//   return grouped;
// }