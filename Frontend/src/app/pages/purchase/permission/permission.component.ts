import { Component, OnInit } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { PermissionService } from '../../../core/services/Permission.service';
import Swal from 'sweetalert2';
declare var bootstrap:any;

@Component({
  selector: 'app-permission',
  standalone: true,
  imports: [
    NgSelectModule,
    FormsModule,
    RouterOutlet,
    CommonModule,
    SidebarPurchaseComponent
  ],
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss']
})
export class PermissionComponent implements OnInit {
  public Employee: any[] = [];      // ข้อมูลพนักงาน
  public loading: boolean = false;
  public error: string = '';

  editingId: string | null = null;  // รหัสพนักงานที่กำลังแก้
  editForm: any = {
    Employee_ID: '',
    Employee_Name: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private perPurchase: PermissionService
  ) {}

  ngOnInit() {
    this.collectEmployeePermission();
  }

  collectEmployeePermission() {
    this.loading = true;
    this.perPurchase.get_Permission().subscribe({
      next: (response: any[]) => {
        // console.log('Raw response from API:', response);
        // ดึงเฉพาะ Employee_ID และ Employee_Name
        this.Employee = response.map(emp => ({
          Employee_ID: emp.Employee_ID,
          Employee_Name: emp.Employee_Name
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'ไม่สามารถโหลดข้อมูลได้';
        this.loading = false;
      }
    });
  }

  startEdit(emp: any) {
    this.editingId = emp.Employee_ID;
    this.editForm = { ...emp };
  }

  saveEdit() {
    if (this.editingId && this.editForm.Employee_Name) {
      const index = this.Employee.findIndex(emp => emp.Employee_ID === this.editingId);
      if (index !== -1) {
        this.Employee[index] = { ...this.editForm };
      }
      this.cancelEdit();
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.editForm = { Employee_ID: '', Employee_Name: '' };
  }

deleteEmployee(Employee_ID: string) {
  if (!Employee_ID) {
    console.error('Cannot delete: invalid Employee ID', Employee_ID);
    return;
  }

  // console.log('Sending Employee_ID to backend for deletion:', Employee_ID);

  this.perPurchase.delete_Permission(Employee_ID).subscribe({
    next: () => {
      // Swal แจ้งเตือนเมื่อ delete สำเร็จ
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: `Employee with ID ${Employee_ID} has been deleted successfully.`,
        confirmButtonText: 'OK'
      });

      this.collectEmployeePermission(); // โหลดข้อมูลใหม่
    },
    error: (err) => {
      console.error('Error deleting:', err);

      // Swal แจ้งเตือนเมื่อเกิด error
      Swal.fire({
        icon: 'error',
        title: 'Deletion Failed',
        text: 'There was an error deleting this employee. Please try again.',
        confirmButtonText: 'OK'
      });
    }
  });
}
newEmployee = { Employee_ID: '', Employee_Name: '' };

submitAddForm() {
  if (!this.newEmployee.Employee_ID || !this.newEmployee.Employee_Name) {
    Swal.fire({
      icon: 'warning',
      title: 'Incomplete Data',
      text: 'Please enter Employee ID and Name.',
      confirmButtonText: 'OK'
    });
    return;
  }

  // console.log('Adding employee permission:', this.newEmployee);

  this.perPurchase.add_Permission({
    Employee_ID: this.newEmployee.Employee_ID,
    Employee_Name: this.newEmployee.Employee_Name
  }).subscribe({
    next: () => {
      Swal.fire({
        icon: 'success',
        title: 'Added!',
        text: `Employee ${this.newEmployee.Employee_Name} has been added successfully.`,
        confirmButtonText: 'OK'
      });
        //  ปิด modal
        const modalEl = document.getElementById('Insert');
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
      this.collectEmployeePermission();
      this.newEmployee = { Employee_ID: '', Employee_Name: '' };
    },
    error: (err) => {
      console.error('Error adding:', err);

      Swal.fire({
        icon: 'error',
        title: 'Addition Failed',
        text: 'There was an error adding this employee. Please try again.',
        confirmButtonText: 'OK'
      });
    }
  });
}

}
//  deleteEmployee(id: string) {
//   this.perPurchase.delete_Permission(id).subscribe({
//     next: () => {
//       this.Employee = this.Employee.filter(emp => emp.Employee_ID !== id);
//       console.log('Deleted Employee ID:', id);
//     },
//     error: (err) => {
//       console.error('Error deleting:', err);
//     }
//   });
// }

