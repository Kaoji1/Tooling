import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NOTIFICATION_TEMPLATES, getTemplate } from '../utils/notification-templates';

export interface NotificationLog {
  Notification_ID?: number;
  Event_Type: string;
  Subject?: string;          // NEW: Pre-built subject line
  Message: string;           // EN message body
  Message_TH?: string;       // NEW: Thai message body
  Doc_No?: string;
  Action_By?: string;        // NEW: Who triggered the action
  Target_Roles?: string;     // NEW: comma-separated roles or 'ALL'
  CTA_Route?: string;        // NEW: Frontend route for CTA button
  Created_At: Date;
  IsRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private socket!: Socket;

  // State Management
  private notificationsSubject = new BehaviorSubject<NotificationLog[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private currentUserRole: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    // Connect to Backend Socket.IO only in Browser
    if (isPlatformBrowser(this.platformId)) {
      // Read role from sessionStorage
      try {
        const userSession = sessionStorage.getItem('user');
        if (userSession) {
          const user = JSON.parse(userSession);
          this.currentUserRole = (user.Role || '').toLowerCase();
        }
      } catch (e) {
        console.error('Error reading user role for notifications:', e);
      }

      this.socket = io(environment.socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5
      });
      this.setupSocketListeners();
      this.fetchNotifications();
    }
  }

  // Fetch initial history from DB (with role filtering)
  public fetchNotifications() {
    const roleParam = this.currentUserRole ? `?role=${this.currentUserRole}` : '';
    this.http.get<NotificationLog[]>(`${environment.apiUrl}/notifications/list${roleParam}`)
      .subscribe({
        next: (data) => {
          this.notificationsSubject.next(data);
          this.updateUnreadCount();
        },
        error: (err) => console.error('Failed to fetch notifications:', err)
      });
  }

  // Allow components to manually add notifications (Fallback/Local feedback)
  public addManualNotification(message: string, type: string = 'INFO') {
    const tmpl = getTemplate(type);
    const newNotif: NotificationLog = {
      Event_Type: type,
      Subject: tmpl?.subject || type,
      Message: message,
      Message_TH: '',
      Created_At: new Date(),
      IsRead: false
    };
    this.addNotification(newNotif);
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Notification Server:', this.socket.id);
    });

    this.socket.on('notification', (data: any) => {
      console.log('New Notification Received:', data);

      // Role-based filtering on the client side
      const targetRoles = (data.targetRoles || 'ALL').toLowerCase();
      if (targetRoles !== 'all' && this.currentUserRole) {
        const rolesArray = targetRoles.split(',').map((r: string) => r.trim());
        if (!rolesArray.includes(this.currentUserRole) && this.currentUserRole !== 'admin') {
          console.log('Notification filtered out: not for role', this.currentUserRole);
          return; // Skip – not relevant to this user
        }
      }

      const newNotif: NotificationLog = {
        Notification_ID: data.id,
        Event_Type: data.type,
        Subject: data.subject || '',
        Message: data.message,
        Message_TH: data.messageTH || '',
        Doc_No: data.docNo,
        Action_By: data.actionBy || '',
        Target_Roles: data.targetRoles || 'ALL',
        CTA_Route: data.ctaRoute || '',
        Created_At: new Date(data.timestamp || new Date()),
        IsRead: false
      };

      this.addNotification(newNotif);
      this.playNotificationSound();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Notification Server');
    });
  }

  private addNotification(notification: NotificationLog) {
    const current = this.notificationsSubject.value;
    // Add to top, keep max 50
    const updated = [notification, ...current].slice(0, 50);
    this.notificationsSubject.next(updated);
    this.updateUnreadCount();
  }

  private updateUnreadCount() {
    const count = this.notificationsSubject.value.filter(n => !n.IsRead).length;
    this.unreadCountSubject.next(count);
  }

  public markAsRead(id: number) {
    // Optimistic Update
    const current = this.notificationsSubject.value.map(n =>
      n.Notification_ID === id ? { ...n, IsRead: true } : n
    );
    this.notificationsSubject.next(current);
    this.updateUnreadCount();

    // API Call
    this.http.put(`${environment.apiUrl}/notifications/read/${id}`, {}).subscribe({
      error: (err) => console.error('Failed to mark as read:', err)
    });
  }

  // Mark all (Persistent)
  public markAllRead() {
    // Optimistic Update
    const current = this.notificationsSubject.value.map(n => ({ ...n, IsRead: true }));
    this.notificationsSubject.next(current);
    this.updateUnreadCount();

    // API Call
    this.http.put(`${environment.apiUrl}/notifications/mark-all-read`, {}).subscribe({
      next: (res) => console.log('All notifications marked as read in DB'),
      error: (err) => console.error('Failed to mark all as read:', err)
    });
  }

  public getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  private playNotificationSound() {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...");
    } catch (error) {
      console.error('Sound error', error);
    }
  }
}
