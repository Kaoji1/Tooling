import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RequestService } from '../../../core/services/request.service';
import { CartService } from '../../../core/services/cart.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-request',
  standalone: true,
  imports: [
    SidebarComponent,
    RouterOutlet,
    CommonModule,
    FormsModule,
    NgSelectModule,
    NotificationComponent,
  ],
  templateUrl: './request.component.html',
  styleUrl: './request.component.scss'
})
export class requestComponent implements OnInit {

  Tooling_: string = 'Cutting tool'; // ค่าเริ่มต้น
  ToolingList = [
    { label: 'Cutting tool', value: 'Cutting tool' },
    { label: 'Setup tool', value: 'Setup tool' }
  ];

  // เพิ่มตัวแปรเก็บข้อมูล Setup Tool ที่เกี่ยวข้อง
  relatedSetupItems: any[] = [];

  onToolingChange() {
    this.items = []; // สั่งล้างข้อมูลในตารางทันทีที่เปลี่ยนโหมด
    this.relatedSetupItems = []; // ล้างข้อมูลตารางล่างด้วย
  }

  // Dropdown data
  Div_: any;
  Fac_: any;
  Case_: any = null;
  PartNo_: any = null;
  Process_: any = null;
  MachineType_: any = null;
  caseother: any = null;
  Spec_: any = null;
  setupItem = [];
  otherItem = [];
  PathDwg_: any;

  // option dropdown
  spec: any = [];
  Division: any = [];
  Fac: any = [];
  Case: any = [];
  PartNo: any = [];
  Process: any = [];
  MachineType: any = [];
  Caseother: any = [];

  // Form fields
  phone_: string = '';
  DueDate_: string = '';
  today_: string = '';
  InputDate_: string = '';
  MCNo_: string = '';

  // Table data
  items: any = []; // array เก่าวแปรสำหรับเก็บรายการข้อมูล (items) ที่มีอยู่แล้ว
  item: any; // array ใหม่ ตัวแปรสำหรับเก็บข้อมูล item ใหม่
  selectedType: string = '';
  isSearched: boolean = false;
  selectAllChecked: boolean = true;
  loading: boolean = false; // เก็บสถานะกำลังโหลด
  selectedFileName: string = '';

  constructor(
    private cartService: CartService,
    private api: RequestService
  ) {
    // Set today's date for min date validation
    this.today_ = new Date().toISOString().split('T')[0];

    // กำหนดตัวเลือกในdropdown
    this.Case = [
      { label: 'SET', value: 'SET' },
      { label: 'USA', value: 'USA' },
      { label: 'BRO', value: 'BRO' },
      { label: 'BUR', value: 'BUR' },
      { label: 'CHA', value: 'CHA' },
      { label: 'F/A', value: 'F/A' },
      { label: 'HOL', value: 'HOL' },
      { label: 'JIG', value: 'JIG' },
      { label: 'MOD', value: 'MOD' },
      { label: 'N/G', value: 'N/G' },
      { label: 'P/P', value: 'P/P' },
      { label: 'REC', value: 'REC' },
      { label: 'INV', value: 'INV' },
      { label: 'SPA', value: 'SPA' },
    ];
  }

  async ngOnInit() {
    this.Get_Division();
  }

  toggleAllCheckboxes() {
    for (const item of this.items) {
      item.checked = this.selectAllChecked;
    }
  }

  // เรียกใช้ตัวดึงapi
  Get_Division() {
    this.api.get_Division().subscribe({
      next: (response: any[]) => {
        // แปลงและกรองให้เหลือแค่ GM กับ PMC
        this.Division = [
          { Division: '7122', DivisionName: 'GM' },
          { Division: '71DZ', DivisionName: 'PMC' }
        ];
      },
      error: (e: any) => console.error(e),
    });
  }

  // เรียกใช้ตัวดึงapi
  async get_PartNo(event: any) {
    if (!event) return; // ✅ เพิ่มดัก Null กันโปรแกรมพัง

    const division = event.Division ?? event;
    if (division) {
      this.api.get_PartNo({ Division: division }).subscribe({
        next: (response: any[]) => {
          // กรอง PartNo ไม่ให้ซ้ำ
          this.PartNo = response.filter((item, index, self) =>
            index === self.findIndex(obj => obj.PartNo === item.PartNo)
          );
        },
        error: (e) => console.error(e),
      });
    }
  }

  onDivisionChange(value: any) {
    // เรียกหลายฟังก์ชันพร้อมกัน
    this.get_Facility(value);
    this.get_PartNo(value);
  }

