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
  MCQTY_:string='';

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

    ];

    this.Fac = [
      {label: '1',value: '1'},
      {label: '2',value: '2'},
      {label: '3',value: '3'},
      {label: '4',value: '4'},
      {label: '5',value: '5'},
      {label: '6',value: '6'},
      {label: '7',value: '7'},
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
      console.log(this.Division);
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
        console.log(this.PartNo);
      },
      error: (e) => console.error(e),
    });
  }
}
  // Process
  async get_Process(event:any) {
    console.log(event); // แสดงค่าที่ได้รับใน console
    // เช็คว่า event.value มีค่าหรือไม่
    if (event.PartNo !== undefined) {
      // เรียก API เพื่อส่งข้อมูลไปยัง SQL
      const data = {
        Division:event.Division,
        PartNo: event.PartNo,

      }
      console.log(data);
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
        Division:event.Division,
        PartNo: event.PartNo,

        Spec: event.SPEC,
        Process: event.Process
      }
      console.log(data);
      this.api.get_MC(data).subscribe({
        // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_machinetype
       next: (response: any[]) => {
        // กรอง PartNo ไม่ให้ซ้ำ
        this.MachineType = response.filter((item, index, self) =>
          index === self.findIndex(obj => obj.MachineType === item.MachineType)
        );
        console.log(this.MachineType);
      },
      error: (e) => console.error(e),
    });
    }
  }


loading: boolean = false;  // เก็บสถานะกำลังโหลด

Setview() {
  const Division = this.Div_?.Division || this.Div_;
  const Fac = this.Fac_;
  const PartNo = this.PartNo_?.PartNo || this.PartNo_;
  const Process = this.Process_?.Process || this.Process_;
  const MC = this.MachineType_?.MC || this.MachineType_;
  const DueDate_ = this.DueDate_;
  const Case_ = this.Case_;

  // ตรวจสอบฟิลด์ที่หาย
  const missingFields: string[] = [];
  if (!Division) missingFields.push("Division");
  if (!Fac) missingFields.push("Fac");
  if (!PartNo) missingFields.push("PartNo");
  if (!Process) missingFields.push("Process");
  if (!MC) missingFields.push("Machine Type");
  if (!DueDate_) missingFields.push("DueDate");
  if (!Case_) missingFields.push("Case");

  if (missingFields.length > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Incomplete Data',
      html:
        'Missing fields:<br><ul style="text-align:left;">' +
        missingFields.map(field => `<li>${field}</li>`).join('') +
        '</ul>',
      confirmButtonText: 'ตกลง'
    });
    return;
  }

  // set state กำลังโหลด
  this.loading = true;

  const data = { Division, PartNo, Process, MC };

  this.api.post_ItemNo(data).subscribe({
    next: (response) => {
      this.items = response.map((item: any) => ({
        ...item,
        checked: true,
        qty: null
      }));

      console.log('ข้อมูลที่โหลด:', this.items);
      this.loading = false; // โหลดเสร็จ
    },
    error: (e) => {
      console.error('API Error:', e);
      this.loading = false; // โหลดเสร็จแต่ error
    }
  });

  console.log('division:', Division);
  console.log('factory:', Fac);
  console.log('PartNo:', PartNo);
  // console.log('Spec:', Spec);
  console.log('Process:', Process);
  console.log('MC:', MC);
  console.log('DueDate_',DueDate_);

  if (PartNo && Fac && Process && MC && Division && DueDate_  !== undefined) {
    const data = { Division, PartNo, Process, MC };

    this.api.post_ItemNo(data).subscribe({
      next: (response) => {
        //  กรณี selectedType คือ 'setup'
        if (this.Case_ === 'SET') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,
          }));
        }

        //  กรณี selectedType คือ 'other'
        else if (this.Case_=== 'USA') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
         else if (this.Case_=== 'BRO') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
         else if (this.Case_=== 'BUR') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
         else if (this.Case_=== 'CHA') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
        else if (this.Case_=== 'F/A') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
         else if (this.Case_=== 'HOL') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
        else if (this.Case_=== 'INV') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
        else if (this.Case_=== 'RET') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
         else if (this.Case_=== 'JIG') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
         else if (this.Case_=== 'MOD') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
         else if (this.Case_=== 'N/G') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
        else if (this.Case_=== 'P/P') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
          else if (this.Case_=== 'REC') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
          else if (this.Case_=== 'INV') {
          this.items = response.map((item: any) => ({
            ...item,
            checked: true,
            qty: null,

          }));
        }
        console.log('ข้อมูลที่โหลด:', this.items);
      },
      error: (e) => console.error('API Error:', e),
    });
  } else {
    console.warn('กรุณาเลือกข้อมูลให้ครบก่อน');
   
  }
}

// function add to cart
// function add to cart
AddToCart() {
  const checkedItems = this.items.filter((item: any) => item.checked);
  const filteredItems = checkedItems.filter((item: any) => item.QTY);

  if (filteredItems.length < checkedItems.length) {
    Swal.fire({
      icon: 'warning',
      title: 'Incomplete Data',
      text: 'Please fill in all required fields for the selevted item',
      confirmButtonText: 'OK'
    });
    return;
  }

  const InputDate_ = new Date().toISOString().split('T')[0];

  //  ดึงชื่อพนักงานจาก session
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const employeeName = currentUser.Employee_Name || 'Unknown';

  const groupedByCase = filteredItems.reduce((acc: any, item: any) => {
    const caseKey = item.Case_ || this.Case_;
    if (!acc[caseKey]) acc[caseKey] = [];

    acc[caseKey].push({
      Doc_no: null,
      Division: this.Div_?.Division || this.Div_,
      Factory: this.Fac_?.Fac || this.Fac_,
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
      MCQTY_: this.MCQTY_,
      PathDwg_: this.PathDwg_,
      ON_HAND : item.ON_HAND,
      Employee_Name: employeeName, //  เพิ่มตรงนี้
      PhoneNo:this.phone_
    });
    return acc;
  }, {});

  if (Object.keys(groupedByCase).length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No Item',
      text: 'No item selected add to cart',
      confirmButtonText: 'ตกลง'
    });
    return;
  }

  const allItemsToSend = Object.values(groupedByCase).flat();
  console.log(' รายการทั้งหมดที่จะส่งไปฐานข้อมูล:', allItemsToSend);

  this.cartService.addCartToDB(allItemsToSend).subscribe({
    next: () => {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Items have been successfully added to the cart',
        showConfirmButton: false,
        timer:1500
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
      console.log('Selected file:', file.name);
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

