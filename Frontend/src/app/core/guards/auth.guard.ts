import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = sessionStorage.getItem('token');  // หรือใช้ localStorage ถ้าเก็บไว้ที่นั่น
    console.log(' AuthGuard token:', token);

    if (token) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }

  canActivateChild(): boolean {
    return this.canActivate(); // ใช้ logic เดียวกัน
  }
}


