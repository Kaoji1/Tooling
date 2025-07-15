import { Component } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-history-request',
  standalone: true,
  imports: [SidebarPurchaseComponent,RouterOutlet,NotificationComponent],
  templateUrl: './history-request.component.html',
  styleUrl: './history-request.component.scss'
})
export class HistoryRequestComponent {

}
