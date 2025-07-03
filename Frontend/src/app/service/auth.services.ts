// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { USER } from '../mock-user';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthServices {
  currentUser: any = null;

  constructor(private router: Router) {}

  login(username: string, password: string): boolean {
    const user = USER.find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    return false;
  }

  getRole(): string {
    return this.currentUser?.role || JSON.parse(localStorage.getItem('user') || '{}')?.role;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }
}
