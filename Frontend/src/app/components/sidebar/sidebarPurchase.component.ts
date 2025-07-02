import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebarPurchase.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  constructor(private router: Router) { }

  logout() {
    this.router.navigate(['/login']);
  }
 imagePath = 'assets/images/1.png';
}
