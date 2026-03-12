import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NOTIFICATION_TEMPLATES, getTemplate } from '../utils/notification-templates';

export interface NotificationLog {
  Notification_ID?: number;
  Event_Type: string;
  Subject?: string;
  Message: string;
  Message_TH?: string;
  Doc_No?: string;
  Action_By?: string;
  Target_Roles?: string;
  CTA_Route?: string;
  Details_JSON?: any;         // NEW: Dynamic payload (parsed JSON)
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

  // Trash State
  private trashSubject = new BehaviorSubject<NotificationLog[]>([]);
  public trash$ = this.trashSubject.asObservable();

  private currentUserRole: string = '';
  private currentUserName: string = '';  // Employee_ID or Name โ€” used to suppress self-notifications
  private currentEmployeeId: number | null = null;  // ID_Employee INT โ€” for per-user state SP calls

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private zone: NgZone
  ) {
    // Connect to Backend Socket.IO only in Browser
    if (isPlatformBrowser(this.platformId)) {
      // Read role and username from sessionStorage
      try {
        const userSession = sessionStorage.getItem('user');
        if (userSession) {
          const user = JSON.parse(userSession);
          this.currentUserRole = (user.Role || user.role || '').toLowerCase().trim();
          this.currentUserName = (user.Username || user.username || user.Employee_ID || user.Employee_Name || user.Name || '').toLowerCase().trim();
          const rawEmpId = parseInt(user.ID_Employee, 10);
          this.currentEmployeeId = !isNaN(rawEmpId) ? rawEmpId : null;
        }
      } catch (e) {
        console.error('Error reading user session for notifications:', e);
      }

      // Wrap socket connection outside Angular to prevent Hydration Timeout (NG0506)
      this.zone.runOutsideAngular(() => {
        this.socket = io(environment.socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 30000, //0.5min
        });
        this.setupSocketListeners();
      });

      this.fetchNotifications(); // Initial load of notifications   
    }
  }

  // Reloads notifications and role config on successful SPA login
  public refreshSession() {
    if (isPlatformBrowser(this.platformId)) {
      // Clear old state immediately so user doesn't see old notifications during loading
      this.notificationsSubject.next([]);
      this.unreadCountSubject.next(0);

      try {
        const userSession = sessionStorage.getItem('user');
        if (userSession) {
          const user = JSON.parse(userSession);
          this.currentUserRole = (user.Role || user.role || '').toLowerCase().trim();
          this.currentUserName = (user.Username || user.username || user.Employee_ID || user.Employee_Name || user.Name || '').toLowerCase().trim();
          const rawEmpId2 = parseInt(user.ID_Employee, 10);
          this.currentEmployeeId = !isNaN(rawEmpId2) ? rawEmpId2 : null;
        }
      } catch (e) {
        console.error('Error reading user role for notifications:', e);
      }
      this.fetchNotifications();
    }
  }

  // Clear state on logout
  public logout() {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.trashSubject.next([]);
    this.currentUserRole = '';
    this.currentUserName = '';
    this.currentEmployeeId = null;
  }

  /** Build HTTP headers that identify the current user for per-user state SPs */
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    // Double-safety: check both null AND isNaN to prevent 'NaN' string header
    if (this.currentUserName) {
      headers = headers.set('x-username', this.currentUserName);
    }
    if (this.currentUserRole) {
      headers = headers.set('x-role', this.currentUserRole);
    }
    return headers;
  }

  // Fetch initial history from DB (with role filtering)
  public fetchNotifications() {
    const roleParam = this.currentUserRole ? `?role=${this.currentUserRole}` : '';
    this.http.get<NotificationLog[]>(`${environment.apiUrl}/notifications/list${roleParam}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          // ── Self-exclusion: filter out notifications triggered by the current user ──
          // Mirrors the same suppression applied to real-time socket events (see setupSocketListeners).
          const filtered = this.currentUserName
            ? data.filter(n => {
              const sender = (n.Action_By || '').toLowerCase().trim();
              return sender !== this.currentUserName;
            })
            : data;

          this.notificationsSubject.next(filtered);
          this.updateUnreadCount();
        },
        error: (err) => console.error('Failed to fetch notifications:', err)
      });
  }

  // Fetch trash from DB
  public fetchTrash() {
    const roleParam = this.currentUserRole ? `?role=${this.currentUserRole}` : '';
    this.http.get<NotificationLog[]>(`${environment.apiUrl}/notifications/trash${roleParam}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => this.trashSubject.next(data),
        error: (err) => console.error('Failed to fetch trash:', err)
      });
  }

  // Soft-delete all read notifications -> move to trash
  public deleteRead(): Observable<any> {
    return this.http.put(`${environment.apiUrl}/notifications/delete-read`, {}, { headers: this.getAuthHeaders() }).pipe(
      tap(() => {
        const remaining = this.notificationsSubject.value.filter(n => !n.IsRead);
        this.notificationsSubject.next(remaining);
        this.updateUnreadCount();
        this.fetchTrash();
      })
    );
  }

  // Restore a single notification from trash back to inbox
  public restoreFromTrash(id: number): Observable<any> {
    return this.http.put(`${environment.apiUrl}/notifications/restore/${id}`, {}, { headers: this.getAuthHeaders() }).pipe(
      tap(() => {
        const updated = this.trashSubject.value.filter(n => n.Notification_ID !== id);
        this.trashSubject.next(updated);
        this.fetchNotifications();
      })
    );
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
    this.playNotificationSound();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Notification Server:', this.socket.id);
    });

    this.socket.on('notification', (data: any) => {
      this.zone.run(() => {
        console.log('New Notification Received:', data);

        // โ”€โ”€ 1. Sender-exclusion: never show notification to the user who triggered it โ”€โ”€
        if (data.excludeUsername) {
          const excludedId = String(data.excludeUsername).toLowerCase().trim();
          const currentIdStr = this.currentEmployeeId ? String(this.currentEmployeeId).toLowerCase() : '';
          const currentNameStr = this.currentUserName ? this.currentUserName.toLowerCase().trim() : '';

          if (excludedId === currentIdStr || excludedId === currentNameStr) {
            console.log('[Notification] Suppressed: excludeUsername matched current user');
            return;
          }
        } else if (this.currentUserName && data.actionBy) {
          const senderName = (data.actionBy as string).toLowerCase().trim();
          if (senderName === this.currentUserName) {
            console.log('[Notification] Suppressed: triggered by self (' + senderName + ')');
            return;
          }
        }

        // โ”€โ”€ 2. Role-based filtering on the client side โ”€โ”€
        const targetRoles = (data.targetRoles || 'ALL').toLowerCase();
        if (targetRoles !== 'all' && this.currentUserRole) {
          const rolesArray = targetRoles.split(',').map((r: string) => r.trim());
          if (!rolesArray.includes(this.currentUserRole) && this.currentUserRole !== 'admin') {
            console.log('Notification filtered out: not for role', this.currentUserRole);
            return; // Skip โ€“ not relevant to this user
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
          Details_JSON: data.detailsJson || null,
          Created_At: new Date(data.timestamp || new Date()),
          IsRead: false
        };

        this.addNotification(newNotif);
        this.playNotificationSound();
      });
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
    this.http.put(`${environment.apiUrl}/notifications/read/${id}`, {}, { headers: this.getAuthHeaders() }).subscribe({
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
    this.http.put(`${environment.apiUrl}/notifications/mark-all-read`, {}, { headers: this.getAuthHeaders() }).subscribe({
      next: (res) => console.log('All notifications marked as read in DB'),
      error: (err) => console.error('Failed to mark all as read:', err)
    });
  }

  public getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  /**
   * Plays a clean 2-note ascending chime (C5 โ’ E5) using Web Audio API.
   * Inspired by Line notification โ€” soft, clear, and distinctive.
   */
  private playNotificationSound() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // Soft attack + exponential fade-out
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(523.25, now, 0.25);        // C5 โ€” first note
      playTone(659.25, now + 0.15, 0.35); // E5 โ€” second note (slightly overlapping)

    } catch (error) {
      console.error('Notification sound error:', error);
    }
  }
}