  async get_Facility(event: any) {
    if (!event) return; // ✅ เพิ่มดัก Null กันโปรแกรมพัง

    const division = event.Division ?? event;
    if (!division) return;

    this.api.get_Facility({ Division: division }).subscribe({
      next: (response: any[]) => {
        // กรองค่า FacilityName ที่ไม่ว่างและไม่ซ้ำ
        const map = new Map<string, any>();
        response.forEach(item => {
          if (item.FacilityName) {
            const facName = String(item.FacilityName).trim(); // ทำให้เป็น string ชัวร์
            if (!map.has(facName)) {
              map.set(facName, { FacilityName: facName }); // เก็บเป็น object แบบเดียวกัน
            }
          }
        });

        this.Fac = Array.from(map.values());
        console.log('Fac normalized:', this.Fac);
      },
      error: (e) => console.error('Error get_Facility:', e),
    });
  }

  // Process
  async get_Process(event: any) {
    if (event && event.PartNo !== undefined) {
      const data = {
        Division: event.Division,
        PartNo: event.PartNo,
      }
      this.api.get_Process(data).subscribe({
        next: (response: any[]) => {
          this.Process = response.filter((item, index, self) =>
            index === self.findIndex(obj => obj.Process === item.Process)
          );
          console.log(this.Process);
        },
        error: (e) => console.error(e),
      });
    }
  }

  // MAchineType
  async get_MC(event: any) {
    if (event && event.PartNo !== undefined) {
      const data = {
        Division: event.Division,
        PartNo: event.PartNo,
        Spec: event.SPEC,
        Process: event.Process
      }
      this.api.get_MC(data).subscribe({
        next: (response: any[]) => {
          console.log('MC', response)
          this.MachineType = response.filter((item, index, self) =>
            index === self.findIndex(obj =>
              obj.MC === item.MC && obj.Process === item.Process
            )
          );
          console.log('list', this.MachineType);
        },
        error: (e) => console.error(e),
      });
    }
  }

  Setview() {
    const Division = this.Div_?.Division || this.Div_;
    const FacilityName = this.Fac_
      ? (typeof this.Fac_ === 'string' ? this.Fac_ : this.Fac_.FacilityName)
      : '';
    const PartNo = this.PartNo_?.PartNo || this.PartNo_;
    const Process = this.Process_?.Process || this.Process_;
    const MC = this.MachineType_?.MC || this.MachineType_;
    const DueDate_ = this.DueDate_;
    const Case_ = this.Case_;

    // ===== ตรวจสอบฟิลด์ =====
    const missingFields: string[] = [];
    if (!Division) missingFields.push("Division");
    if (!FacilityName) missingFields.push("FacilityName");
    if (!PartNo) missingFields.push("PartNo");
    if (!Process) missingFields.push("Process");
    if (!MC) missingFields.push("Machine Type");
    if (!DueDate_) missingFields.push("DueDate");
    if (!Case_) missingFields.push("Case");

    if (missingFields.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Data',
        html: 'Missing fields:<br><ul style="text-align:left;">' +
          missingFields.map(f => `<li>${f}</li>`).join('') + '</ul>',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    this.loading = true;
    const data = { Division, PartNo, Process, MC };

    // ⭐⭐ แยกทางเดิน ⭐⭐
    if (this.Tooling_ === 'Setup tool') {
      // Setup Tool Mode
      this.relatedSetupItems = []; // เคลียร์ตารางล่างทิ้งถ้าเป็นโหมดนี้

      console.log('Fetching Setup Tool Data...', data);
      this.api.get_SetupItems(data).subscribe({
        next: (response: any[]) => {
          this.items = response.map(item => ({
            ...item,
            checked: true,
            QTY: item.QTY ?? 1
          }));
          this.loading = false;
        },
        error: (e) => {
          console.error('API Setup Tool Error:', e);
          this.loading = false;
          Swal.fire('Error', 'ไม่สามารถดึงข้อมูล Setup Tool ได้', 'error');
        }
      });

    } else {
      // Cutting Tool Mode
      console.log('Fetching Cutting Tool Data...', data);
      
      // ✅✅ Logic ส่วนที่เพิ่มมาสำหรับ Related Setup Tools (Mock Data) ✅✅
      if (this.Case_ === 'SET') {
        // ใส่ Mock Data หรือเรียก API จริงตรงนี้
        this.relatedSetupItems = [
          { ItemName: 'Holder BT40', SPEC: 'CAT40-ER32', QTY: 1 },
          { ItemName: 'Collet', SPEC: 'ER32-6mm', QTY: 2 },
          { ItemName: 'Pull Stud', SPEC: 'PS-BT40', QTY: 1 }
        ];
      } else {
        this.relatedSetupItems = []; // ถ้าไม่ใช่เคส SET ไม่ต้องโชว์
      }

      this.api.post_ItemNo(data).subscribe({
        next: (response: any[]) => {
          const itemMap = new Map<string, any>();

          response.forEach(item => {
            const key = `${item.PartNo}|${item.Process}|${item.MC}|${item.SPEC}|${item.ItemNo}`;

            if (!itemMap.has(key)) {
              itemMap.set(key, {
                ...item,
                FreshQty: 0,
                ReuseQty: 0,
                checked: true,
                qty: null
              });
            }

            if (item.FacilityName === FacilityName) {
              const existing = itemMap.get(key);
              const existingSum = (existing.FreshQty ?? 0) + (existing.ReuseQty ?? 0);
              const currentSum = (item.FreshQty ?? 0) + (item.ReuseQty ?? 0);

              if (currentSum > existingSum) {
                itemMap.set(key, {
                  ...existing,
                  FreshQty: item.FreshQty ?? 0,
                  ReuseQty: item.ReuseQty ?? 0
                });
              }
            }
          });

          this.items = Array.from(itemMap.values()).map(item => ({
            ...item,
            QTY: item.QTY ?? 1
          }));
          this.loading = false;
        },
        error: (e) => {
          console.error('API Cutting Tool Error:', e);
          this.loading = false;
        }
      });
    }
  }

  // function add to cart
  AddToCart() {
    const checkedItems = this.items.filter((item: any) => item.checked);
    const filteredItems = checkedItems.filter((item: any) => item.QTY);

    if (filteredItems.length < checkedItems.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Data',
        text: 'Please fill in all required fields for the selected item',
        confirmButtonText: 'OK'
      });
      return;
    }

