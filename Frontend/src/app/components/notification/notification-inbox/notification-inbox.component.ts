import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService, NotificationLog } from '../../../core/services/notification.service';
import { NOTIFICATION_TEMPLATES, getTemplate } from '../../../core/utils/notification-templates';
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

    /** Global language toggle — controls ALL notification bodies */
    lang: 'EN' | 'TH' = 'EN';

    /** Accordion: ID of the currently expanded notification (null = all collapsed) */
    expandedId: number | null = null;

    constructor(
        private notificationService: NotificationService,
        private router: Router
    ) {
        this.notifications$ = this.notificationService.notifications$;
        this.unreadCount$ = this.notificationService.unreadCount$;
    }

    ngOnInit(): void { }

    // ─── Filtering ─────────────────────────────────────────────

    get filteredNotifications$() {
        return this.notifications$.pipe(
            map(notifications => {
                if (!notifications) return [];
                if (this.filter === 'unread') {
                    return notifications.filter(n => !n.IsRead);
                }
                if (this.filter === 'priority') {
                    return notifications.filter(n =>
                        n.Event_Type === 'REQUEST_SENT' ||
                        n.Event_Type === 'RETURN_SENT' ||
                        n.Event_Type === 'CANCEL_PLAN'
                    );
                }
                return notifications;
            })
        );
    }

    setFilter(filter: 'all' | 'unread' | 'priority') {
        this.filter = filter;
    }

    // ─── Global Language Toggle ────────────────────────────────

    toggleLang() {
        this.lang = this.lang === 'EN' ? 'TH' : 'EN';
    }

    // ─── Accordion Toggle ──────────────────────────────────────

    toggleExpand(item: NotificationLog) {
        if (this.expandedId === item.Notification_ID) {
            // Collapse if already open
            this.expandedId = null;
        } else {
            this.expandedId = item.Notification_ID ?? null;
            // Auto mark as read
            if (!item.IsRead && item.Notification_ID) {
                this.notificationService.markAsRead(item.Notification_ID);
                item.IsRead = true;
            }
        }
    }

    isExpanded(item: NotificationLog): boolean {
        return this.expandedId === item.Notification_ID;
    }

    // ─── Actions ───────────────────────────────────────────────

    closeModal() {
        this.expandedId = null;
        this.close.emit();
    }

    markAllAsRead() {
        this.notificationService.markAllRead();
    }

    navigateCTA(item: NotificationLog) {
        const route = this.getCTARoute(item);
        this.closeModal();
        this.router.navigateByUrl(route);
    }

    // ─── Display Helpers (with proper interpolation) ──────────

    /**
     * Build the subject line with variables interpolated from the DB payload.
     * The backend now stores the fully-built subject with real values,
     * so we prefer item.Subject directly. Fallback to template if empty.
     */
    getSubject(item: NotificationLog): string {
        if (item.Subject) return item.Subject;
        const tmpl = getTemplate(item.Event_Type);
        if (!tmpl) return item.Event_Type;
        // Fallback: interpolate from template with available vars
        return this._interpolate(tmpl.subject, this._buildVars(item));
    }

    /**
     * Get the message body in the current language.
     * Backend stores pre-built EN/TH messages with real values already interpolated.
     * We just pick the correct language.
     */
    getBody(item: NotificationLog): string {
        if (this.lang === 'TH') {
            return item.Message_TH || item.Message || '';
        }
        return item.Message || '';
    }

    getIconClass(eventType: string): string {
        const tmpl = getTemplate(eventType);
        return tmpl?.iconClass || 'bi-info-circle';
    }

    getBadgeColor(eventType: string): string {
        const tmpl = getTemplate(eventType);
        return tmpl?.badgeColor || '#64748b';
    }

    getEventLabel(eventType: string): string {
        const labels: Record<string, string> = {
            'REQUEST_SENT': 'New Request',
            'REQUEST_COMPLETED': 'Request Completed',
            'NEW_PLAN': 'New Plan',
            'NEW_REQUEST': 'New Request',
            'PLAN_REVISION': 'Plan Revision',
            'CANCEL_PLAN': 'Plan Cancelled',
            'UPDATE_PLAN': 'Document Attached',
            'RETURN_SENT': 'Return Pending',
            'RETURN_COMPLETED': 'Return Confirmed',
            'FILE_UPLOAD': 'File Uploaded'
        };
        return labels[eventType] || eventType;
    }

    getCTALabel(item: NotificationLog): string {
        const tmpl = getTemplate(item.Event_Type);
        return tmpl?.ctaLabel || 'View Details';
    }

    getCTARoute(item: NotificationLog): string {
        return item.CTA_Route || getTemplate(item.Event_Type)?.ctaRoute || '/';
    }

    formatDate(date: Date | string): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        }) + ' · ' + d.toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit'
        });
    }

    stopPropagation(event: Event) {
        event.stopPropagation();
    }

    // ─── Private Helpers ───────────────────────────────────────

    /** Replace [Key] placeholders with real values */
    private _interpolate(template: string, vars: Record<string, string>): string {
        return template.replace(/\[(\w+)\]/g, (_, key) => vars[key] ?? `[${key}]`);
    }

    /** Extract available variables from a notification payload */
    private _buildVars(item: NotificationLog): Record<string, string> {
        return {
            Plan_No: item.Doc_No || '',
            User_Name: item.Action_By || 'System',
            Item_Count: ''
        };
    }
}
