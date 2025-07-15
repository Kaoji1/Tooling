import { Component } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-requestlist',
  standalone: true,
  imports: [RouterOutlet, SidebarPurchaseComponent],
  templateUrl: './requestlist.component.html',
  styleUrl: './requestlist.component.scss'
})
export class RequestlistComponent {

  
}
