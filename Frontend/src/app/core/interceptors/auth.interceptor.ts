import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let headersConfig: any = {};

    if (isPlatformBrowser(this.platformId)) {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        headersConfig['Authorization'] = `Bearer ${token}`;
      }

      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const username = user.Employee_ID || user.Name || user.username;
          if (username) {
            headersConfig['x-username'] = username;
          }
          if (user.Role) {
            headersConfig['x-role'] = user.Role;
          }
        } catch (e) {
          console.error('Error parsing user data in interceptor', e);
        }
      }
    }

    if (Object.keys(headersConfig).length > 0) {
      const cloned = req.clone({
        setHeaders: headersConfig
      });
      return next.handle(cloned);
    }
    return next.handle(req);
  }
}
