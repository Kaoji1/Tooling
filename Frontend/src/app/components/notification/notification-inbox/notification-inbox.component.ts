import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService, NotificationLog } from '../../../core/services/notification.service';
import { FileUploadSerice } from '../../../core/services/FileUpload.service';
import { NOTIFICATION_TEMPLATES, getTemplate, getFieldLabel } from '../../../core/utils/notification-templates';
import { Observable, map } from 'rxjs';
import Swal from 'sweetalert2';

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

    filter: 'PMC' | 'GM' = 'PMC';

    /** Which top-level view is active */
    view: 'inbox' | 'trash' = 'inbox';

    /** Trash observable from service */
    trash$: Observable<NotificationLog[]>;

    /** Global language toggle — controls ALL notification bodies */
    lang: 'EN' | 'TH' = 'EN';

    /** Accordion: ID of the currently expanded notification (null = all collapsed) */
    expandedId: number | null = null;

    constructor(
        private notificationService: NotificationService,
        private fileUploadService: FileUploadSerice,
        private router: Router
    ) {
        this.notifications$ = this.notificationService.notifications$;
        this.unreadCount$ = this.notificationService.unreadCount$;
        this.trash$ = this.notificationService.trash$;
    }

    ngOnInit(): void { }

    closeModal() {
        this.close.emit();
    }

    switchToInbox() {
        this.view = 'inbox';
        // When switching back to main inbox, optionally reset filter to PMC or leave as is
    }

    switchToTrash() {
        this.view = 'trash';
    }

    // ─── File Utilities ──────────────────────────────────────────

    /** Proxy file opening via backend (handles network paths) */
    openFile(filePath: string) {
        if (!filePath || filePath === '-') {
            Swal.fire('Error', 'File path not found', 'error');
            return;
        }

        // Clean path (remove quotes if any)
        const cleanPath = filePath.replace(/^"|"$/g, '');

        this.fileUploadService.loadPdfFromPath(cleanPath).subscribe({
            next: (res) => {
                const base64 = res.imageData.split(',')[1];
                const binary = atob(base64);
                const len = binary.length;
                const bytes = new Uint8Array(len);

                for (let i = 0; i < len; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }

                const blob = new Blob([bytes], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);

                window.open(blobUrl, '_blank');
            },
            error: (err) => {
                console.error('File load error:', err);
                Swal.fire('Error', 'Unable to load file. It might be missing or inaccessible.', 'error');
            }
        });
    }

    // ─── Filtering ─────────────────────────────────────────────

    get filteredNotifications$() {
        return this.notifications$.pipe(
            map(notifications => {
                if (!notifications) return [];
                const currentUser = localStorage.getItem('username') || '';
                return notifications.filter(n => {
                    // Suppress self-notifications
                    if (n.Action_By && n.Action_By.toLowerCase() === currentUser.toLowerCase()) {
                        return false;
                    }
                    // Filter by Division Tab
                    const div = this.getNotificationDivision(n);
                    if (div === 'UNKNOWN') return this.filter === 'PMC'; // Fallback to PMC tab
                    return div === this.filter;
                });
            })
        );
    }

    /** Trash items filtered by the current active PMC/GM tab.
     *  UNKNOWN-division items default to PMC to avoid appearing in both tabs. */
    get filteredTrash$() {
        return this.trash$.pipe(
            map(items => {
                if (!items) return [];
                return items.filter(n => {
                    const div = this.getNotificationDivision(n);
                    // Strict match only — UNKNOWN items default to PMC tab
                    const effective = div === 'UNKNOWN' ? 'PMC' : div;
                    return effective === this.filter;
                });
            })
        );
    }

    setFilter(filter: 'PMC' | 'GM') {
        this.filter = filter;
    }

    getNotificationDivision(item: NotificationLog): 'PMC' | 'GM' | 'UNKNOWN' {
        const details = this.parseDetails(item);

        // 1. From Details_JSON top-level (Explicitly added in Backend update)
        if (details?.Division) {
            const div = details.Division.toString().toUpperCase();
            if (div === 'PMC' || div === '2' || div === '71DZ') return 'PMC';
            if (div === 'GM' || div === '3' || div === '7122') return 'GM';
        }

        // 2. From old payloads parsing (e.g. from itemSummaries)
        if (details?.itemSummaries?.length > 0) {
            const div = details.itemSummaries[0].Division;
            if (div) {
                const strDiv = div.toString().toUpperCase();
                if (strDiv === 'PMC' || strDiv === '2' || strDiv === '71DZ') return 'PMC';
                if (strDiv === 'GM' || strDiv === '3' || strDiv === '7122') return 'GM';
            }
        }

        // 3. Fallback to doc number inferences (case-insensitive)
        if (item.Doc_No) {
            const doc = item.Doc_No.toUpperCase();
            if (doc.includes('PLAN-2') || doc.includes('71DZ')) return 'PMC';
            if (doc.includes('PLAN-3') || doc.includes('7122')) return 'GM';
        }

        return 'UNKNOWN';
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
            // Expand newly clicked item and mark as read
            this.expandedId = item.Notification_ID ?? null;
            if (!item.IsRead && item.Notification_ID) {
                this.notificationService.markAsRead(item.Notification_ID);
            }
        }
    }

    isExpanded(item: NotificationLog): boolean {
        return this.expandedId === item.Notification_ID;
    }

    // ─── Top-Level Actions ─────────────────────────────────────

    markAllAsRead() {
        this.notificationService.markAllRead();
    }

    // Inbox: Move all read to trash
    deleteAllRead() {
        this.notificationService.deleteRead().subscribe({
            next: (res) => {
                if (res.deletedCount > 0) {
                    Swal.fire({
                        title: this.lang === 'TH' ? 'ย้ายลงถังขยะ' : 'Moved to Trash',
                        text: this.lang === 'TH' ? `ย้ายข้อความที่อ่านแล้ว ${res.deletedCount} รายการลงถังขยะ` : `Moved ${res.deletedCount} read notifications to trash.`,
                        icon: 'success',
                        toast: true,
                        position: 'bottom-end',
                        timer: 3000,
                        showConfirmButton: false
                    });
                }
            }
        });
    }

    // Trash: Restore single item
    restoreItem(id?: number) {
        if (!id) return;
        this.notificationService.restoreFromTrash(id).subscribe({
            next: () => {
                Swal.fire({
                    title: this.lang === 'TH' ? 'กู้คืนสำเร็จ' : 'Restored',
                    text: this.lang === 'TH' ? 'ข้อความถูกกู้คืนไปยังกล่องข้อความแล้ว' : 'Notification restored to inbox.',
                    icon: 'success',
                    toast: true,
                    position: 'bottom-end',
                    timer: 3000,
                    showConfirmButton: false
                });
            }
        });
    }

    navigateCTA(item: NotificationLog) {
        const route = this.getCTARoute(item);
        if (route) {
            this.router.navigateByUrl(route);
            this.close.emit();
        }
    }

    // ─── Display Formatting ────────────────────────────────────

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
        return this._interpolate(tmpl.subject, {
            Plan_No: item.Doc_No || '',
            User_Name: item.Action_By || 'System',
            Item_Count: ''
        });
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

    getEventLabel(item: NotificationLog): string {
        const eventType = item.Event_Type;
        const labels: Record<string, string> = {
            'REQUEST_SENT': 'New Request',
            'REQUEST_COMPLETED': 'Request Completed',
            'NEW_PLAN': 'New Plan',
            'NEW_REQUEST': 'New Request',
            'PLAN_REVISION': 'Plan Revision',
            'CANCEL_PLAN': 'Plan Cancelled',
            'UPDATE_PLAN': 'Document Attached',  // fallback only
            'RETURN_SENT': 'Return Pending',
            'RETURN_COMPLETED': 'Return Confirmed',
            'FILE_UPLOAD': 'File Uploaded'
        };

        if (eventType === 'PLAN_REVISION' && item.Subject) {
            // Extract "Edit Date, QTY" from "🔵 [FYI] Edit Date, QTY - Part No...."
            const match = item.Subject.match(/\]\s*(.*?)(?:\s*-|$)/);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        if (eventType === 'UPDATE_PLAN' && item.Subject) {
            // Extract dynamic attachment title from Subject, e.g.:
            //   "🔵 [FYI] Drawing Attached"   → "Drawing Attached"
            //   "🔵 [FYI] Layout Attached"    → "Layout Attached"
            //   "🔵 [FYI] Drawing & Layout Attached" → "Drawing & Layout Attached"
            //   "🔵 [FYI] IIQC Attached"     → "IIQC Attached"
            const match = item.Subject.match(/\]\s*(.*)/);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

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

        let d: Date;
        if (typeof date === 'string') {
            // Strip 'Z' because the backend mssql driver stringifies local time as UTC.
            // Removing 'Z' forces the browser to interpret the time as local instead of offsetting it.
            d = new Date(date.replace('Z', ''));
        } else {
            d = new Date(date);
        }

        return d.toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }) + ' ' + d.toLocaleTimeString('en-GB', {
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

    // ─── Details JSON Dynamic Rendering ──────────────────────

    /** Fields to hide from the detailed view (internal/redundant) */
    private SKIP_FIELDS = new Set([
        'GroupId', 'Revision', 'PlanStatus', 'Division', 'Employee_ID',
        'Path_Dwg', 'Path_Layout', 'Path_IIQC'
    ]);

    /** Parse Details_JSON (may be a string from DB or an object from socket) */
    parseDetails(item: NotificationLog): any {
        if (!item.Details_JSON) return null;
        if (typeof item.Details_JSON === 'string') {
            try {
                item.Details_JSON = JSON.parse(item.Details_JSON);
            } catch {
                return null;
            }
        }
        console.log(`[parseDetails] Notification ID ${item.Notification_ID}:`, item.Details_JSON);
        return item.Details_JSON;
    }

    /** Get the detail type: 'new_plan', 'revision', 'cancel', or null */
    getDetailType(item: NotificationLog): string | null {
        const d = this.parseDetails(item);
        return d?.type || null;
    }

    /** For NEW_PLAN: get the items array */
    getDetailItems(item: NotificationLog): any[] {
        const d = this.parseDetails(item);
        return d?.items || [];
    }

    /** For PLAN_REVISION: get the changes array [{field, old, new}] */
    getDetailChanges(item: NotificationLog): any[] {
        const d = this.parseDetails(item);
        return d?.changes || [];
    }

    /** Get display keys for item grid (filters out internal fields and empty values) */
    getItemKeys(row: any): string[] {
        if (!row) return [];
        return Object.keys(row).filter(k => k !== 'Division' && k !== 'Facility' && !this.SKIP_FIELDS.has(k));
    }

    /** Translate a DB field name to a readable label using the current lang */
    fieldLabel(field: string): string {
        return getFieldLabel(field, this.lang);
    }

    /** Format specific field values for display (e.g., Dates) */
    formatFieldValue(field: string, value: any): any {
        if (!value) return value;
        if (field === 'PlanDate' || field === 'Return_Date' || field === 'date') {
            const strValue = String(value);
            // Convert YYYY-MM-DD (or YYYY-MM-DDTHH:mm:SSZ) to DD/MM/YYYY
            if (/^\d{4}-\d{2}-\d{2}/.test(strValue)) {
                const datePart = strValue.split('T')[0];
                const parts = datePart.split('-');
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }
        }
        return value;
    }

    /** Extract metadata blocks like Plan Date, Part No, Division from JSON payload */
    getMetaValue(item: NotificationLog, key: 'PlanDate' | 'PartNo' | 'Division' | 'Facility'): string | null {
        const d = this.parseDetails(item);
        if (!d) return null;

        let val = null;
        if (d.type === 'revision' && d.newValues) {
            val = d.newValues[key];
        } else if ((d.type === 'new_plan' || d.type === 'cancel' || d.type === 'new_request') && d.items && d.items.length > 0) {
            val = d.items[0][key];
        } else if (d.type === 'update_plan') {
            val = d[key];
        }

        if (val) {
            return key === 'PlanDate' ? this.formatFieldValue('PlanDate', val) : val;
        }
        return null;
    }

    /** Check if a details payload has content worth showing */
    hasDetails(item: NotificationLog): boolean {
        const d = this.parseDetails(item);
        if (!d) return false;
        if (d.type === 'revision' && d.changes?.length > 0) return true;
        if (d.type === 'new_plan' && d.items?.length > 0) return true;
        if (d.type === 'cancel' && d.items?.length > 0) return true;
        if (d.type === 'new_request' && d.items?.length > 0) return true;
        if (d.type === 'update_plan' && d.AttachedFiles?.length > 0) return true;
        return false;
    }
}
