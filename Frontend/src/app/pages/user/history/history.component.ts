import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { DropdownSearchComponent } from '../../../components/dropdown-search/dropdown-search.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { NgForOf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { UserHistoryService } from '../../../core/services/UserHistory.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { FileReadService } from '../../../core/services/FileRead.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HistoryPrint } from '../../../core/services/HistoryPrint.service';
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2';
// import { TableModule } from 'primeng/table';
// import { TagModule } from 'primeng/tag';
// import { ButtonModule } from 'primeng/button';

declare var bootstrap: any;
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    DropdownSearchComponent,
    NotificationComponent,
    NgForOf,
    CommonModule,
    FormsModule,
    NgSelectModule,

  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];
  statussList: { label: string, value: string }[] = [];
  partNoList: { label: string, value: string }[] = [];
  divisionList: { label: string, value: string }[] = [];
  docNoList: { label: string, value: string }[] = [];
  RequesterList: { label: string, value: string }[] = [];
  selectedPartNo: string | null = null;
  fromDate: string = '';
  toDate: string = '';
  Status_: string | null = null;



  selectedItem: any = null;
  selectedDivision: string | null = null;
  selectedDocNo: string | null = null;
  selectedRequester: string | null = null;
  Total_: string | null = null;
  Type_: string | null = null;

  sortKey: string = '';   // คอลัมน์ที่ sort
  sortAsc: boolean = true; // true = ASC, false = DESC

  totalList: any[] = [];
  currentUser: any;
  canPrint = false;
  // Dropdown Type
  Type = [
    { label: 'Layout', value: 'PathLayout' },
    { label: 'Drawing', value: 'PathDwg' }
  ];

  // URL สำหรับ preview PDF
  previewUrl: SafeResourceUrl | null = null;

  constructor(
    private userhistory: UserHistoryService,
    private FileReadService: FileReadService,
    private sanitizer: DomSanitizer,
    private HistoryPrint: HistoryPrint,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.User_History();
    this.get_Total();

    if (isPlatformBrowser(this.platformId)) {
      this.currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    } else {
      this.currentUser = {};
    }

    const myId = this.currentUser?.Employee_ID;
    if (!myId) return; // Skip permission check if no user ID (SSR or not logged in)

    // เรียก API ตรวจสอบสิทธิ์
    this.HistoryPrint.checkPrintPermission(myId).subscribe({
      next: (res: any) => {
        this.canPrint = res.allowed;
      },
      error: (err) => console.error("Error checking print permission:", err)
    });
  }

  User_History() {
    this.userhistory.User_History().subscribe({
      next: (response: any[]) => {
        this.requests = [...response];
        this.filteredRequests = [...this.requests];

        // สร้าง PartNo list
        const uniquePartNo = [...new Set(this.requests.map(r => r.PartNo))];
        this.partNoList = uniquePartNo.map(p => ({ label: p, value: p }));

        // สร้าง Division list
        const uniqueDivision = [...new Set(this.requests.map(r => r.Division))];
        this.divisionList = uniqueDivision.map(d => ({ label: d, value: d }));

        // สร้าง DocNo list
        const uniqueDocNo = [...new Set(this.requests.map(r => r.DocNo))];
        this.docNoList = uniqueDocNo.map(d => ({ label: d, value: d }));

        const uniqueRequester = [...new Set(this.requests.map(r => r.Requester))];
        this.RequesterList = uniqueRequester.map(d => ({ label: d, value: d }));


        // สร้าง Status list แบบ normalize CompleteToExcel -> Complete
        const uniqueStatus = [
          ...new Set(
            this.requests.map(r => r.Status === 'CompleteToExcel' ? 'Complete' : r.Status)
          )
        ];
        this.statussList = uniqueStatus.map(s => ({ label: s, value: s }));
      },
      error: e => console.error(e)
    });
  }

  // onFilter() {
  //   this.filteredRequests = this.requests.filter(item => {
  //     // 🔹 normalize Status ให้ตรงกัน (CompleteToExcel → Complete)
  //     const status = (item.Status ?? '').toLowerCase().trim();
  //     const normalizedStatus = item.Status === 'CompleteToExcel' ? 'Complete' : item.Status;
  //     const matchStatus = status === 'complete' || status === 'completetoexcel';



  //     // 🔹 ตรวจสอบ PartNo / Status (เหมือนเดิม)
  //     const matchPartNo = !this.selectedPartNo || item.PartNo === this.selectedPartNo;
  //     const matchDivision = !this.selectedDivision || item.Division === this.selectedDivision;
  //     const matchDocNo = !this.selectedDocNo || item.DocNo === this.selectedDocNo;
  //     const matchStatusLabel = !this.Status_ || normalizedStatus === this.Status_;

  //     // 🔹 แปลง input วันที่เป็น Date object
  //     const fromDateObj = this.fromDate ? new Date(this.fromDate) : null;
  //     const toDateObj   = this.toDate   ? new Date(this.toDate)   : null;

  //     // 🔹 แปลงข้อมูลจริงใน record เป็น Date object
  //     const requestDate = item.DateTime_Record ? new Date(item.DateTime_Record) : null;
  //     const dueDate     = item.DueDate ? new Date(item.DueDate) : null;

  //     let matchDate: boolean = true;

  //     if (fromDateObj && toDateObj) {
  //       // ✅ กรณีเลือกทั้งสองวัน ต้องตรงกันทั้ง RequestDate และ DueDate
  //       matchDate = !!(
  //         requestDate &&
  //         dueDate &&
  //         requestDate.toDateString() === fromDateObj.toDateString() &&
  //         dueDate.toDateString() === toDateObj.toDateString()
  //       );
  //     } else if (fromDateObj) {
  //       // ✅ เลือกเฉพาะ fromDate → เทียบเฉพาะ RequestDate
  //       matchDate = !!(requestDate && requestDate.toDateString() === fromDateObj.toDateString());
  //     } else if (toDateObj) {
  //       // ✅ เลือกเฉพาะ toDate → เทียบเฉพาะ DueDate
  //       matchDate = !!(dueDate && dueDate.toDateString() === toDateObj.toDateString());
  //     }

  //     return matchStatus && matchPartNo && matchStatusLabel && matchDate && matchDivision && matchDocNo;
  //   });
  // }

  onFilter() {
    this.filteredRequests = this.requests.filter(item => {
      // 🔹 normalize Status ให้ตรงกัน
      const status = (item.Status ?? '').toLowerCase().trim();
      const normalizedStatus = status === 'completetoexcel' ? 'complete' : status;

      const matchStatus = !this.Status_ || normalizedStatus === this.Status_.toLowerCase().trim();

      // 🔹 ตรวจสอบ PartNo / Division / DocNo
      const matchPartNo = !this.selectedPartNo || String(item.PartNo).trim() === String(this.selectedPartNo).trim();
      const matchDivision = !this.selectedDivision || String(item.Division).trim() === String(this.selectedDivision).trim();
      const matchDocNo = !this.selectedDocNo || String(item.DocNo).trim() === String(this.selectedDocNo).trim();
      const matchRequester = !this.selectedRequester || String(item.Requester).trim() === String(this.selectedRequester).trim();

      // 🔹 แปลง input วันที่เป็น Date object
      const fromDateObj = this.fromDate ? new Date(this.fromDate) : null;
      const toDateObj = this.toDate ? new Date(this.toDate) : null;

      // 🔹 แปลงข้อมูลจริงใน record เป็น Date object
      const requestDate = item.DateTime_Record ? new Date(item.DateTime_Record) : null;
      const dueDate = item.DueDate ? new Date(item.DueDate) : null;

      let matchDate = true;

      if (fromDateObj && toDateObj) {
        matchDate = !!(
          requestDate &&
          dueDate &&
          requestDate.toDateString() === fromDateObj.toDateString() &&
          dueDate.toDateString() === toDateObj.toDateString()
        );
      } else if (fromDateObj) {
        matchDate = !!(requestDate && requestDate.toDateString() === fromDateObj.toDateString());
      } else if (toDateObj) {
        matchDate = !!(dueDate && dueDate.toDateString() === toDateObj.toDateString());
      }

      return matchStatus && matchPartNo && matchDivision && matchDocNo && matchDate && matchRequester;
    });
  }

  //  เรียงลำดับจาก DueDate เก่าสุด -> ล่าสุด
  onSort(key: string) {
    if (this.sortKey === key) {
      // ถ้ากดซ้ำ → สลับ ASC/DESC
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }

    this.filteredRequests.sort((a, b) => {
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';

      // ✅ เช็คถ้าเป็น Date ให้แปลงเป็น number ก่อนเปรียบเทียบ
      const isDate = key === 'ReqDate' || key === 'DueDate';
      if (isDate) {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return this.sortAsc ? dateA - dateB : dateB - dateA;
      }

      // ✅ ถ้าเป็น Number
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortAsc ? valA - valB : valB - valA;
      }

      // ✅ ถ้าเป็น String
      return this.sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  getStatusClass(Status: string, Remark?: any): string {
    const s = Status?.toLowerCase().trim();
    const r = Remark != null ? String(Remark).trim().toLowerCase() : '';
    if (s === 'complete' && r !== '' && r !== 'null' && r !== 'undefined') return 'bg-completeremark';
    if (s === 'complete') return 'bg-complete';
    if (s === 'waiting') return 'bg-waiting';
    if (s === 'completetoexcel') return 'bg-complete';
    return '';
  }

  // เปิด modal และเซ็ตแถวที่เลือก
  openPrintModal(item: any) {
    this.selectedItem = item;
    this.Total_ = item.Req_QTY;
    this.Type_ = null;
    this.previewUrl = null; // reset preview
  }

  // เมื่อเปลี่ยน Type ให้โหลด PDF preview
  onTypeChange() {
    if (!this.selectedItem || !this.Type_) {
      this.previewUrl = null;
      return;
    }

    const path = this.selectedItem[this.Type_]?.replace(/^"|"$/g, '');
    if (!path) {
      alert('File not Found');
      this.previewUrl = null;
      return;
    }

    this.FileReadService.loadPdfFromPath(path).subscribe({
      next: res => {
        const base64 = res.imageData.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob) + '#toolbar=0&navpanes=0&scrollbar=0';
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      },
      error: err => {
        console.error('Error loading PDF:', err);
        alert('ไม่สามารถโหลด PDF ได้');
        this.previewUrl = null;
      }
    });
  }

  closeModal() {
    this.selectedItem = null;
    this.Type_ = null;
    this.Total_ = null;
    this.previewUrl = null;

    // ซ่อน modal
    const modalElement = document.getElementById('Insert');
    if (modalElement) modalElement.classList.remove('show');

    // ลบ backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();

    // ลบ class modal-open
    document.body.classList.remove('modal-open');
  }

  printPdf() {
    if (!this.selectedItem || !this.Type_) {
      alert('Please select Type ');
      return;
    }

    const qty = Number(this.Total_);
    if (!qty || qty <= 0) {
      alert('Please enter the quantity to print');
      return;
    }

    const path = this.selectedItem[this.Type_]?.replace(/^"|"$/g, '');
    if (!path) {
      alert('File not Found');
      return;
    }
    //   Swal.fire({
    //   title: 'Print Confirmation',
    //   text: `Do you want to print ${qty} ?`,
    //   icon: 'warning',
    //   showCancelButton: true,
    //   confirmButtonText: 'Confirm',
    //   cancelButtonText: 'Cancel'
    // }).then((result) => {
    //   if (result.isConfirmed) {
    //     // ดำเนินการพิมพ์ PDF ตามโค้ดเดิม
    //   }
    // });

    this.FileReadService.loadPdfFromPath(path).subscribe({
      next: res => {
        const base64 = res.imageData.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        // ดึง Employee จาก session
        let Employee_ID = 'Unknow';
        if (isPlatformBrowser(this.platformId)) {
          const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
          Employee_ID = currentUser.Employee_ID || 'Unknow';
        }
        // console.log("👉 Employee_ID ที่จะส่งไป:", Employee_ID);
        // บันทึกประวัติการปริ้น
        this.HistoryPrint.SaveHistoryPrint({
          EmployeeID: Employee_ID,
          Division: this.selectedItem.Division,
          DocNo: this.selectedItem.DocNo,
          PratNo: this.selectedItem.PartNo,
          DueDate: this.selectedItem.DueDate,
          TypePrint: this.Type_,
          Total: this.Total_
        }).subscribe({
          next: () => {
            // console.log("บันทึกประวัติการปริ้นเรียบร้อย");

            //  อัปเดตจำนวนพิมพ์เรียลไทม์หลังบันทึก
            this.HistoryPrint.get_Total().subscribe({
              next: (counts: any[]) => {
                this.filteredRequests.forEach(item => {
                  const layout = counts
                    .filter(c => c.TypePrint === 'PathLayout')
                    .filter(c => c.DocNo.trim() === item.DocNo.trim() && c.PratNo.trim() === item.PartNo.trim());
                  const dwg = counts
                    .filter(c => c.TypePrint === 'PathDwg')
                    .filter(c => c.DocNo.trim() === item.DocNo.trim() && c.PratNo.trim() === item.PartNo.trim());

                  item.PrintLayoutCount = layout.reduce((sum, c) => sum + Number(c.Total), 0);
                  item.PrintDwgCount = dwg.reduce((sum, c) => sum + Number(c.Total), 0);
                });
              },
              error: err => console.error("Error fetching updated print counts:", err)
            });

            // ปิด modal
            //  ปิด modal
            const modalEl = document.getElementById('Insert');
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.hide();

            // สร้าง iframe ซ่อนสำหรับปริ้น
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = blobUrl;
            document.body.appendChild(iframe);

            iframe.onload = () => {
              for (let i = 0; i < qty; i++) {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
              }
              // ไม่ลบ iframe เพื่อให้ dialog print อยู่จนผู้ใช้ปิดเอง
            };
          },
          error: err => console.error("บันทึก log ไม่สำเร็จ:", err)
        });
      },
      error: err => {
        console.error('Error print PDF:', err);
        alert('ไม่สามารถโหลด PDF เพื่อพิมพ์ได้');
      }
    });
  }
  get_Total() {
    // ดึงตารางหลัก
    this.userhistory.User_History().subscribe({
      next: (response: any[]) => {
        this.requests = [...response];
        this.filteredRequests = [...this.requests];

        // ดึงจำนวนพิมพ์จาก service
        this.HistoryPrint.get_Total().subscribe({
          next: (counts: any[]) => {
            this.filteredRequests.forEach(item => {
              // รวม Layout ทั้งหมดของ DocNo+PartNoF
              const layoutTotal = counts
                .filter(c =>
                  String(c.DocNo).trim() === String(item.DocNo).trim() &&
                  String(c.PratNo).trim() === String(item.PartNo).trim() &&
                  c.TypePrint === 'PathLayout'
                )
                .reduce((sum, c) => sum + Number(c.Total), 0);

              // รวม Dwg ทั้งหมดของ DocNo+PartNo
              const dwgTotal = counts
                .filter(c =>
                  String(c.DocNo).trim() === String(item.DocNo).trim() &&
                  String(c.PratNo).trim() === String(item.PartNo).trim() &&
                  c.TypePrint === 'PathDwg'
                )
                .reduce((sum, c) => sum + Number(c.Total), 0);

              // กำหนดค่าให้แถว
              item.PrintLayoutCount = layoutTotal;
              item.PrintDwgCount = dwgTotal;
            });
          },
          error: e => console.error("Error fetching print counts:", e)
        });
      },
      error: e => console.error("Error fetching history:", e)
    });
  }

  fileName = "ExcelSheet.xlsx";

  exportexcel() {
    // ดึงตาราง
    // ดึงตาราง
    let data: HTMLTableElement = document.getElementById("table-data") as HTMLTableElement;

    // clone ตารางเพื่อแก้ไขโดยไม่กระทบหน้า HTML
    let clone = data.cloneNode(true) as HTMLTableElement;

    // ลบคอลัมน์ print (สมมติเป็นคอลัมน์สุดท้าย)
    Array.from(clone.rows).forEach(row => {
      row.deleteCell(-1); // -1 คือ cell สุดท้าย
    });

    // สร้าง worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(clone);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, this.fileName);
  }
  // แยกกลุ่มตาม DocNo
  groupedByDocNo() {
    const groups: any = [];
    const map = new Map();
    this.filteredRequests.forEach(item => {
      if (!map.has(item.DocNo)) {
        map.set(item.DocNo, []);
      }
      map.get(item.DocNo).push(item);
    });
    map.forEach((items, docNo) => {
      groups.push({ docNo, items });
    });
    return groups;
  }

  // รวม QTY ต่อ DocNo
  getTotalQTY(items: any[]): number {
    return items.reduce((sum, item) => sum + (item.Req_QTY || 0), 0);
  }
  // รวม QTY ของ DocNo ของ selectedItem
  getTotalQTYForSelectedDoc(): number {
    if (!this.selectedItem) return 0;
    const docNo = this.selectedItem.DocNo;
    return this.filteredRequests
      .filter(item => item.DocNo === docNo)
      .reduce((sum, item) => sum + (item.Req_QTY || 0), 0);
  }

  clearFilters() {
    this.selectedPartNo = null;
    this.Status_ = null;
    this.fromDate = '';
    this.toDate = '';
    this.selectedDocNo = null;
    this.selectedDivision = null;
    this.selectedRequester = null;
    // รีเซ็ตข้อมูลกลับมาเป็นทั้งหมด
    this.filteredRequests = [...this.requests];
    this.onFilter();
  }

}