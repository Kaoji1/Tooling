import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';

// User pages
import { requestComponent } from './pages/user/request/request.component';
import { CartComponent } from './pages/user/cart/cart.component';
import { HistoryComponent } from './pages/user/history/history.component';
import { AboutUsComponent } from './pages/user/about-us/about-us.component';
import { HistoryPrintComponent } from './pages/user/history-print/history-print.component';

// Purchase pages
import { RequestlistComponent } from './pages/purchase/requestlist/requestlist.component';
import { DetailComponent } from './pages/purchase/detail/detail.component';
import { HistoryRequestComponent } from './pages/purchase/history-request/history-request.component';
import { pathToFileURL } from 'url';
import { AddUserComponent } from './pages/purchase/add-user/add-user.component';
import { AnalyzeComponent } from './pages/purchase/analyze/analyze.component';
import { AnalyzeSmartRackComponent } from './pages/purchase/analyzeSmartrack/analyzeSmartrack.component';
import { PermissionComponent } from './pages/purchase/permission/permission.component';



export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },


  // Production role
// {
//   path: 'production',
//   canActivate: [AuthGuard],
//   canActivateChild: [AuthGuard], // <--- เพิ่มอันนี้ถ้ามี child routes
//   children: [
//     { path: 'request', component: requestComponent },
//     { path: 'cart', component: CartComponent },
//     { path: 'history', component: HistoryComponent },
//     { path: 'about-us', component: AboutUsComponent }
//   ]
// },

{
  path: 'production',
  canActivate: [AuthGuard],
  canActivateChild: [AuthGuard],
  data: { roles: ['production', 'view', 'admin','engineer'] }, // view เข้าได้แค่ child ที่กำหนด
  children: [
    { path: 'request', component: requestComponent, data: { roles: ['production', 'admin','engineer'] } },
    { path: 'cart', component: CartComponent, data: { roles: ['production', 'view', 'admin','engineer'] } }, // <-- view เข้าได้เฉพาะหน้านี้
    { path: 'history', component: HistoryComponent, data: { roles: ['production', 'view', 'admin','engineer'] } },
    { path: 'about-us', component: AboutUsComponent, data: { roles: ['production', 'admin','engineer'] } },
    { path: 'historyprint', component: HistoryPrintComponent, data: { roles: ['production', 'view','admin','engineer'] } }
  ]
},

  // Purchase role
  {
    path: 'purchase',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
      data: { roles: ['purchase', 'view', 'admin'] }, // view เข้าได้แค่ child ที่กำหนด
    children: [
      { path: 'detail', component: DetailComponent,data: { roles: ['purchase', 'view', 'admin'] } },
      { path: 'requestlist', component: RequestlistComponent,data: { roles: ['purchase', 'view', 'admin'] } },
      { path: 'history-request', component: HistoryRequestComponent,data: { roles: ['purchase', 'view', 'admin'] } },
      { path: 'add-user', component: AddUserComponent,data: { roles: ['purchase', 'admin'] } },
      { path: 'permission', component: PermissionComponent,data: { roles: ['purchase', 'view', 'admin'] } },
      { path: 'analyze', component: AnalyzeComponent,data: { roles: ['purchase', 'view', 'admin'] } },
     
      { path: 'analyzeSmartRack', component: AnalyzeSmartRackComponent,data: {roles: ['purchase', 'view', 'admin']}}
    ],
  },

    // Production role
// {
//   path: 'view',
//   canActivate: [AuthGuard],
//   canActivateChild: [AuthGuard],
//   children: [
//     { path: 'cart', component: CartComponent },
//     { path: 'history', component: HistoryComponent }
//   ]
// },

  // {
  //   path: 'Admin',
  //   canActivate: [AuthGuard],
  //   canActivateChild: [AuthGuard],
  //   children: [
  //     { path: 'request', component: requestComponent },
  //     { path: 'cart', component: CartComponent },
  //     { path: 'history', component: HistoryComponent },
  //     { path: 'about-us', component: AboutUsComponent },
  //     { path: 'requestlist', component: RequestlistComponent },
  //     { path: 'detail/:itemNo', component: DetailComponent },
  //     { path: 'history-request', component: HistoryRequestComponent },
  //     { path: 'add-user', component: AddUserComponent },
  //     { path: 'permission', component: PermissionComponent },
  //     { path: 'analyze', component: AnalyzeComponent }
  //   ],
  // },

  {
    path: 'user-dashboard',
    redirectTo: 'production',
    pathMatch: 'full'
  },
  {
    path: 'purchase-dashboard',
    redirectTo: 'purchase',
    pathMatch: 'full'
  },


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }