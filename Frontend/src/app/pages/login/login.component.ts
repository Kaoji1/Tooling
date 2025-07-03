import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

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
