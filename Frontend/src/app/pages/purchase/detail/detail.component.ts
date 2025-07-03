import { Component } from '@angular/core';
import { SidebarPurchaseComponent } from '../../components/sidebar/sidebarPurchase.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [SidebarPurchaseComponent,RouterOutlet],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss'
})
export class DetailComponent {

}
