import { Component } from '@angular/core';
import { SidebarPurchaseComponent } from "../../../components/sidebar/sidebarPurchase.component";
import { CommonModule, NgFor } from '@angular/common';
import { EmployeeService } from '../../../core/services/Employee.service';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

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

  // รับค่าจากแบบฟอร์ม
  Role_: string = '';
  EmployeeId_: string = '';
  EmployeeName_: string = '';
  Username_: string = '';
  Password_: string = '';
  Email_: string = '';

  constructor(private EmployeeService: EmployeeService) {}

  ngOnInit() {
    this.Get_Employee();
  }

  // ✅ ดึงข้อมูลพนักงานและจัดกลุ่มตาม Role
  Get_Employee() {
    this.EmployeeService.get_Employee().subscribe({
      next: (response) => {
        this.Employee = response;
        this.groupedEmployees = this.groupItemsByRole(response); // 🔁 จัดกลุ่มที่นี่
      },
      error: (e) => console.error(e),
    });
  }

  // ✅ เพิ่มพนักงาน
  addEmployee() {
    if (!this.EmployeeId_ || !this.EmployeeName_ || !this.Username_ || !this.Password_ || !this.Role_ || !this.Email_) {
      Swal.fire({
        icon: 'warning',
        title: 'กรอกข้อมูลไม่ครบ',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก',
        confirmButtonText: 'ตกลง'
      });
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

    console.log('📤 ข้อมูลที่จะส่งไป backend:', employeeData);

    this.EmployeeService.addEmployee(employeeData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'บันทึกข้อมูลพนักงานเรียบร้อยแล้ว',
          confirmButtonText: 'ตกลง'
        });

        // ล้างฟอร์ม
        this.EmployeeId_ = '';
        this.EmployeeName_ = '';
        this.Username_ = '';
        this.Password_ = '';
        this.Role_ = '';
        this.Email_ = '';

        // โหลดข้อมูลใหม่
        this.Get_Employee();
      },
      error: (err) => {
        console.error('❌ เกิดข้อผิดพลาด:', err);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่',
          confirmButtonText: 'ตกลง'
        });
      }
    });
  }

  // ✅ ลบพนักงาน
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
            this.Get_Employee(); // โหลดใหม่
          },
          error: (err) => {
            console.error('ลบไม่สำเร็จ:', err);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
          }
        });
      }
    });
  }

  // ✅ จัดกลุ่มพนักงานตาม Role
  groupItemsByRole(items: any[]): { [key: string]: any[] } {
    const grouped: { [key: string]: any[] } = {};

    items.forEach((item) => {
      const Role = item.Role || 'ไม่ระบุ';
      const groupKey = `${Role}`; // ใช้ backtick ให้ถูก

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item); // push รายการเข้าในกลุ่ม
    });

    return grouped;
  }
}