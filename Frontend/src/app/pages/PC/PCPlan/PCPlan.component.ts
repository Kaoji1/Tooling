import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { PCPlanService } from '../../../core/services/PCPlan.service';

@Component({
  selector: 'app-pc-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './PCPlan.component.html',
  styleUrls: ['./PCPlan.component.scss']
})
export class PCPlanComponent implements OnInit {

  // --- ตัวแปรสำหรับ Dropdown ---
  divisionOptions: { code: string, label: string }[] = []; 
  selectedDivisionCode: string = ''; 

  // ลิสต์ตัวเลือกอื่นๆ
  machineTypes: string[] = [];
  facs: string[] = [];
  processes: string[] = [];
  partNos: string[] = [];
  
  // เพิ่มตัวแปรนี้กลับมาครับ (แก้ Error NG9)
  partBefores: string[] = []; 
  
  // ข้อมูลในตาราง
  planItems: any[] = [];

  constructor(private pcPlanService: PCPlanService) { }

  ngOnInit(): void {
    this.loadDivisions();
    this.addRow(); // เพิ่มแถวแรกเริ่มต้น
  }

  // --- 1. โหลดและจัดการ Division ---
  loadDivisions() {
    this.pcPlanService.getDivisions().subscribe({
      next: (data: any[]) => {
        this.divisionOptions = data.map(item => {
          return {
            code: item.Division,
            label: this.mapDivisionName(item.Division)
          };
        });
      },
      error: (err) => console.error('Error loading divisions:', err)
    });
  }

  mapDivisionName(code: string): string {
    if (code === '7122') return 'GM';
    if (code === '71DZ') return 'PMC';
    return code;
  }

  onDivisionChange() {
    if (this.selectedDivisionCode) {
      this.loadMasterData(this.selectedDivisionCode);
    } else {
      this.clearMasterData();
    }
  }

  loadMasterData(divCode: string) {
    this.pcPlanService.getMachines(divCode).subscribe(res => this.machineTypes = res.map((x:any) => x.MachineType));
    this.pcPlanService.getFacilities(divCode).subscribe(res => this.facs = res.map((x:any) => x.Facility));
    this.pcPlanService.getProcesses(divCode).subscribe(res => this.processes = res.map((x:any) => x.Process));
    this.pcPlanService.getPartNos(divCode).subscribe(res => this.partNos = res.map((x:any) => x.PartNo));
    
    // **หมายเหตุ:** ถ้า Service มี function getPartBefores ก็ให้เพิ่มตรงนี้ครับ เช่น:
    // this.pcPlanService.getPartBefores(divCode).subscribe(res => this.partBefores = res.map((x:any) => x.PartBefore));
  }

  clearMasterData() {
    this.machineTypes = [];
    this.facs = [];
    this.processes = [];
    this.partNos = [];
    this.partBefores = []; // ล้างค่าเมื่อเปลี่ยน Division
  }

  // --- 2. ฟังก์ชันจัดการตาราง ---

  addRow() {
     this.planItems.push({
       date: '',
       machineType: '',
       fac: '',
       process: '',
       partBefore: '', // เพิ่มฟิลด์นี้เพื่อให้รองรับ ngModel
       partNo: '',
       mcNo: '',     
       qty: 0,       
       time: '',     
       comment: ''   
     });
  }

  removeRow(index: number) {
    this.planItems.splice(index, 1);
  }

  selectAllText(event: any) {
    event.target.select();
  }

  onSubmit() {
    console.log('Sending Data:', this.planItems);
    // ใส่โค้ดเรียก Service เพื่อบันทึกข้อมูลที่นี่
  }
}