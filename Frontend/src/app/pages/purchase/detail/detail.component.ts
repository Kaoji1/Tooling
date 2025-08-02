import { Component } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [SidebarPurchaseComponent, RouterOutlet,NotificationComponent,NgSelectModule],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss'
})
export class DetailComponent {

  
}
