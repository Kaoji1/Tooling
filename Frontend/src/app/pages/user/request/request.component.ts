import { Component,OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RequestService,  } from '../../../core/services/request.service';



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
  Div_: any = [];
  Fac_: any = [];
  Case_: any = [];
  PartNo_: any = [];
  Process_: any = [];
  MachineType_: any = [];
  caseother: any = [];
  Spec_:any=[];
  setupItem = [];
  otherItem = [];

  // option dropdown
  spec:any=[];
  Div:any=[];
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

  // Table data
  items: any= [];// array เก่าวแปรสำหรับเก็บรายการข้อมูล (items) ที่มีอยู่แล้ว
  item: any; //array ใหม่  ตัวแปรสำหรับเก็บข้อมูล item ใหม่
  selectedType: string = '';
  isSearched: boolean = false;

  constructor( //โหลดทันทีที่รันที่จำเป็นต้องใช้ตอนเริ่มเว็ป
    private api: RequestService
  ) {
    // Set today's date for min date validation
    this.today_ = new Date().toISOString().split('T')[0];

    // กำหนดตัวเลือกในdropdown
    this.Div = [
      { label: 'GM', value: 'GM' }, // ตัวเลือก Division ที่ 1
      { label: 'PMC', value: 'PMC' }, // ตัวเลือก Division ที่ 2
    ];

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
      { label: 'Setup', value: 'setup' }, // ตัวเลือก Division ที่ 1
      { label: 'Other', value: 'other' }, // ตัวเลือก Division ที่ 2
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
    this.Get_PARTNO();


  }
// เรียกใช้ตัวดึงapi
  Get_PARTNO() {
    // เรียก API เพื่อดึงข้อมูล SPEC
    this.api.get_PARTNO().subscribe({
      // ถ้าสำเร็จ จะทำการเก็บ response ลงใน spec
      next: (response: any) => {
        this.PartNo = response;
        // แสดงผลลัพธ์ใน console
        // console.log(this.PartNo);
      },
      // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
      error: (e: any) => console.error(e),
    });
  }

  async get_SPEC(event: any) {
  console.log('Selected PartNo:', event.value);
  if (event.value) {
    this.api.get_SPEC(event.value).subscribe({
      next: (response) => {
        console.log('Spec API response:', response);
        this.spec = response; // เก็บทั้ง array 
      },
      error: (e) => console.error(e),
    });
  }
}
  // Process
  async post_PROCESS(event:any) {
    console.log(event.value); // แสดงค่าที่ได้รับใน console
    // เช็คว่า event.value มีค่าหรือไม่
    if (event.value !== undefined) {
      // เรียก API เพื่อส่งข้อมูลไปยัง SQL
      this.api.post_PROCESS(event.value).subscribe({
        // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_process
        next: (response) => {
          if (response.length > 0) {
            this.Process = response[0];
            // แสดงผลลัพธ์ใน console
            console.log(response);
          }
        },
        // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
        error: (e) => console.error(e),
      });
    }
  }

// โดยใช้ Post_machine_type ที่ดึงมาจาก api.service.ts เพื่อเชื่อมต่อ API แล้วทำการส่งข้อมูล(post)ไป SQL
  // เรียกใช้งาน api.post_machine_type โดยส่งค่าจาก event.value ไป
  async post_MACHINETYPE(event:any) {
    // console.log(event.value) // แสดงค่าที่ได้รับใน console
    // เช็คว่า event.value มีค่าหรือไม่
    if (event.value !== undefined) {
      // เก็บค่า OPIST_Process จาก event.value
      const Process = event.value.Process;
      // สร้างอ็อบเจ็กต์ data สำหรับส่งไปยัง API
      const data = {
        PartNo: this.PartNo.PartNo,
        Process: Process,
      };

      // เรียก API เพื่อส่งข้อมูล machine type
      this.api
        .post_MACHINETYPE(data)
        // console.log(event.value) // แสดงค่าที่ได้รับใน console
        .subscribe({
          // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_mc และ rev_
          next: (response) => {
            if (response.length > 0) {
              this.MachineType_ = response[0];
              // this.rev_ = response[0][0].OPIST_DwgRev;
              // console.log(response, this.rev_, response[0][0].OPIST_DwgRev); // แสดงผลลัพธ์ใน console
            }
          },
          // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
          error: (e) => console.error(e),
        });
    }
  }


onTypechange() {

    if (this.Case_ === 'setup'){
      this.items = this.setupItem;
    }
    else if (this.Case_ === 'other') {
  this.items = this.otherItem.map(item => ({
     ...(item as any),   // บอกว่า item เป็น any เพื่อให้ใช้ spread ได้
      qty: null,
      machineNoother:null,
      checked: true,
      Case: this.selectedType,
      Caseother: null
  }));
    }
    else {
      this.items=[];
    }
  }



// ฟังก์ชั่นเรียกดูข้อมูลในตาราง
// Setupview() {
//   this.items = [];

//   const division = this.Div_;
//   const fac = this.Fac_;
//   const partNo = this.PartNo_;
//   const process = this.Process_;
//   const machineType = this.MachineType_;
//   const date = this.DueDate_;

//   this.isSearched = true;

//   if (
//     partNo && partNo.trim() !== '' &&
//     process && process.trim() !== '' &&
//     machineType && machineType.trim() !== '' &&
//     division && division.trim() !== '' &&
//     fac && fac.trim() !== '' &&
//     date && date.trim() !== ''
//   ) {
//     // เรียก API แทน mockData
//     this.RequestService.getFilteredItems({
//       partNo,
//       process,
//       machineType,
//       division,
//       fac,
//       dueDate: date
//     }).subscribe((response: any[]) => {
//       if (response.length > 0) {
//         this.items = response.map(item => ({
//           ...item,
//           qty: null,
//           machineNoother: null,
//           checked: true,
//           case: this.selectedType
//         }));
//       } else {
//         this.items = [];
//         alert("ไม่พบข้อมูลที่ค้นหา");
//       }
//     }, (error: any) => {
//       console.error("เกิดข้อผิดพลาดขณะดึงข้อมูลจาก API:", error);
//       alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
//     });
//   } else {
//     alert("กรุณาเลือกข้อมูลให้ครบทุกช่องก่อนค้นหา");
//   }
// }

