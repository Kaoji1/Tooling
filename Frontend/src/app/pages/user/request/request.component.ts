import { Component,OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RequestService,  } from '../../../core/services/request.service';
import { CartService, RequestItemGroup } from '../../../core/services/cart.service';


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
  DueDate_: any=[];
  today_: string = '';
  InputDate_:string='';

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
    

    this.Fac = [
      { label: '1', value: '1' }, // ตัวเลือก Fac ที่ 1
      { label: '2', value: '2' }, // ตัวเลือก Fac ที่2
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '7', value: '7' },
    ];

    this.Case = [
      { label: 'SET', value: 'setup' }, // ตัวเลือก Division ที่ 1
     
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

     this.Caseother = [
        { Case: 'BRO', viewCase: 'BRO' }, // ตัวเลือกเคสที่ 1
        { Case: 'BUR', viewCase: 'BUR' }, // ตัวเลือกเคสที่ 2
        { Case: 'USA', viewCase: 'USA' }, // ตัวเลือกเคสที่ 3
        { Case: 'HOL', viewCase: 'HOL' }, // ตัวเลือกเคสที่ 4
        { Case: 'INV', viewCase: 'INV' }, // ตัวเลือกเคสที่ 5
        { Case: 'MOD', viewCase: 'MOD' }, // ตัวเลือกเคสที่ 6
        { Case: 'NON', viewCase: 'NON' }, // ตัวเลือกเคสที่ 7
        { Case: 'RET', viewCase: 'RET' }, // ตัวเลือกเคสที่ 8
        { Case: 'SPA', viewCase: 'SPA' }, // ตัวเลือกเคสที่ 9
        { Case: 'STO', viewCase: 'STO' }, // ตัวเลือกเคสที่ 10
        { Case: 'CHA', viewCase: 'CHA' }, // ตัวเลือกเคสที่ 11
      ];




  }

  async ngOnInit()  {
    this.Get_Division();


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
async get_PARTNO(event: any) {
  const division = event.Division ?? event;
  if (division) {
    this.api.get_PARTNO({ Division: division }).subscribe({
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
  //   Get_PARTNO() {
  //   // เรียก API เพื่อดึงข้อมูล SPEC
  //   this.api.get_PARTNO().subscribe({
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

  // Process
  async get_Process(event:any) {
    console.log(event); // แสดงค่าที่ได้รับใน console
    // เช็คว่า event.value มีค่าหรือไม่
    if (event.PartNo !== undefined) {
      // เรียก API เพื่อส่งข้อมูลไปยัง SQL
      const data = {
        Division:event.Division,
        PartNo: event.PartNo,
        Spec:event.SPEC
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
  const factory = this.Fac_;
  const PartNo = this.PartNo_?.PartNo || this.PartNo_;
  const Spec = this.Spec_?.SPEC|| this.Spec_;
  const Process = this.Process_?.Process || this.Process_;
  const MC = this.MachineType_?.MC || this.MachineType_;
  console.log('division:', Division);
  console.log('factory:', factory);
  console.log('PartNo:', PartNo);
  console.log('Spec:', Spec);
  console.log('Process:', Process);
  console.log('MC:', MC);

  if (PartNo && Process && MC && Division !== undefined) {
    const data = { Division, PartNo, Process, MC };

    this.api.post_ITEMNO(data).subscribe({
      next: (response) => {
        //  กรณี selectedType คือ 'setup'
        if (this.Case_ === 'setup') {
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
  const checkedItems = this.items.filter((item: { checked: any; }) => item.checked);
  const filteredItems = checkedItems.filter((item: { QTY: any; }) => item.QTY);

  if (filteredItems.length < checkedItems.length) {
    alert('กรุณากรอกข้อมูลให้ครบในรายการที่เลือก');
    return;
  }

  const InputDate_ = new Date().toISOString().split('T')[0];

  const itemList = filteredItems.map((item: any) => ({
    Doc_no: null,
    Division: this.Div_,
    Factory: this.Fac_,
    ITEM_NO: item.ITEM_NO,
    PartNo: item.PartNo,
    Process: item.Process,
    Case_: this.Case_,
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
  }));

  //  กลุ่มใหม่
  const group: RequestItemGroup = {
    id: Date.now().toString(), // หรือ UUID ก็ได้
    Division: this.Div_,
    Factory: this.Fac_,
    Case_: this.Case_,
    DueDate_: this.DueDate_,
    items: itemList
  };

  //  ส่งกลุ่มเดียวไปเก็บ
  this.cartService.addGroup(group);
  alert('เพิ่มข้อมูลเป็นกลุ่มลงในตะกร้าแล้ว');
  this.Clearall();
}

// function clearall
Clearall() {
  // Delete select group
  this.Div_=null;
  this.Fac_=null;
  this.DueDate_='';
  
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
}




