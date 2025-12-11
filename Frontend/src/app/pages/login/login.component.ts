import { Component } from '@angular/core';
import { Router} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { LoginService } from '../../core/services/Login.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  Username: string = '';
  Password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private LoginService: LoginService) {}

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
              this.router.navigate(['/production/cart']); // view เข้าได้เฉพาะหน้านี้
              window.open('/purchase/detail', '_blank');
              break;

            case 'production':
              this.router.navigate(['/production/request']);
              break;
              case 'engineer':
              this.router.navigate(['/production/request']);
              break;

            case 'purchase':
              this.router.navigate(['/purchase/detail']);
              break;

            case 'admin':
              this.router.navigate(['/purchase/detail']);
              window.open('/production/request', '_blank');   // ตัวอย่างเปิดหน้าอื่นพร้อมกัน
              break;
            default:
              this.errorMessage = 'User access denied';
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

  togglePasswordVisibility() { // แสดงรหัสผ่าน
    const input = document.getElementById('passwordinput') as HTMLInputElement;
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}
// console.log()