// function add to cart
AddToCart() {
   // กรองรายการที่มีค่า MC_no และ Qty
    const filteredItems = this.items.filter((item:any) => item.MC_no && item.Qty);
    //console.log(filteredItems.length, this.items.length); // แสดงจำนวนรายการใน console
    // เช็คว่ากรอก mc no และ qty ได้กรอกหมดทุกตัวไหม
    if (filteredItems.length < this.items.length) {

      return; // หยุดการดำเนินการถ้ายังไม่กรอกข้อมูลครบ
    }

    // สร้างอาเรย์ใหม่จากข้อมูลที่ถูกกรอง
// สร้างอาเรย์ใหม่จากข้อมูลที่ถูกกรอง
const newArray = filteredItems.map((item:any) => ({
  Doc_no: null, // หมายเลขเอกสารเริ่มต้นเป็น null
  Division: this.Div_.value, // ค่าจากฟอร์มสำหรับ Division
  Factory: this.Fac_.value, // ค่าจากฟอร์มสำหรับ Factory
  Date_of_Req: null, // วันที่ของการร้องขอเริ่มต้นเป็น null
  Item_no: item.ITEMNO, // หมายเลขไอเทมจากรายการที่ถูกกรอง
  Part_no: item.PARTNO, // หมายเลขชิ้นส่วนจากรายการที่ถูกกรอง
  Process: item.PROCESS, // กระบวนการจากรายการที่ถูกกรอง
  MC_type: item.MACHINETYPE, // ประเภทเครื่องจักรจากรายการที่ถูกกรอง
  Spec: item.SPEC, // สเปคจากรายการที่ถูกกรอง
  Usage: item.Usage_pcs, // การใช้งานจากรายการที่ถูกกรอง
  MC_no: item.MC_no, // หมายเลขเครื่องจักรจากรายการที่ถูกกรอง
  Qty: item.Qty, // จำนวนจากรายการที่ถูกกรอง

  Status: null, // สถานะเริ่มต้นเป็น null
  Set_by: null, // ตั้งค่าโดยเริ่มต้นเป็น null
  Local: 0, // ค่าท้องถิ่นเริ่มต้นเป็น 0
  }));
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

  // Delete items ค่าที่รวมที่จะส่งไปตะกร้า
  this.items=null;

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





























































  // Clear all selections
  // clearall(): void {
  //   this.selectedDivision = null;
  //   this.selectedFacility = null;
  //   this.selectedCase = null;
  //   this.selectedPartNo = null;
  //   this.selectedProcess = null;
  //   this.selectedMachineType = null;
  //   this.phone = '';
  //   this.DueDate = '';
  //   this.items = [];
  //   this.selectedType = '';
  //   this.isSearched = false;

  //   // Clear dependent dropdowns
  //   this.Fac = [];
  //   this.PartNo = [];
  //   this.Process = [];
  //   this.MachineType = [];
  // }

  // Add to cart
//   addTocart(): void {
//     const checkedItems = this.items.filter(item => item.checked);

//     if (checkedItems.length === 0) {
//       alert('Please select at least one item to add to cart.');
//       return;
//     }

//     // Validate required fields
//     if (!this.phone || !this.DueDate) {
//       alert('Please fill in phone number and due date.');
//       return;
//     }

//     // Process the selected items
//     console.log('Adding to cart:', {
//       division: this.selectedDivision,
//       facility: this.selectedFacility,
//       phone: this.phone,
//       dueDate: this.DueDate,
//       items: checkedItems
//     });

//     // Here you would typically send the data to your backend
//     // this.requestService.addToCart(cartData).subscribe(...)

//     alert('Items added to cart successfully!');
//   }
// }


  // Dropdown change handlers
  // onDivChange(divisionId: number): void {
  //   this.selectedDivision = divisionId;
  //   this.selectedFacility = null;
  //   this.Fac = [];

  //   if (divisionId) {
  //     this.requestService.getFacilities(divisionId).subscribe({
  //       next: (facilities) => {
  //         this.Fac = facilities;
  //       },
  //       error: (error) => {
  //         console.error('Error loading facilities:', error);
  //       }
  //     });
  //   }
  // }
// onPartNoChange(): void {
  //   this.selectedProcess = null;
  //   this.selectedMachineType = null;
  //   this.Process = [];
  //   this.MachineType = [];

  //   if (this.selectedPartNo) {
  //     this.requestService.getProcesses(this.selectedPartNo).subscribe({
  //       next: (processes) => {
  //         this.Process = processes;
  //       },
  //       error: (error) => {
  //         console.error('Error loading processes:', error);
  //       }
  //     });
  //   }
  // }

  // onProcessChange(): void {
  //   this.selectedMachineType = null;
  //   this.MachineType = [];

  //   if (this.selectedProcess) {
  //     this.requestService.getMachineTypes(this.selectedProcess).subscribe({
  //       next: (machineTypes) => {
  //         this.MachineType = machineTypes;
  //       },
  //       error: (error) => {
  //         console.error('Error loading machine types:', error);
  //       }
  //     });
  //   }
  // }

  // View button handler
  // Setupview(): void {
  //   const filter: FilterRequest = {
  //     divisionId: this.selectedDivision || undefined,
  //     facilityId: this.selectedFacility || undefined,
  //     caseId: this.selectedCase || undefined,
  //     partId: this.selectedPartNo || undefined,
  //     processId: this.selectedProcess || undefined,
  //     machineTypeId: this.selectedMachineType || undefined
  //   };

    // this.requestService.getItems(filter).subscribe({
    //   next: (items) => {
    //     this.items = items.map(item => ({
    //       ...item,
    //       checked: false,
    //       machineNoother: item.machineNo,
    //       caseother: null
    //     }));
    //     this.isSearched = true;
    //   },
    //   error: (error) => {
    //     console.error('Error loading items:', error);
    //     this.items = [];
    //     this.isSearched = true;
    //   }
    // });


 // Determine selected type based on case
    // const selectedCaseItem = this.Case.find(c => c.value === this.selectedCase);
    // if (selectedCaseItem) {
    //   this.selectedType = selectedCaseItem.Case.toLowerCase();
    // }

    // if (this.selectedCase) {
    //   this.requestService.getParts(this.selectedCase).subscribe({
    //     next: (parts) => {
    //       this.PartNo = parts;
    //     },
    //     error: (error) => {
    //       console.error('Error loading parts:', error);
    //     }
    //   });
    // }
// onFacChange(facilityId: number): void {
  //   this.selectedFacility = facilityId;
  // }

  // onCaseChange(): void {
  //   this.selectedPartNo = null;
  //   this.selectedProcess = null;
  //   this.selectedMachineType = null;
  //   this.PartNo = [];
  //   this.Process = [];
  //   this.MachineType = [];


  // }







//   mockData: any[] = [];

//   // ตัวเลือกทั้งหมด
  // partNo: any[] = [];
//   spec: any[] = [];
//   process: any[] = [];
  // machineType: any[] = [];
//   items: any = [];
//   displayData: any[]=[];
  // item:any;
//   setupItem = [];
//   otherItem = [];
//   router: any;
//   itemNo:any;
//   Date:string= '';
//   date:string='';
  // phon: any=[];

//   today=new Date().toISOString().split('T')[0];


//   onTypechange() {

//     if (this.selectedType === 'setup'){
//       this.items = this.setupItem;
//     }
//     else if (this.selectedType === 'other') {
//   this.items = this.otherItem.map(item => ({
//      ...(item as any),   // บอกว่า item เป็น any เพื่อให้ใช้ spread ได้
//       qty: null,
//       machineNoother:null,
//       checked: true,
//       case: this.selectedType,
//       caseother: null
//   }));
//     }
//     else {
//       this.items=[];
//     }
//   }

//   // ค่าที่เลือก
//   selectedPartNo: string | null = null;
//   selectedSpec: string | null = null;
//   selectedProcess: string | null = null;
//   selectedMachineType: string | null = null;
//   selectedType: string | null = null;





//   ngOnInit() {
//   this.mockData = MOCKDATA;
//   this.displayData = this.items;
//   // this.Get_caseother();
//   const uniquePartNos = [...new Set(this.mockData.map(item => item.partNo))];
//   this.partNo = uniquePartNos.map(part => ({ label: part, value: part }));

//   //  โหลดค่า division และ fac ที่เคยเลือกไว้จาก sessionStorage
//   const savedDiv = sessionStorage.getItem('selectedDiv');
//   const savedFac = sessionStorage.getItem('selectedFac');

//   if (savedDiv) this.div_ = savedDiv;
//   if (savedFac) this.fac_ = savedFac;
// }
// onDivChange(value: any) {
//   this.div_ = value;
//   sessionStorage.setItem('selectedDiv', value);
// }

// onFacChange(value: any) {
//   this.fac_ = value;
//   sessionStorage.setItem('selectedFac', value);
// }

//   // ฟังก์ชั่นปุ่ม cleardata
//   clearall() {
//     this.items = [];
//     this.selectedSpec = null;
//     this.selectedProcess = null;
//     this.selectedMachineType = null;
//     this.selectedPartNo = null;

//     this.selectedType = null;



//   }

//   //  ฟังก์ชันเมื่อเลือก Part No
//   onPartNoChange() {
//     if (!this.selectedPartNo) {
//       this.spec = [];
//       this.process = [];
//       this.machineType = [];
//       return;
//     }

//     const filtered = this.mockData.filter(item => item.partNo === this.selectedPartNo);

//     // this.spec = [...new Set(filtered.map(item => item.spec))].map(spec => ({
//     //   label: spec,
//     //   value: spec
//     // }));

//     this.process = [...new Set(filtered.map(item => item.process))].map(process => ({
//       label: process,
//       value: process
//     }));

//     this.machineType = [...new Set(filtered.map(item => item.machineType))].map(no => ({
//       label: no,
//       value: no
//     }));

//     // reset ค่าเลือกอื่นเมื่อ part เปลี่ยน
//     // this.selectedSpec = null;
//     this.selectedProcess = null;
//     this.selectedMachineType = null;
//   }


//   //  ฟังก์ชันเมื่อเลือก Spec
//   // onSpecChange() {
//   //   if (!this.selectedSpec || !this.selectedPartNo) {
//   //     this.process = [];
//   //     this.machineType = [];
//   //     return;
//   //   }

//   //   const filtered = this.mockData.filter(item =>
//   //     item.spec === this.selectedSpec &&
//   //     item.partNo === this.selectedPartNo

//   //   );

//   //   this.process = [...new Set(filtered.map(item => item.process))].map(process => ({
//   //     label: process,
//   //     value: process
//   //   }));

//   //   this.machineType = [...new Set(filtered.map(item => item.selectedMachineType))].map(no => ({
//   //     label: no,
//   //     value: no
//   //   }));


//   // }


//   // กรองprocess

//   onProcessChange() {
//     if (!this.selectedProcess || !this.selectedPartNo  ) {
//       this.machineType = [];
//       return;
//     }

//     const filtered = this.mockData.filter(item =>
//       item.process === this.selectedProcess &&
//       item.partNo === this.selectedPartNo

//     );


//     this.machineType = [...new Set(filtered.map(item => item.machineType))].map(no => ({
//       label: no,
//       value: no
//     }));


//   }
//   // selectedPartNo: string | null = null;
//   // selectedSpec: string | null = null;
//   // selectedProcess: string | null = null;
//   //  selectedMachineNo: string | null = null;

//  // ของdivision
//     Div = [
//     { label: 'GM', value: 'GM' },
//     { label: 'PMC', value: 'PMC' }
//   ];

//   div_: string | null = null; // ตัวแปรเก็บค่าที่เลือก


//   // ของFac
//     Fac = [
//       {label:'1',value:'1'},
//       {label:'2',value:'2'},
//       {label:'3',value:'3'},
//       {label:'4',value:'4'},
//       {label:'5',value:'5'},
//       {label:'6',value:'6'},
//       {label:'7',value:'7'},
//     ];

//     fac_:any| null = null;

//   // ของcasemaster
//    Case = [
//         { Case: 'Setup', value: 'setup' }, // ตัวเลือกเคสที่ 1
//         { Case: 'Other', value: 'other' }, // ตัวเลือกเคสที่ 2
//    ]

//    case_:any|null = null;

// //  csdeother
//   caseother = [
//   { caseother: 'BRO', viewCase: 'BRO' },
//   { caseother: 'BUR', viewCase: 'BUR' },
//   { caseother: 'USA', viewCase: 'USA' },
//   { caseother: 'HOL', viewCase: 'HOL' },
//   { caseother: 'INV', viewCase: 'INV' },
//   { caseother: 'MOD', viewCase: 'MOD' },
//   { caseother: 'NON', viewCase: 'NON' },
//   { caseother: 'RET', viewCase: 'RET' },
//   { caseother: 'SPA', viewCase: 'SPA' },
//   { caseother: 'STO', viewCase: 'STO' },
//   { caseother: 'CHA', viewCase: 'CHA' }
// ];



//     isSearched: boolean = false;

//     // ฟังก์ชั่นของปุ่มviewกรองตามที่เลือก
//     Setupview() {
//   this.items = [];

//   const division = this.div_;
//   const fac = this.fac_;
//   const partNo = this.selectedPartNo;

//   const process = this.selectedProcess;
//   const machineType = this.selectedMachineType;
//   const Date = this.Date;


//   this.isSearched = true;

//   // ตรวจสอบว่าไม่มีค่าที่เป็น undefined, null, หรือ string ว่าง
//   if (
//     partNo && partNo.trim() !== '' &&

//     process && process.trim() !== '' &&
//     machineType && machineType.trim() !== '' &&
//     division && division.trim() !== '' &&
//     fac && fac.trim() !== '' &&
//     Date && Date.trim() !== ''

//   ) {
//     const filtered = this.mockData.filter(item =>
//       item.partNo === partNo &&

//       item.process === process &&
//       item.machineType === machineType
//     );

//     if (filtered.length > 0) {
//       this.items = filtered.map(item => ({
//         ...item,
//         qty: null,
//         machineNoother:null,
//         checked: true,
//         case: this.selectedType
//       }));
//     }
//   } else {
//     alert("กรุณาเลือกข้อมูลให้ครบทุกช่องก่อนค้นหา");
//   }
// }

// // add to cart

// addTocart() {
//   const setupDate = new Date().toISOString().split('T')[0]; // รูปแบบ YYYY-MM-DD
//   const inputDate = this.Date || new Date().toISOString().split('T')[0];

//   // ✅ เลือกเฉพาะรายการที่ติ๊ก checkbox เท่านั้น
//   const selectedItems = this.items.filter((item: any) => item.checked);

//   if (selectedItems.length === 0) {
//     alert('กรุณาเลือกอย่างน้อย 1 รายการ');
//     return;
//   }

//   const newArray = selectedItems.map((item: any) => ({
//     partNo: item.partNo,
//     spec: item.spec,
//     process: item.process,
//     machineType: item.machineType,
//     usage: item.usage,
//     qty: item.qty || 1,
//     division: this.div_,
//     factory: this.fac_,
//     case: this.selectedType,
//     ITEMNO: item.itemNo || this.itemNo,   // หาก item มี itemNo ให้ใช้ของมัน
//     inputDate: inputDate,
//     setupDate: setupDate,
//     caseother: item.caseother || null,
//     machineNoother: item.machineNoother || null
//   }));

//   const confirmAdd = confirm('Do you want to add selected items to cart?');
//   if (confirmAdd) {
//     const existingCart = JSON.parse(sessionStorage.getItem('cart') || '[]');
//     const updatedCart = [...existingCart, ...newArray];
//     sessionStorage.setItem('cart', JSON.stringify(updatedCart));

//     this.clearall();  // เคลียร์ฟอร์มหลังเพิ่ม
//   }

// }

// }
