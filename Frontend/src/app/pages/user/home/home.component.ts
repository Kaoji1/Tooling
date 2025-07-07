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
  machineNo: any[] = [];
  items: any = [];

  // ค่าที่เลือก
  selectedPratNo: string | null = null;
  selectedSpec: string | null = null;
  selectedProcess: string | null = null;
  selectedMachineNo: string | null = null;

  ngOnInit() {
    this.mockData = MOCKDATA;

    const uniquePartNos = [...new Set(this.mockData.map(item => item.partNo))];
    this.partNo = uniquePartNos.map(part => ({ label: part, value: part }));
  }

  //  ฟังก์ชันเมื่อเลือก Part No
  onPartNoChange() {
    if (!this.selectedPratNo) {
      this.spec = [];
      this.process = [];
      this.machineNo = [];
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

    this.machineNo = [...new Set(filtered.map(item => item.machineNo))].map(no => ({
      label: no,
      value: no
    }));

    // reset ค่าเลือกอื่นเมื่อ part เปลี่ยน
    this.selectedSpec = null;
    this.selectedProcess = null;
    this.selectedMachineNo = null;
  }


  //  ฟังก์ชันเมื่อเลือก Spec
  onSpecChange() {
    if (!this.selectedSpec || !this.selectedPratNo) {
      this.process = [];
      this.machineNo = [];
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

    this.machineNo = [...new Set(filtered.map(item => item.machineNo))].map(no => ({
      label: no,
      value: no
    }));


  }


  // กรองprocess

  onProcessChange() {
    if (!this.selectedProcess || !this.selectedPratNo || !this.selectedSpec ) {
      this.machineNo = [];
      return;
    }

    const filtered = this.mockData.filter(item => 
      item.process === this.selectedProcess &&
      item.spec === this.selectedSpec &&
      item.partNo === this.selectedPratNo
    
    );


    this.machineNo = [...new Set(filtered.map(item => item.machineNo))].map(no => ({
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

  // ของcase
   Case = [
        { Case: 'Setup', value: 'Setup' }, // ตัวเลือกเคสที่ 1
        { Case: 'Other', value: 'Other' }, // ตัวเลือกเคสที่ 2
   ]

   case_:any|null = null;

    isSearched: boolean = false;
    Setup() {
      this.items = [];

      
      const division = this.div_;
      const fac = this.fac_;
      const Case = this.case_;
      const partNo = this.selectedPratNo;
      const spec = this.selectedSpec;
      const process = this.selectedProcess;
      const machineNo = this.selectedMachineNo;

      this.isSearched = true;

      if (partNo && process && machineNo && division && fac && Case && spec !== null ) {
        const filtered = this .mockData.filter(item =>
          item.partNo === partNo &&
          item.spec === spec &&
          item.process === process &&
          item.machineNo === machineNo  
        );

        if (filtered.length > 0 ) {
          this.items = filtered;
          
        }
      }
    }
    
   

}