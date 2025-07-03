import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthServices } from '../../service/auth.services';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterOutlet,CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

   username = '';
  password = '';
  errorMessage = '';

  constructor(private auth: AuthServices, private router: Router) {}

  onLogin() {
    const success = this.auth.login(this.username, this.password);
    if (success) {
      const role = this.auth.getRole();
      if (role === 'role1') {
        this.router.navigate(['/home']);
      } else if (role === 'role2') {
        this.router.navigate(['/requestlist']);
      }
    } else {
      this.errorMessage = 'Invalid username or password';
    }
  }

  togglePasswordVisibility() {
    const pwdInput = document.getElementById('passwordinput') as HTMLInputElement;
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
    } else {
      pwdInput.type = 'password';
    }
  }

  // โชว์passwordเมื่อกดckebox
      ngAfterViewInit(): void {
    const checkbox = document.getElementById('showpwd') as HTMLInputElement;
    const passwordInput = document.getElementById('passwordinput') as HTMLInputElement;
    if (checkbox && passwordInput) {
      checkbox.addEventListener('change', () => {
        passwordInput.type = checkbox.checked ? 'text' : 'password';
      });
    }
  }

}
