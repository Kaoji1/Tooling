import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NotificationService, NotificationLog } from '../../../core/services/notification.service';
import { Observable, map } from 'rxjs';

@Component({
    selector: 'app-notification-inbox',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notification-inbox.component.html',
    styleUrls: ['./notification-inbox.component.scss']
})
export class NotificationInboxComponent implements OnInit {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    notifications$: Observable<NotificationLog[]>;
    unreadCount$: Observable<number>;

    filter: 'all' | 'unread' | 'priority' = 'all';

    constructor(private notificationService: NotificationService) {
        this.notifications$ = this.notificationService.notifications$;
        this.unreadCount$ = this.notificationService.unreadCount$;
    }

    ngOnInit(): void { }

    get filteredNotifications$() {
        return this.notifications$.pipe(
            map(notifications => {
                if (!notifications) return [];
                if (this.filter === 'unread') {
                    return notifications.filter(n => !n.IsRead);
                }
                if (this.filter === 'priority') {
                    return notifications.filter(n => n.Event_Type === 'CANCEL_PLAN' || n.Event_Type === 'URGENT' || n.Event_Type === 'UPDATE_PLAN');
                }
                return notifications;
            })
        );
    }

    setFilter(filter: 'all' | 'unread' | 'priority') {
        this.filter = filter;
    }

    closeModal() {
        this.close.emit();
    }

    markAsRead(id?: number) {
        if (id) {
            this.notificationService.markAsRead(id);
        }
    }

    markAllAsRead() {
        this.notificationService.markAllRead();
    }

    stopPropagation(event: Event) {
        event.stopPropagation();
    }
}
