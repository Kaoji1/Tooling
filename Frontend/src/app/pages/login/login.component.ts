import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { LoginService } from '../../core/services/Login.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, NgClass, NgFor],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  Username: string = '';
  Password: string = '';
  errorMessage: string = '';
  showPassword: boolean = false;

  // Split text for interactive SVG
  brandChars = "MinebeaMitsumi".split('');
  subtitleChars = "Web Application For Request & Return Indirect Material".split('');

  constructor(private router: Router, private LoginService: LoginService) { }

  onLogin() {
    const credentials = { Username: this.Username, Password: this.Password };

    this.LoginService.login(credentials).subscribe({
      next: (res) => {
        // console.log('Login response:', res);

        if (res.token && res.user?.Role) {
          // เก็บ token และ role ไว้ใน sessionStorage
          sessionStorage.setItem('token', res.token);
          sessionStorage.setItem('role', res.user.Role); // <-- เพิ่ม role สำหรับ AuthGuard
          sessionStorage.setItem('user', JSON.stringify(res.user));

          // Redirect ตาม role
          switch (res.user.Role) {
            case 'view':
              // Existing logic for 'view' role (Cost is handled below as specific role if needed, or mapped here)
              this.router.navigate(['/production/PlanList']);
              break;

            case 'Cost': // Explicit Cost role
              this.router.navigate(['/production/PlanList']);
              break;

            case 'production':
              this.router.navigate(['/production/request']);
              break;
            case 'engineer':
              this.router.navigate(['/production/PlanList']);
              break;

            case 'purchase':
              this.router.navigate(['/purchase/PlanList']);
              break;

            case 'PC':
              this.router.navigate(['/production/PCPlan']);
              break;

            case 'QC':
            case 'Gage':
              this.router.navigate(['/production/PlanList']);
              break;

            case 'admin':
              this.router.navigate(['/purchase/detail']);
              window.open('/production/request', '_blank');   // ตัวอย่างเปิดหน้าอื่นพร้อมกัน
              break;
            default:
              this.errorMessage = 'User access denied'; // Or redirect to a generic page like PlanList?
            // this.router.navigate(['/production/PlanList']); 
          }
        } else {
          this.errorMessage = 'Invalid login response';
        }
      },
      error: (err) => {
        this.errorMessage = 'Username or Password Invalid, please try again';
        console.error('Login error:', err);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
// console.log()