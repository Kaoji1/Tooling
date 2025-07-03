import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';

// User pages
import { HomeComponent } from './pages/user/home/home.component';
import { CartComponent } from './pages/user/cart/cart.component';
import { HistoryComponent } from './pages/user/history/history.component';

// Purchase pages
import { RequestlistComponent } from './pages/purchase/requestlist/requestlist.component';
import { DetailComponent } from './pages/purchase/detail/detail.component';
import { HistoryRequestComponent } from './pages/purchase/history-request/history-request.component';

import {AuthGuard } from './guards/auth.guard';

export const routes: Routes = [

  {path: '',redirectTo: 'login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},

  // User Group Page
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {path: 'cart', component: CartComponent},
  {path: 'history', component: HistoryComponent},

  // Purchase Group Page
  {path: '', redirectTo: 'requestlist', pathMatch: 'full'},
  {path: 'requestlist', component: RequestlistComponent},
  {path: 'detail', component: DetailComponent},
  {path: 'history-request', component: HistoryRequestComponent},

];