    const InputDate_ = new Date().toISOString().split('T')[0];

    // ดึงชื่อพนักงานจาก session
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const employeeName = currentUser.Employee_Name || 'Unknown';
    const Employee_ID = currentUser.Employee_ID || 'Unknown';

    // แปลง Fac_
    let rawFac = '';
    if (this.Fac_) {
      if (typeof this.Fac_ === 'string') rawFac = this.Fac_;
      else if (this.Fac_.FacilityName) rawFac = this.Fac_.FacilityName;
    }
    const FactoryNumberMatch = rawFac.match(/F\.(\d+)/);
    const Factory = FactoryNumberMatch ? FactoryNumberMatch[1] : rawFac;

    const groupedByCase = filteredItems.reduce((acc: any, item: any) => {
      const caseKey = item.Case_ || this.Case_;
      if (!acc[caseKey]) acc[caseKey] = [];

      acc[caseKey].push({
        Doc_no: null,
        Division: this.Div_?.Division || this.Div_,
        Factory: Factory,
        ItemNo: item.ItemNo,
        PartNo: item.PartNo,
        Process: item.Process,
        Case_: caseKey,
        MC: item.MC,
        SPEC: item.SPEC,
        Usage_pcs: item.Usage_pcs,
        QTY: item.QTY,
        InputDate_: InputDate_,
        DueDate_: this.DueDate_,
        ReuseQty: item.ReuseQty,
        FreshQty: item.FreshQty,
        Status: null,
        Set_by: null,
        Local: 0,
        MCNo_: this.MCNo_,
        PathDwg_: this.PathDwg_,
        ON_HAND: item.ON_HAND,
        Employee_Name: employeeName,
        PhoneNo: this.phone_,
        Employee_ID: Employee_ID
      });

      return acc;
    }, {});

    if (Object.keys(groupedByCase).length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Item',
        text: 'No item selected to add to cart',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const allItemsToSend = Object.values(groupedByCase).flat();

    this.cartService.addCartToDB(allItemsToSend).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Items have been successfully added to the cart',
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save data to the database',
          confirmButtonText: 'Retry'
        });
      }
    });

    this.Clearall();
  }

  // function clearall
  Clearall() {
    // Delete select group
    this.Div_ = null;
    this.Fac_ = null;
    this.DueDate_ = '';
    this.Case_ = null;
    this.PartNo_ = null;
    this.Spec_ = null;
    this.MachineType_ = null;
    this.Process_ = null;
    this.phone_ = '';
    this.MCNo_ = '';

    // Delete items
    this.items = [];
    this.relatedSetupItems = []; // ✅ เคลียร์ตารางล่างด้วย
    this.PathDwg_ = null;
    this.loading = false;
  }

  // upload file
  onFileChosen(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
    }
  }

  onPartNoChange() {
    this.Process_ = null;
    this.MachineType_ = null;
  }

  getRowClass(item: any): string {
    if (item.checked) {
      return 'row-selected';
    }
    return '';
  }
}