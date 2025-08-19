import { Component } from '@angular/core';
import { SidebarPurchaseComponent } from "../../../components/sidebar/sidebarPurchase.component";
import { CommonModule, NgFor } from '@angular/common';
import { EmployeeService } from '../../../core/services/Employee.service';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
declare var bootstrap:any;

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [SidebarPurchaseComponent, CommonModule, NgFor, FormsModule, NgSelectModule],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss'
})
export class AddUserComponent {
  // ข้อมูลพนักงานทั้งหมด
  Employee: any[] = [];

  // ข้อมูลพนักงานที่จัดกลุ่มตาม Role
  groupedEmployees: { [key: string]: any[] } = {};

  // ตัวเลือก Role
  Role: any = [
    { label: 'production', value: 'production' },
    { label: 'purchase', value: 'purchase' }
  ];

  // รับค่าจากแบบฟอร์ม (เพิ่มใหม่)
  Role_:string | null = null;
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

  constructor(private EmployeeService: EmployeeService) {}

  ngOnInit() {
    this.Get_Employee();
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
      Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ' });
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
        Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกข้อมูลเรียบร้อยแล้ว' });

        //  ปิด modal
        const modalEl = document.getElementById('Insert');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();

        this.resetForm();
        this.Get_Employee();
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: 'ไม่สามารถบันทึกข้อมูลได้' });
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
      title: 'แน่ใจหรือไม่?',
      text: 'คุณต้องการลบพนักงานคนนี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.EmployeeService.deleteEmployee(empId).subscribe({
          next: () => {
            Swal.fire('ลบแล้ว!', 'ข้อมูลพนักงานถูกลบเรียบร้อย', 'success');
            // อัปเดตหน้าโดยไม่ reload
            this.Employee = this.Employee.filter(e => e.Employee_ID !== empId);
            this.groupedEmployees = this.groupItemsByRole(this.Employee);
          },
          error: (err) => {
            console.error('ลบไม่สำเร็จ:', err);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
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
      Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'กรุณากรอกข้อมูลให้ครบ' });
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
        Swal.fire({ icon: 'success', title: 'บันทึกแล้ว', timer: 1200, showConfirmButton: false });
      },
      error: (err) => {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ' });
      }
    });
  }

  //  จัดกลุ่มพนักงานตาม Role ( แก้บั๊ก)
  groupItemsByRole(items: any[]): { [key: string]: any[] } {
    const grouped: { [key: string]: any[] } = {};
    items.forEach((item) => {
      const roleValue = item.Role || 'ไม่ระบุ';
      const groupKey = String(roleValue); //  ใช้สตริงปกติ
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(item);
    });
    // (ทางเลือก) เรียงภายในกลุ่มตามชื่อ
    Object.keys(grouped).forEach(k => grouped[k].sort((a,b) => (a.Employee_Name||'').localeCompare(b.Employee_Name||'')));
    return grouped;
  }
}