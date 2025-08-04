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

    const credentials = {Username: this.Username, Password: this.Password};
    this.LoginService.login(credentials).subscribe({
      next: (res) => {

        // // Keep token from backend
        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('user', JSON.stringify(res.user));

        console.log('Login response:', res);
        // ถ้าเข้าสู่ระบบสำเร็จ ให้เปลี่ยนเส้นทางไปยังหน้า dashboard
        if (res.user.Role === 'production') {
          this.router.navigate(['/production/request']);
        }

        else if (res.user.Role === 'purchase') {
          this.router.navigate(['/purchase/requestlist']);
        }

        else {
          this.errorMessage = 'User access deny';
        }
      },
      error: (err) => {
        // ถ้าเกิดข้อผิดพลาดในการเข้าสู่ระบบ แสดงข้อความผิดพลาด
        this.errorMessage = 'Username or Password Invalid please try again';
      }
    });
  }
  togglePasswordVisibility() {
    const input = document.getElementById('passwordinput') as HTMLInputElement;
    input.type = input.type === 'Password' ? 'text' : 'Password';
  }
}

console.log()
