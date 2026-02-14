import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotificationService, NotificationLog } from '../../core/services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  isOpen = false;
  unreadCount$: Observable<number>;
  notifications$: Observable<NotificationLog[]>;

  constructor(
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit(): void { }

  togglePanel() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // When opening, we might want to mark as read, or wait for user to click individual items
      // For now, let's keep them unread until user clicks "Mark all as read" or similar
    }
  }

  markAllRead() {
    this.notificationService.markAsRead();
  }

  // Close when clicking outside
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
