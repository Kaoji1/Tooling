import { Component,OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { MOCKDATA } from '../../../mock-data';







@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet,CommonModule, FormsModule, NgSelectModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  

  mockData: any[] = [];

  // ตัวเลือกทั้งหมด
  partNo: any[] = [];
  spec: any[] = [];
  process: any[] = [];
  machineType: any[] = [];
  items: any = [];
  displayData: any[]=[];
  item:any;
  setupItem = [];
  otherItem = [];
  router: any;
  itemNo:any;
  Date:string= '';
  date:string='';
  phon: any=[];
  
  

  
  


  onTypechange() {
    
    if (this.selectedType === 'setup'){
      this.items = this.setupItem;
    }
    else if (this.selectedType === 'other') {
  this.items = this.otherItem.map(item => ({
     ...(item as any),   // บอกว่า item เป็น any เพื่อให้ใช้ spread ได้
      qty: null,
      checked: true,
      case: this.selectedType,
      caseother: null
  }));
    }
    else {
      this.items=[];
    }
  }

  // ค่าที่เลือก
  selectedPratNo: string | null = null;
  selectedSpec: string | null = null;
  selectedProcess: string | null = null;
  selectedMachineType: string | null = null;
  selectedType: string | null = null;
  
  
 


  ngOnInit() {
  this.mockData = MOCKDATA;
  this.displayData = this.items;

  const uniquePartNos = [...new Set(this.mockData.map(item => item.partNo))];
  this.partNo = uniquePartNos.map(part => ({ label: part, value: part }));

  //  โหลดค่า division และ fac ที่เคยเลือกไว้จาก sessionStorage
  const savedDiv = sessionStorage.getItem('selectedDiv');
  const savedFac = sessionStorage.getItem('selectedFac');

  if (savedDiv) this.div_ = savedDiv;
  if (savedFac) this.fac_ = savedFac;
}
onDivChange(value: any) {
  this.div_ = value;
  sessionStorage.setItem('selectedDiv', value);
}

onFacChange(value: any) {
  this.fac_ = value;
  sessionStorage.setItem('selectedFac', value);
}

  // ฟังก์ชั่นปุ่มcleardata
  clearall() {
    this.items = [];
    this.selectedSpec = null;
    this.selectedProcess = null;
    this.selectedMachineType = null;
    this.selectedPratNo = null;
    
    this.selectedType = null;
    
    
    
  }

  //  ฟังก์ชันเมื่อเลือก Part No
  onPartNoChange() {
    if (!this.selectedPratNo) {
      this.spec = [];
      this.process = [];
      this.machineType = [];
      return;
    }

    const filtered = this.mockData.filter(item => item.partNo === this.selectedPratNo);

    // this.spec = [...new Set(filtered.map(item => item.spec))].map(spec => ({
    //   label: spec,
    //   value: spec
    // }));

    this.process = [...new Set(filtered.map(item => item.process))].map(process => ({
      label: process,
      value: process
    }));

    this.machineType = [...new Set(filtered.map(item => item.machineType))].map(no => ({
      label: no,
      value: no
    }));

    // reset ค่าเลือกอื่นเมื่อ part เปลี่ยน
    // this.selectedSpec = null;
    this.selectedProcess = null;
    this.selectedMachineType = null;
  }


  //  ฟังก์ชันเมื่อเลือก Spec
  // onSpecChange() {
  //   if (!this.selectedSpec || !this.selectedPratNo) {
  //     this.process = [];
  //     this.machineType = [];
  //     return;
  //   }

  //   const filtered = this.mockData.filter(item => 
  //     item.spec === this.selectedSpec &&
  //     item.partNo === this.selectedPratNo
       
  //   );

  //   this.process = [...new Set(filtered.map(item => item.process))].map(process => ({
  //     label: process,
  //     value: process
  //   }));

  //   this.machineType = [...new Set(filtered.map(item => item.selectedMachineType))].map(no => ({
  //     label: no,
  //     value: no
  //   }));


  // }


  // กรองprocess

  onProcessChange() {
    if (!this.selectedProcess || !this.selectedPratNo  ) {
      this.machineType = [];
      return;
    }

    const filtered = this.mockData.filter(item => 
      item.process === this.selectedProcess &&
      item.partNo === this.selectedPratNo
    
    );


    this.machineType = [...new Set(filtered.map(item => item.machineType))].map(no => ({
      label: no,
      value: no
    }));


  }
  // selectedPratNo: string | null = null;
  // selectedSpec: string | null = null;
  // selectedProcess: string | null = null;
  //  selectedMachineNo: string | null = null;

 // ของdivision
    Div = [
    { label: 'GM', value: 'GM' },
    { label: 'PMC', value: 'PMC' }
  ];

  div_: string | null = null; // ตัวแปรเก็บค่าที่เลือก


  // ของFac
    Fac = [
      {label:'1',value:'1'},
      {label:'2',value:'2'},
      {label:'3',value:'3'},
      {label:'4',value:'4'},
      {label:'5',value:'5'},
      {label:'6',value:'6'},
      {label:'7',value:'7'},
    ];

    fac_:any| null = null;

  // ของcasemaster
   Case = [
        { Case: 'Setup', value: 'setup' }, // ตัวเลือกเคสที่ 1
        { Case: 'Other', value: 'other' }, // ตัวเลือกเคสที่ 2
   ]

   case_:any|null = null;

//  csdeother
  caseother = [
  { caseother: 'BRO', viewCase: 'BRO' },
  { caseother: 'BUR', viewCase: 'BUR' },
  { caseother: 'USA', viewCase: 'USA' },
  { caseother: 'HOL', viewCase: 'HOL' },
  { caseother: 'INV', viewCase: 'INV' },
  { caseother: 'MOD', viewCase: 'MOD' },
  { caseother: 'NON', viewCase: 'NON' },
  { caseother: 'RET', viewCase: 'RET' },
  { caseother: 'SPA', viewCase: 'SPA' },
  { caseother: 'STO', viewCase: 'STO' },
  { caseother: 'CHA', viewCase: 'CHA' }
];

   

    isSearched: boolean = false;

    // ฟังก์ชั่นของปุ่มviewกรองตามที่เลือก
    Setupview() {
  this.items = [];

  const division = this.div_;
  const fac = this.fac_;
  const partNo = this.selectedPratNo;
  
  const process = this.selectedProcess;
  const machineType = this.selectedMachineType;
  const Date = this.Date;
  

  this.isSearched = true;

  // ตรวจสอบว่าไม่มีค่าที่เป็น undefined, null, หรือ string ว่าง
  if (
    partNo && partNo.trim() !== '' &&
    
    process && process.trim() !== '' &&
    machineType && machineType.trim() !== '' &&
    division && division.trim() !== '' &&
    fac && fac.trim() !== '' &&
    Date && Date.trim() !== ''
    
  ) {
    const filtered = this.mockData.filter(item =>
      item.partNo === partNo &&
     
      item.process === process &&
      item.machineType === machineType
    );

    if (filtered.length > 0) {
      this.items = filtered.map(item => ({
        ...item,
        qty: null,
        checked: true,
        case: this.selectedType
      }));
    }
  } else {
    alert("กรุณาเลือกข้อมูลให้ครบทุกช่องก่อนค้นหา");
  }
}

// add to cart

addTocart() {
  const setupDate = new Date().toISOString().split('T')[0]; // รูปแบบ YYYY-MM-DD
  const inputDate = this.Date || new Date().toISOString().split('T')[0];

  // ✅ เลือกเฉพาะรายการที่ติ๊ก checkbox เท่านั้น
  const selectedItems = this.items.filter((item: any) => item.checked);

  if (selectedItems.length === 0) {
    alert('กรุณาเลือกอย่างน้อย 1 รายการ');
    return;
  }

  const newArray = selectedItems.map((item: any) => ({
    partNo: item.partNo,
    spec: item.spec,
    process: item.process,
    machineType: item.machineType,
    usage: item.usage,
    qty: item.qty || 1,
    division: this.div_,
    factory: this.fac_,
    case: this.selectedType,
    ITEMNO: item.itemNo || this.itemNo,   // หาก item มี itemNo ให้ใช้ของมัน
    inputDate: inputDate,
    setupDate: setupDate,
    caseother: item.caseother || null 
  }));

  const confirmAdd = confirm('Do you want to add selected items to cart?');
  if (confirmAdd) {
    const existingCart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    const updatedCart = [...existingCart, ...newArray];
    sessionStorage.setItem('cart', JSON.stringify(updatedCart));

    this.clearall();  // เคลียร์ฟอร์มหลังเพิ่ม
  }
  
}

}


