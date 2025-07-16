// import { Injectable } from '@angular/core';
// import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
// import { AuthServices } from '../service/auth.services';

// @Injectable({
//   providedIn: 'root'
// })
// export class RoleGuard implements CanActivate {
//   constructor(
//     private authService: AuthServices,
//     private router: Router
//   ) {}

//   canActivate(route: ActivatedRouteSnapshot): boolean {
//     const requiredRole = route.data['role'] as string;
//     const userRole = this.authService.getUserRole();

//     if (userRole === requiredRole) {
//       return true;
//     }

//     // Redirect to appropriate page based on user role
//     if (userRole === 'user') {
//       this.router.navigate(['/user/request']);
//     } else if (userRole === 'purchase') {
//       this.router.navigate(['/purchase/requests']);
//     } else {
//       this.router.navigate(['/login']);
//     }

//     return false;
//   }
// }
