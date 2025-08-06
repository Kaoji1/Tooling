import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component'; // ปรับ path ตามจริง
import { DropdownSearchComponent } from './components/dropdown-search/dropdown-search.component';
import { SidebarPurchaseComponent } from './components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from './components/notification/notification.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, DropdownSearchComponent, SidebarPurchaseComponent, NotificationComponent],
  templateUrl: './app.component.html',
})

export class AppComponent {
  title = 'Frontend';
}
