import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarPurchaseComponent } from "../../../components/sidebar/sidebarPurchase.component";
import { CommonModule, NgFor } from '@angular/common';
import { EmployeeService } from '../../../core/services/Employee.service';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';
declare var bootstrap: any;

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [SidebarPurchaseComponent, CommonModule, NgFor, FormsModule, NgSelectModule],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent {
  userRole: string = 'view';
  // users: any[] = [];
  Employee: any[] = [];// ข้อมูลพนักงานทั้งหมด
  groupedEmployees: { [key: string]: any[] } = {}; // ข้อมูลพนักงานที่จัดกลุ่มตาม Role

  Role: any = [ // ตัวเลือก Role
    { label: 'production', value: 'production' },
    { label: 'purchase', value: 'purchase' },
    { label: 'view', value: 'view' },
    { label: 'admin', value: 'admin' },
    { label: 'engineer', value: 'engineer' },
    { label: 'PC', value: 'PC' },
    { label: 'PC', value: 'PC' }
  ];

  // รับค่าจากแบบฟอร์ม (เพิ่มใหม่)
  Role_: string | null = null;
  EmployeeId_: string = '';
  EmployeeName_: string = '';
  Username_: string = '';
  Password_: string = '';
  Email_: string = '';

  // ====== 🔸 STATE สำหรับแก้ไขแบบ inline ======
  editingId: string | null = null;   // รหัสพนักงานที่กำลังแก้
  editForm: any = {                  // ฟอร์มชั่วคราวตอนแก้
    Employee_ID: '',
    Employee_Name: '',
    Username: '',
    Password: '',
    Role: '',
    Email: ''
  };

  constructor(private EmployeeService: EmployeeService,
    private router: Router,
    private authService: AuthService
  ) { }

  isViewer(): boolean {
    return this.authService.isViewer();
  }


  ngOnInit() {
    this.Get_Employee();
  }
  goPermission() {
    this.router.navigate(['/purchase/permission']);
  }

  //  ดึงข้อมูลพนักงานและจัดกลุ่มตาม Role
  Get_Employee() {
    this.EmployeeService.get_Employee().subscribe({
      next: (response) => {
        this.Employee = response || [];
        this.groupedEmployees = this.groupItemsByRole(this.Employee);
      },
      error: (e) => console.error(e),
    });
  }

  // เพิ่มพนักงาน
  addEmployee() {
    if (!this.EmployeeId_ || !this.EmployeeName_ || !this.Username_ || !this.Password_ || !this.Role_ || !this.Email_) {
      Swal.fire({ icon: 'warning', title: 'Please fill out the information completely' });
      return;
    }

    const employeeData = {
      Employee_ID: this.EmployeeId_,
      Employee_Name: this.EmployeeName_,
      Username: this.Username_,
      Password: this.Password_,
      Role: this.Role_,
      Email: this.Email_
    };

    this.EmployeeService.addEmployee(employeeData).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Complete', text: 'Data has been recorded successfully' });

        //  ปิด modal
        const modalEl = document.getElementById('Insert');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        this.resetForm();
        this.Get_Employee();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.error || 'Unable to save data'
        });
      }
    });
  }


  resetForm() {
    this.Role_ = null;
    this.EmployeeId_ = '';
    this.EmployeeName_ = '';
    this.Username_ = '';
    this.Password_ = '';
    this.Email_ = '';
  }

  //  ลบพนักงาน
  deleteEmployee(empId: string) {
    Swal.fire({
      title: 'Do you want to delete this employee?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.EmployeeService.deleteEmployee(empId).subscribe({
          next: () => {
            Swal.fire('Delete Complete!', 'Employee Information has been Deleted', 'success');
            // อัปเดตหน้าโดยไม่ reload
            this.Employee = this.Employee.filter(e => e.Employee_ID !== empId);
            this.groupedEmployees = this.groupItemsByRole(this.Employee);
          },
          error: (err) => {
            console.error('Unable to delete data:', err);
            Swal.fire('Error', 'Unable to delete data', 'error');
          }
        });
      }
    });
  }

  // ======  เริ่มแก้ไข ======
  startEdit(emp: any) {
    this.editingId = emp.Employee_ID;
    this.editForm = {
      Employee_ID: emp.Employee_ID,
      Employee_Name: emp.Employee_Name,
      Username: emp.Username,
      Password: emp.Password,
      Role: emp.Role,
      Email: emp.Email
    };
  }

  // ======  ยกเลิกแก้ไข ======
  cancelEdit() {
    this.editingId = null;
    this.editForm = {
      Employee_ID: '',
      Employee_Name: '',
      Username: '',
      Password: '',
      Role: '',
      Email: ''
    };
  }

  // ======  บันทึกแก้ไข (อัปเดต backend + อัปเดตหน้า) ======
  saveEdit(originalEmp: any) {
    // validate ง่าย ๆ
    if (!this.editForm.Employee_Name || !this.editForm.Username || !this.editForm.Role || !this.editForm.Email) {
      Swal.fire({ icon: 'warning', title: 'Incomplete Information Filled', text: 'Please fill out the information completely' });
      return;
    }

    this.EmployeeService.updateEmployee(this.editForm).subscribe({
      next: () => {
        // อัปเดตข้อมูลใน this.Employee
        const idx = this.Employee.findIndex(e => e.Employee_ID === originalEmp.Employee_ID);
        if (idx > -1) {
          this.Employee[idx] = { ...this.Employee[idx], ...this.editForm };
        }
        // regroup เผื่อ Role เปลี่ยน
        this.groupedEmployees = this.groupItemsByRole(this.Employee);

        this.cancelEdit();
        Swal.fire({ icon: 'success', title: 'Save Complete', timer: 1200, showConfirmButton: false });
      },
      error: (err) => {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error ' });
      }
    });
  }

  //  จัดกลุ่มพนักงานตาม Role ( แก้บั๊ก)
  groupItemsByRole(items: any[]): { [key: string]: any[] } {
    const grouped: { [key: string]: any[] } = {};
    items.forEach((item) => {
      const roleValue = item.Role || 'Not specified';
      const groupKey = String(roleValue); //  ใช้สตริงปกติ
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(item);
    });
    // (ทางเลือก) เรียงภายในกลุ่มตามชื่อ
    Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => (a.Employee_Name || '').localeCompare(b.Employee_Name || '')));
    return grouped;
  }


}