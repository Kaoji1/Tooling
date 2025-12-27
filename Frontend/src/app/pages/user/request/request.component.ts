import { Component,OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RequestService,  } from '../../../core/services/request.service';
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
export class requestComponent {

  Tooling_: string = 'Cutting tool'; // ค่าเริ่มต้น
  ToolingList = [
    { label: 'Cutting tool', value: 'Cutting tool' },
    { label: 'Setup tool', value: 'Setup tool' }
  ];
  onToolingChange() {
    this.items = []; // ✅ สั่งล้างข้อมูลในตารางทันทีที่เปลี่ยนโหมด
    
    // แถม: ถ้าต้องการให้ล้าง PartNo หรือ Process ที่เลือกค้างไว้ด้วย (เพราะคนละโหมดกัน)
    // ให้เรียก this.ClearFilters() หรือเคลียร์ค่าตัวแปรตรงนี้เพิ่มได้ครับ เช่น:
    // this.PartNo_ = null;
    // this.Process_ = null;
    // this.MCNo_ = '';
  }
  // Dropdown data
  Div_: any ;
  Fac_: any;
  Case_: any = null;
  PartNo_: any = null;
  Process_: any = null;
  MachineType_: any = null;
  caseother: any = null;
  Spec_:any=null;
  setupItem = [];
  otherItem = [];
  PathDwg_:any;

  // option dropdown
  spec:any=[];
  Division:any=[];
  Fac:any=[];
  Case:any=[];
  PartNo:any=[];
  Process:any=[];
  MachineType:any=[];
  Caseother:any=[];

  // Form fields
  phone_: string = '';
  DueDate_: string = '';
  today_: string = '';
  InputDate_:string='';
  MCNo_:string='';

  // Table data
  items: any= [];// array เก่าวแปรสำหรับเก็บรายการข้อมูล (items) ที่มีอยู่แล้ว
  item: any; //array ใหม่  ตัวแปรสำหรับเก็บข้อมูล item ใหม่
  selectedType: string = '';
  isSearched: boolean = false;

