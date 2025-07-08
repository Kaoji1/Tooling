import { Component,OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CartService } from '../cart/cart.service';
import { Router } from '@angular/router';
import { MOCKDATA } from '../../../mock-data';
import { machine } from 'os';
import { cartService } from '../../../core/services/cartService';




@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet,CommonModule, FormsModule, NgSelectModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  constructor(private cartService: CartService,private router:Router){}

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

  
  


  onTypechange() {
    
    if (this.selectedType === 'setup'){
      this.items = this.setupItem;
    }
    else if (this.selectedType ==='outer') {
      this.items = this.otherItem;
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
  }

  // ฟังก์ชั่นปุ่มcleardata
  clearall() {
    this.items = [];
    this.selectedSpec = null;
    this.selectedProcess = null;
    this.selectedMachineType = null;
    this.selectedPratNo = null;
    this.div_ = null;
    this.fac_ = null;
    this.case_ = null;
    this.otherItem.forEach(item => item,this.caseother_=null);
    this.caseother_ = null;
    
    
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

    this.spec = [...new Set(filtered.map(item => item.spec))].map(spec => ({
      label: spec,
      value: spec
    }));

    this.process = [...new Set(filtered.map(item => item.process))].map(process => ({
      label: process,
      value: process
    }));

    this.machineType = [...new Set(filtered.map(item => item.machineType))].map(no => ({
      label: no,
      value: no
    }));

    // reset ค่าเลือกอื่นเมื่อ part เปลี่ยน
    this.selectedSpec = null;
    this.selectedProcess = null;
    this.selectedMachineType = null;
  }


  //  ฟังก์ชันเมื่อเลือก Spec
  onSpecChange() {
    if (!this.selectedSpec || !this.selectedPratNo) {
      this.process = [];
      this.machineType = [];
      return;
    }

    const filtered = this.mockData.filter(item => 
      item.spec === this.selectedSpec &&
      item.partNo === this.selectedPratNo
       
    );

    this.process = [...new Set(filtered.map(item => item.process))].map(process => ({
      label: process,
      value: process
    }));

    this.machineType = [...new Set(filtered.map(item => item.selectedMachineType))].map(no => ({
      label: no,
      value: no
    }));


  }


  // กรองprocess

  onProcessChange() {
    if (!this.selectedProcess || !this.selectedPratNo || !this.selectedSpec ) {
      this.machineType = [];
      return;
    }

    const filtered = this.mockData.filter(item => 
      item.process === this.selectedProcess &&
      item.spec === this.selectedSpec &&
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
        { caseoyher: 'BRO', viewCase: 'BRO' }, // ตัวเลือกเคสที่ 1
        { caseother: 'BUR', viewCase: 'BUR' }, // ตัวเลือกเคสที่ 2
        { caseother: 'USA', viewCase: 'USA' }, // ตัวเลือกเคสที่ 3
        { caseother: 'HOL', viewCase: 'HOL' }, // ตัวเลือกเคสที่ 4
        { caseother: 'INV', viewCase: 'INV' }, // ตัวเลือกเคสที่ 5
        { caseother: 'MOD', viewCase: 'MOD' }, // ตัวเลือกเคสที่ 6
        { caseother: 'NON', viewCase: 'NON' }, // ตัวเลือกเคสที่ 7
        { caseother: 'RET', viewCase: 'RET' }, // ตัวเลือกเคสที่ 8
        { caseother: 'SPA', viewCase: 'SPA' }, // ตัวเลือกเคสที่ 9
        { caseother: 'STO', viewCase: 'STO' }, // ตัวเลือกเคสที่ 10
        { caseother: 'CHA', viewCase: 'CHA' }, // ตัวเลือกเคสที่ 11 
   ]


   caseother_:any|null = null;

    isSearched: boolean = false;

    // ฟังก์ชั่นของปุ่มviewกรองตามที่เลือก
    Setupview() {
      this.items = [];

      
      const division = this.div_;
      const fac = this.fac_;
      const Case = this.case_;
      const partNo = this.selectedPratNo;
      const spec = this.selectedSpec;
      const process = this.selectedProcess;
      const machineType = this.selectedMachineType;

      this.isSearched = true;

      if (partNo && process && machineType && division && fac  && spec !== null ) {
        const filtered = this .mockData.filter(item =>
          item.partNo === partNo &&
          item.spec === spec &&
          item.process === process &&
          item.machineType === machineType  
        );

        if (filtered.length > 0 ) {
          this.items = filtered;
          
        }
      }
    }



    // ฟังก์ชั่นadd to caet
    addTocart()  {
      const itemsWithContext = this.items.map((item: any) => ({
        ...item,
        division: this.div_,
        fac: this.fac_,
        case: this.case_,
        Date_of_Req:null,
        selectedPratNo: this.selectedPratNo,
        selectedSpec: this.selectedSpec,
        selectedProcess: this.selectedProcess,
        selectedMachineType: this.selectedMachineType

      }));
      this.cartService.setCartItems(itemsWithContext);
    }
    
   

}