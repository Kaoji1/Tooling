import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { CartComponent } from './pages/cart/cart.component';
import { HistoryComponent } from './pages/history/history.component';
 


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink,HomeComponent,CartComponent,HistoryComponent],
  // imports: [RouterOutlet, LoginComponent],

  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Frontend';
}
