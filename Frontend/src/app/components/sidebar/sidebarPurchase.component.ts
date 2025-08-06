import { Component ,OnInit} from '@angular/core';
import { Router } from '@angular/router';
import {RouterModule} from '@angular/router';
import { CommonModule } from '@angular/common';  // <-- เพิ่มตรงนี้


@Component({
  selector: 'app-sidebarpurchase',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebarPurchase.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarPurchaseComponent implements OnInit {
  Employee_Name: any; // เพิ่ม implements OnInit
  constructor(private router: Router,
  ) {}

  imagePath = 'assets/images/1.png';

 ngOnInit(): void {
    const userData = sessionStorage.getItem('purchase');
    if (userData) {
      const user = JSON.parse(userData);
      this.Employee_Name = user.Employee_Name || 'name'; // ← ใช้ชื่อที่มาจาก DB
    }
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
