import { Component,OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RequestService,  } from '../../../core/services/request.service';
import { CartService } from '../../../core/services/cart.service';


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




Setview() {
  const Division = this.Div_?.Division || this.Div_;
  const Fac = this.Fac_;
  const PartNo = this.PartNo_?.PartNo || this.PartNo_;
  const Spec = this.Spec_?.SPEC|| this.Spec_;
  const Process = this.Process_?.Process || this.Process_;
  const MC = this.MachineType_?.MC || this.MachineType_;
  const DueDate_ = this.DueDate_;
// แจ้งเตือนกรอกไม่ครบ
  const missingFields:string[] = [];
  if (!Division) missingFields.push("Division");
  if (!Fac) missingFields.push("Fac");
  if (!PartNo) missingFields.push("PartNo");
  if (!Process) missingFields.push("Process");
  if (!MC) missingFields.push("MC");
  if (!DueDate_) missingFields.push("DueDate");

  if (missingFields.length>0){
    alert("กรุณากรอกข้อมูลต่อไปนี้ให้ครบ:\n" + missingFields.join("\n"));
    return;
  }
  console.log('division:', Division);
  console.log('factory:', Fac);
  console.log('PartNo:', PartNo);
  console.log('Spec:', Spec);
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
        console.log('ข้อมูลที่โหลด:', this.items);
      },
      error: (e) => console.error('API Error:', e),
    });
  } else {
    console.warn('กรุณาเลือกข้อมูลให้ครบก่อน');
    alert("กรุณาเลือกข้อมูลให้ครบทุกช่องก่อนค้นหา");
  }
}

// function add to cart
AddToCart() {
  const checkedItems = this.items.filter((item: any) => item.checked);
  const filteredItems = checkedItems.filter((item: any) => item.QTY);

  if (filteredItems.length < checkedItems.length) {
    alert('กรุณากรอกข้อมูลให้ครบในรายการที่เลือก');
    return;
  }
  // ตั้งค่าการส่งเป็นวันนี้
  const InputDate_ = new Date().toISOString().split('T')[0];

  //  จัดกลุ่มรายการตาม Case_ เก็บค่าที่เลือกไว้ก่อนส่งไปหน้าตะกร้า
  const groupedByCase = filteredItems.reduce((acc: any, item: any) => {
    const caseKey = item.Case_ || this.Case_;
    if (!acc[caseKey]) acc[caseKey] = [];

    acc[caseKey].push({
      Doc_no: null,
      Division: this.Div_?.Division || this.Div_,
      Factory: this.Fac_?.Fac || this.Fac_,
      ITEM_NO: item.ITEM_NO,
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
      MCQTY_:this.MCQTY_,
    });
    return acc;
  }, {});

  //  ตรวจสอบว่ามีรายการหรือไม่
  if (Object.keys(groupedByCase).length === 0) {
    alert('ไม่มีรายการที่เลือกไว้สำหรับเพิ่มลงตะกร้า');
    return;
  }
  //  แปลงจาก grouped object เป็น array ธรรมดาเพื่อส่งไป backend
  const allItemsToSend = Object.values(groupedByCase).flat();
  //  เรียก Service เพื่อส่งข้อมูลไปเก็บ MSSQL
  this.cartService.addCartToDB(allItemsToSend).subscribe({
    next: () => alert(' เพิ่มรายการลงตะกร้าและบันทึกลงฐานข้อมูลเรียบร้อย'),
    error: () => alert(' บันทึกลงฐานข้อมูลล้มเหลว'),
  });

  //  ล้างค่าหลังจากเพิ่มสำเร็จ
  this.Clearall();
}
// function clearall
Clearall() {
  // Delete select group
  this.Div_=null;
  this.Fac_=null;
  this.DueDate_='';
  this.Case_=null;
  this.PartNo_=null;
  this.Spec_=null
  this.MachineType_=null;
  this.Process_=null
  // Delete items ค่าที่รวมที่จะส่งไปตะกร้า
  this.items=[];
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
}




//   get_PartNo() {
  //   // เรียก API เพื่อดึงข้อมูล SPEC
  //   this.api.get_PartNo().subscribe({
  //     // ถ้าสำเร็จ จะทำการเก็บ response ลงใน spec
  //     next: (response: any) => {
  //       this.PartNo = response;
  //       // แสดงผลลัพธ์ใน console
  //       // console.log(this.PartNo);
  //     },
  //     // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
  //     error: (e: any) => console.error(e),
  //   });
  // }
// async get_SPEC(event:any) {
//     console.log(event); // แสดงค่าที่ได้รับใน console
//     // เช็คว่า event.value มีค่าหรือไม่
//     if (event.PartNo !== undefined) {
//       // เรียก API เพื่อส่งข้อมูลไปยัง SQL
//       const data = {
//         Division:event.Division,
//         PartNo: event.PartNo

//       }
//       console.log(data);
//       this.api.get_SPEC(data).subscribe({
//         // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_process
//         next: (response) => {
//           if (response.length > 0) {
//             this.spec = response;

//             // แสดงผลลัพธ์ใน console
//             console.log(response);
//           }
//         },
//         // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
//         error: (e) => console.error(e),
//       });
//     }
//   }
  // async get_SPEC(event:any) {
  //   console.log(event); // แสดงค่าที่ได้รับใน console
  //   // เช็คว่า event.value มีค่าหรือไม่
  //   if (event.PartNo !== undefined) {
  //     // เรียก API เพื่อส่งข้อมูลไปยัง SQL
  //     this.api.get_SPEC(event.PartNo).subscribe({
  //       // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน spec
  //       next: (response) => {
  //         if (response.length > 0) {
  //           this.spec= response;
  //           // แสดงผลลัพธ์ใน console
  //           console.log(response);
  //         }
  //       },
  //       // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
  //       error: (e) => console.error(e),
  //     });
  //   }
  // }
// กรณีใช้facจากdatabase
  // async get_Fac(event:any) {
  //   console.log(event); // แสดงค่าที่ได้รับใน console
  //   // เช็คว่า event.value มีค่าหรือไม่
  //   if (event.PartNo !== undefined) {
  //     // เรียก API เพื่อส่งข้อมูลไปยัง SQL
  //     const data = {
  //       Division:event.Division,
  //       PartNo: event.PartNo,

  //     }
  //     console.log(data);
  //     this.api.get_Fac(data).subscribe({
  //       // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_process
  //     next: (response: any[]) => {
  //       // กรอง PartNo ไม่ให้ซ้ำ
  //       this.Fac = response.filter((item, index, self) =>
  //         index === self.findIndex(obj => obj.Fac === item.Fac)
  //       );
  //       console.log(this.Fac);
  //     },
  //     error: (e) => console.error(e),
  //   });
  //   }
  // }
