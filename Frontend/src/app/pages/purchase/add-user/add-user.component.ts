import { Component } from '@angular/core';
import { SidebarPurchaseComponent } from "../../../components/sidebar/sidebarPurchase.component";
import { CommonModule, NgFor } from '@angular/common';
import { EmployeeService } from '../../../core/services/Employee.service';
// import { NotificationComponent } from "../../../components/notification/notification.component';
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
  // ข้อมูลพนักงาน
  Employee: any[] = [];
  Role :any
  // รับค่าจากฟอร์มใน Modal
  Role_: string = '';
  EmployeeId_: string = '';
  EmployeeName_: string = '';
  Username_: string = '';
  Password_: string = '';

  constructor(private EmployeeService: EmployeeService) {
    this.Role = [
      { label: 'production', value: 'production' }, 
      { label: 'purchase', value: 'purchase' } 
    ]
  }

  ngOnInit() {
    this.Get_Employee();
  }

  Get_Employee() {
    this.EmployeeService.get_Employee().subscribe({
      next: (response) => {
        this.Employee = response;
      },
      error: (e) => console.error(e),
    });
  }

  addEmployee() {
    //  ตรวจสอบว่ากรอกครบ
    if (
      !this.EmployeeId_ || !this.EmployeeName_ || !this.Username_ || !this.Password_ || !this.Role_
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'กรอกข้อมูลไม่ครบ',
        text: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    //  เตรียมข้อมูลที่ส่งไป backend
    const employeeData = {
      Employee_ID: this.EmployeeId_,
      Employee_Name: this.EmployeeName_,
      Username: this.Username_,
      Password: this.Password_,
      Role: this.Role_
    };

    //  ส่งไปผ่าน Service
    this.EmployeeService.addEmployee(employeeData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'บันทึกข้อมูลพนักงานเรียบร้อยแล้ว',
          confirmButtonText: 'ตกลง'
        });
        //  ล้างข้อมูลฟอร์ม
        this.EmployeeId_ = '';
        this.EmployeeName_ = '';
        this.Username_ = '';
        this.Password_ = '';
        this.Role_ = '';

        // โหลดรายชื่อพนักงานใหม่
        this.Get_Employee();
      },
      error: (err) => {
        console.error('เกิดข้อผิดพลาด:', err);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่',
          confirmButtonText: 'ตกลง'
        });
      }
    });
  }
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
          this.Get_Employee(); //  โหลดใหม่
        },
        error: (err) => {
          console.error('ลบไม่สำเร็จ:', err);
          Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
        }
      });
    }
  });
}
}