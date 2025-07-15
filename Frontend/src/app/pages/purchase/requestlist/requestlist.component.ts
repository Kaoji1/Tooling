import { Component } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-requestlist',
  standalone: true,
  imports: [RouterOutlet, SidebarPurchaseComponent,NotificationComponent],
  templateUrl: './requestlist.component.html',
  styleUrl: './requestlist.component.scss'
})
export class RequestlistComponent {

}