  constructor( //โหลดทันทีที่รันที่จำเป็นต้องใช้ตอนเริ่มเว็ป
    private cartService: CartService,
    private api: RequestService
  ) {
    // Set today's date for min date validation
    this.today_ = new Date().toISOString().split('T')[0];

    // กำหนดตัวเลือกในdropdown
    this.Case = [
      { label: 'SET', value: 'SET' }, // ตัวเลือก Division ที่ 1
      { label: 'USA', value: 'USA' }, // ตัวเลือกเคสที่ 1
      { label: 'BRO', value: 'BRO' }, // ตัวเลือกเคสที่ 2
      { label: 'BUR', value: 'BUR' }, // ตัวเลือกเคสที่ 3
      { label: 'CHA', value: 'CHA' }, // ตัวเลือกเคสที่ 4
      { label: 'F/A', value: 'F/A' }, // ตัวเลือกเคสที่ 5
      { label: 'HOL', value: 'HOL' }, // ตัวเลือกเคสที่ 6
      { label: 'JIG', value: 'JIG' }, // ตัวเลือกเคสที่ 7
      { label: 'MOD', value: 'MOD' }, // ตัวเลือกเคสที่ 8
      { label: 'N/G', value: 'N/G' }, // ตัวเลือกเคสที่ 9
      { label: 'P/P', value: 'P/P' }, // ตัวเลือกเคสที่ 10
      { label: 'REC', value: 'REC' }, // ตัวเลือกเคสที่ 11
      { label: 'INV', value: 'INV' }, // ตัวเลือกเคสที่ 12
      { label: 'SPA', value: 'SPA' }, // ตัวเลือกเคสที่ 13

    ];

   
  }
  async ngOnInit()  {
    this.Get_Division();
  }

selectAllChecked: boolean = true;

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
      this.Division =  [
        { Division: '7122', DivisionName: 'GM' },
        { Division: '71DZ', DivisionName: 'PMC' }
      ];
      // console.log(this.Division);
    },
    error: (e: any) => console.error(e),
  });
}
// เรียกใช้ตัวดึงapi
async get_PartNo(event: any) {
  const division = event.Division ?? event;
  if (division) {
    this.api.get_PartNo({ Division: division }).subscribe({
      next: (response: any[]) => {
        // กรอง PartNo ไม่ให้ซ้ำ
        this.PartNo = response.filter((item, index, self) =>
          index === self.findIndex(obj => obj.PartNo === item.PartNo)
        );
        // console.log(this.PartNo);
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
  async get_Process(event:any) {
    // console.log(event); // แสดงค่าที่ได้รับใน console
    // เช็คว่า event.value มีค่าหรือไม่
    if (event.PartNo !== undefined) {
      // เรียก API เพื่อส่งข้อมูลไปยัง SQL
      const data = {
        Division:event.Division,
        PartNo: event.PartNo,

      }
      // console.log(data);
      this.api.get_Process(data).subscribe({
        // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_process
      next: (response: any[]) => {
        // กรอง PartNo ไม่ให้ซ้ำ
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
  async get_MC(event:any) {
     console.log(event); // แสดงค่าที่ได้รับใน console
    // เช็คว่า event.value มีค่าหรือไม่
    if (event.PartNo !== undefined) {
      // เรียก API เพื่อส่งข้อมูลไปยัง SQL
      const data = {
        Division: event.Division,
        PartNo: event.PartNo,

        Spec: event.SPEC,
        Process: event.Process
      }
      // console.log(data);
      this.api.get_MC(data).subscribe({
        // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_machinetype
       next: (response: any[]) => {
        console.log('MC',response)
        // กรอง PartNo ไม่ให้ซ้ำ
       this.MachineType = response.filter((item, index, self) =>
        index === self.findIndex(obj => 
        //Change from obj.MachineType === item.MachineType by TJ080 28/10/2025
          obj.MC === item.MC 
       && obj.Process === item.Process
  )
);
        console.log('list',this.MachineType);
      },
      error: (e) => console.error(e),
    });
    }
  }


loading: boolean = false;  // เก็บสถานะกำลังโหลด

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

  // ===== ตรวจสอบฟิลด์ (เหมือนเดิม) =====
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
  const data = { Division, PartNo, Process, MC }; // เตรียมข้อมูลส่ง

  // ⭐⭐ แยกทางเดินตรงนี้ครับ ⭐⭐
  if (this.Tooling_ === 'Setup tool') {
    
    // ==================================================
    // 🟢 ทางเดินที่ 1: สำหรับ Setup Tool (Table ใหม่)
    // ==================================================
    console.log('Fetching Setup Tool Data...', data);

    // ⚠️ ต้องสร้าง service ใหม่ชื่อ get_SetupItems ใน request.service.ts ก่อนนะครับ
    // หรือถ้ามีแล้วให้เปลี่ยนชื่อตรงนี้ให้ตรงกับของจริง
    this.api.get_SetupItems(data).subscribe({ 
      next: (response: any[]) => {
        
        // Setup Tool อาจจะไม่ซับซ้อนเรื่อง Fresh/Reuse เหมือน Cutting
        // รับมาแล้วโชว์เลย
        this.items = response.map(item => ({
          ...item,
          checked: true, // ติ๊กถูกให้อัตโนมัติ
          QTY: item.QTY ?? 1 // ถ้าไม่มี QTY ส่งมา ให้ default เป็น 1
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

    // ==================================================
    // 🔵 ทางเดินที่ 2: สำหรับ Cutting Tool (Table เดิม Logic เดิม)
    // ==================================================
    console.log('Fetching Cutting Tool Data...', data);

    this.api.post_ItemNo(data).subscribe({
      next: (response: any[]) => {
        const itemMap = new Map<string, any>();

        response.forEach(item => {
          // Key สำหรับรวมยอด (สังเกตว่าใช้ SPEC, ItemNo)
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

          // Logic เดิม: รวมยอด Fresh/Reuse ตาม Facility
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

  // แปลง Fac_ → เอาเลขหลัง F. ตัวแรกอย่างปลอดภัย
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
      Factory: Factory, // ใช้เลขหลัง F.
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
  this.phone_='';
  this.MCNo_='';

  // Delete items ค่าที่รวมที่จะส่งไปตะกร้า
  this.items = [];
  this.PathDwg_ = null;

  // 👇 เพิ่มบรรทัดนี้เพื่อให้หยุดหมุนถ้ายัง loading อยู่
  this.loading = false;
}
  // upload file
  selectedFileName: string = '';
  onFileChosen(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      // console.log('Selected file:', file.name);
    }
  }
  onPartNoChange(){
    this.Process_=null;
    this.MachineType_=null;
  }
  getRowClass(item: any): string {
  if (item.checked) {
    return 'row-selected'; // ถ้าติ๊ก checkbox
  }
  return ''; // ปกติ
}
}

function makeKey(x: any) {
  throw new Error('Function not implemented.');
}

