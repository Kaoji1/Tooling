import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'

})
export class NotificationComponent {
  isOpen = false;

  notifications = Array.from({ length: 99 }).map((_, i) => ({
    id: i + 1,
    message: `ข้อความแจ้งเตือน ${i + 1}`
    
  }));

  toggleNotification() {
    this.isOpen = !this.isOpen;
  }
}
