import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { PCPlanService } from '../../../core/services/PCPlan.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './PlanList.component.html',
  styleUrls: ['./PlanList.component.scss']
})
export class PlanListComponent implements OnInit {

  // ตัวแปรสำหรับ Filter
  filterDate: string = '';
  filterDivision: string = '';
  filterMachineType: string = '';

  // รายการใน Dropdown Filter
  divisions: string[] = ['GM', 'PMC', 'Production'];
  machineTypes: string[] = ['CNC', 'Lathe', 'Milling'];

  // ข้อมูลตาราง
  planList: any[] = [];

  constructor(private pcPlanService: PCPlanService) { }

  ngOnInit(): void {
    this.loadPlanList();
  }

  loadPlanList() {
    this.pcPlanService.getPlanList().subscribe({
      next: (res) => {
        // Map ข้อมูลจาก Backend (PascalCase) -> Frontend (camelCase)
        this.planList = res.map((item: any) => ({
          id: item.Plan_ID,
          date: item.PlanDate ? new Date(item.PlanDate).toLocaleDateString('en-US') : '', // mm/dd/yyyy
          // empId: item.Employee_ID,
          division: item.Division,
          mcType: item.MC_Type, // HTML ใช้ mcType
          fac: item.Facility,
          process: item.Process,
          partBefore: item.Before_Part,
          mcNo: item.MC_No,
          partNo: item.PartNo,
          qty: item.QTY,
          time: item.Time,
          comment: item.Comment,
          pathDwg: item.Path_Dwg || '-',
          pathLayout: item.Path_Layout || '-',
          iiqc: item.Path_IIQC || '-'
        }));
      },
      error: (err) => {
        console.error('Error loading plan list:', err);
      }
    });
  }

  // ฟังก์ชันเมื่อกดปุ่ม Edit
  onEdit(item: any) {
    console.log('Edit item:', item);
    // ใส่ Logic เปิด Popup แก้ไขตรงนี้
  }

  // ฟังก์ชันเมื่อกดปุ่ม Delete
  // ฟังก์ชันเมื่อกดปุ่ม Delete
  onDelete(item: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pcPlanService.deletePlan(item.id).subscribe({
          next: () => {
            Swal.fire(
              'Deleted!',
              'Your file has been deleted.',
              'success'
            );
            // Reload ตารางใหม่
            this.loadPlanList();
          },
          error: (err) => {
            console.error('Delete error:', err);
            Swal.fire(
              'Error!',
              'Failed to delete. Please try again.',
              'error'
            );
          }
        });
      }
    });
  }

}