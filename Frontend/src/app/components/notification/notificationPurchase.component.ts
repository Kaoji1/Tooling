import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { notificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notificationpurchase',
  standalone: true,
  imports: [RouterModule, CommonModule, ],
  templateUrl: './notificationPurchase.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationPurchaseComponent implements OnInit {
  isOpen = false;
  notifications: any[] = [];

  constructor(private notificationservice: notificationService) {}

  ngOnInit() {
    // รับ notification แบบ realtime จาก server
    this.notificationservice.onNotification().subscribe((data) => {
      this.notifications.unshift(data); // เพิ่ม notification ใหม่ด้านบน
    });
  }

  toggleNotification() {
    this.isOpen = !this.isOpen;
  }

  // สำหรับทดสอบ ส่ง notification ไป server
  sendTestNotification() {
    this.notificationservice.sendNotification({ message: 'Hello from Purchase!' });
  }
}
