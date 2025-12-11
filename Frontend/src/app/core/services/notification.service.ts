import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class notificationService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // URL Backend
  }

  sendNotification(data: any) {
    this.socket.emit('sendNotification', data);
  }

  onNotification(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('receiveNotification', (data) => observer.next(data));
    });
  }
}
