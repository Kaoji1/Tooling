import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';

// User pages
import { HomeComponent } from './pages/user/home/home.component';
import { CartComponent } from './pages/user/cart/cart.component';
import { HistoryComponent } from './pages/user/history/history.component';

// Purchase pages
import { RequestlistComponent } from './pages/purchase/requestlist/requestlist.component';
import { DetailComponent } from './pages/purchase/detail/detail.component';
import { HistoryRequestComponent } from './pages/purchase/history-request/history-request.component';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

  {path: '',redirectTo: 'login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},

  // User Group Page
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent, canActivate: [authGuard], data: {role: 'user'}},
  {path: 'cart', component: CartComponent, canActivate: [authGuard], data: {role: 'user'}},
  {path: 'history', component: HistoryComponent, canActivate: [authGuard], data: {role: 'user'}},

  // Purchase Group Page
  {path: '', redirectTo: 'requestlist', pathMatch: 'full'},
  {path: 'requestlist', component: RequestlistComponent, canActivate: [authGuard], data: {role: 'purchase'}},
  {path: 'detail', component: DetailComponent, canActivate: [authGuard], data: {role: 'purchase'}},
  {path: 'history-request', component: HistoryRequestComponent, canActivate: [authGuard], data: {role: 'purchase'}},

  // Redirect old dashboard routes to new home pages
  { path: 'user-dashboard', redirectTo: '/user-home', pathMatch: 'full' },
  { path: 'purchase-dashboard', redirectTo: '/purchase-home', pathMatch: 'full' },

  // Catch all
  { path: '**', redirectTo: '/login' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
