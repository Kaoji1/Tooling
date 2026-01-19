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
  filteredPlanList: any[] = []; // เพิ่มตัวแปรสำหรับเก็บข้อมูลที่กรองแล้ว

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

        this.applyFilter(); // เรียก Filter ครั้งแรกหลังจากโหลดข้อมูลเสร็จ
      },
      error: (err: any) => {
        console.error('Error loading plan list:', err);
      }
    });
  }

  // ฟังก์ชันสำหรับกรองข้อมูล
  applyFilter() {
    this.filteredPlanList = this.planList.filter(item => {
      // 1. Filter Date (ต้องแปลง format ให้ตรงกันก่อน)
      const matchDate = this.filterDate ? this.isDateMatch(item.date, this.filterDate) : true;
      // 2. Filter Division
      const matchDivision = this.filterDivision ? item.division === this.filterDivision : true;
      // 3. Filter Machine Type
      const matchMachine = this.filterMachineType ? item.mcType === this.filterMachineType : true;

      return matchDate && matchDivision && matchMachine;
    });
  }

  // Helper สำหรับเช็ควันที่
  isDateMatch(itemDateStr: string, filterDateStr: string): boolean {
    // itemDateStr format: mm/dd/yyyy (from toLocaleDateString en-US)
    // filterDateStr format: yyyy-mm-dd (from input type="date")
    if (!itemDateStr || !filterDateStr) return false;

    const [month, day, year] = itemDateStr.split('/');
    // padStart to ensure 2 digits
    const formattedItemDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    return formattedItemDate === filterDateStr;
  }

  // --- Edit Logic (Placeholder if needed, or just view) ---
  isEditModalOpen: boolean = false;
  editData: any = {};

  onEdit(item: any) {
    this.editData = { ...item }; // Clone data
    // Map data types for form binding
    // Format Date for <input type="date"> (yyyy-MM-dd)
    if (this.editData.date) {
      const parts = this.editData.date.split('/');
      if (parts.length === 3) {
        this.editData.date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }
  // saveEdit removed as revise is reverted


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
          error: (err: any) => {
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