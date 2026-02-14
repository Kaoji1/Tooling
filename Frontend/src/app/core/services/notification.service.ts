import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface NotificationLog {
  Notification_ID?: number;
  Event_Type: string;
  Message: string;
  Doc_No?: string;
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

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    // Connect to Backend Socket.IO only in Browser
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io(environment.socketUrl, {
        transports: ['websocket', 'polling'], // Allow both
        reconnection: true,
        reconnectionAttempts: 5
      });
      this.setupSocketListeners();
      this.fetchNotifications(); // Load history on init
    }
  }

  // Fetch initial history from DB
  public fetchNotifications() {
    this.http.get<NotificationLog[]>(`${environment.apiUrl}/notifications/list`)
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
    const newNotif: NotificationLog = {
      Event_Type: type,
      Message: message,
      Created_At: new Date(),
      IsRead: false
    };
    this.addNotification(newNotif);
    this.playNotificationSound(); // Optional: Play sound for manual too
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Notification Server:', this.socket.id);
    });

    this.socket.on('notification', (data: any) => {
      console.log('New Notification Received:', data);

      const newNotif: NotificationLog = {
        Event_Type: data.type,
        Message: data.message,
        Doc_No: data.docNo,
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

  // Mark all (local only for now, or loop API if needed - usually rarely used if popup is one by one)
  public markAllReadLocal() {
    const current = this.notificationsSubject.value.map(n => ({ ...n, IsRead: true }));
    this.notificationsSubject.next(current);
    this.updateUnreadCount();
  }

  public getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  private playNotificationSound() {
    try {
      // Simple beep using base64 to avoid file dependency for now
      // This is a short "ding" sound
      const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...");
      // Note: Browser policy might block auto-play without user interaction first.
      // We will try to rely on the "Beautiful Bell" visual for now as primary.
    } catch (error) {
      console.error('Sound error', error);
    }
  }
}
