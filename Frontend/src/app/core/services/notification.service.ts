import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Connect to Backend Socket.IO only in Browser
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io('http://localhost:3000');
      this.setupSocketListeners();
    }
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

  public markAsRead() {
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
