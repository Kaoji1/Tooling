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
  showHistory: boolean = false; // Toggle for Global History

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
    this.pcPlanService.getPlanList(this.showHistory).subscribe({
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
          iiqc: item.Path_IIQC || '-',
          revision: item.Revision,
          planStatus: item.PlanStatus || 'Active',
          groupId: item.GroupId // Critical for History
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

    // เรียงลำดับ: วันที่ล่าสุด -> Revision ล่าสุด
    this.filteredPlanList.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;

      // GroupId Check (Group items together just in case date is same) - Optional but good practice
      if (a.groupId && b.groupId && a.groupId !== b.groupId) {
        return a.groupId.localeCompare(b.groupId);
      }

      return (b.revision || 0) - (a.revision || 0);
    });

    // --- Post-Processing for Display ---
    // Mark 'isLatest' and 'isGroupStart' for UI Styling
    const seenGroups = new Set<string>();
    let lastGroupId = '';

    this.filteredPlanList.forEach((item, index) => {
      // 1. Check isLatest (First time seeing this GroupId in the sorted list = Latest)
      // Since we sort by Revision DESC within Group, the first one is the latest.
      if (!seenGroups.has(item.groupId)) {
        item.isLatest = true;
        seenGroups.add(item.groupId);
      } else {
        item.isLatest = false;
      }

      // 2. Check isGroupStart (Separator)
      if (item.groupId !== lastGroupId) {
        item.isGroupStart = true;
        lastGroupId = item.groupId;
      } else {
        item.isGroupStart = false;
      }
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

  // --- Edit Logic ---
  isEditModalOpen: boolean = false;
  editData: any = {};

  onEdit(item: any) {
    this.editData = { ...item }; // Clone data

    // Format Date for <input type="date"> (yyyy-MM-dd)
    if (this.editData.date) {
      const parts = this.editData.date.split('/');
      if (parts.length === 3) {
        // parts: [mm, dd, yyyy]
        this.editData.dateObj = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }

    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  saveEdit() {
    // 1. Prepare Payload
    // Note: We send an array because backend insertPCPlan expects an array
    // Date: Must format back to what backend expects (Date Object or String)
    const payload = [{
      date: this.editData.dateObj, // yyyy-MM-dd
      employeeId: this.editData.empId, // Might be undefined if not mapped, but OK
      division: this.editData.division,
      mcType: this.editData.mcType,
      fac: this.editData.fac,
      partBefore: this.editData.partBefore,
      process: this.editData.process,
      mcNo: this.editData.mcNo,
      partNo: this.editData.partNo,
      qty: this.editData.qty,
      time: this.editData.time,
      comment: this.editData.comment
      // Note: PlanStatus is derived from Comment in Backend for PMC, 
      // or we could send it explicitly if we modified backend to accept it directly.
      // For now, let's append [Cancel] to comment if user chooses 'Cancelled' status in UI?
      // OR: User manually types 'Cancel' in comment as agreed.
      // Let's stick to: User types 'Cancel' in comment.
    }];

    Swal.fire({
      title: 'Saving...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.pcPlanService.savePlan(payload).subscribe({
      next: (res) => {
        Swal.fire('Success', 'Plan updated successfully!', 'success');
        this.isEditModalOpen = false;
        this.loadPlanList(); // Reload to see new Revision
      },
      error: (err) => {
        console.error('Save Edit Error:', err);
        Swal.fire('Error', 'Failed to update plan.', 'error');
      }
    });
  }


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

  // --- History Logic ---
  isHistoryModalOpen: boolean = false;
  historyList: any[] = [];
  selectedHistoryItem: any = {};

  onViewHistory(item: any) {
    if (!item.groupId) {
      Swal.fire('Error', 'No GroupId found for this item.', 'error');
      return;
    }

    this.selectedHistoryItem = item;
    this.isHistoryModalOpen = true;
    this.historyList = []; // Clear old data

    // Fetch History
    this.pcPlanService.getPlanHistory(item.groupId).subscribe({
      next: (res) => {
        this.historyList = res.map((h: any) => ({
          ...h,
          date: h.PlanDate ? new Date(h.PlanDate).toLocaleDateString('en-US') : '',
        }));
      },
      error: (err) => {
        console.error('Error fetching history:', err);
        Swal.fire('Error', 'Failed to load history.', 'error');
      }
    });
  }

  closeHistoryModal() {
    this.isHistoryModalOpen = false;
  }

}