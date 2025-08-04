import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './auth/auth.guard';

// User pages
import { requestComponent } from './pages/user/request/request.component';
import { CartComponent } from './pages/user/cart/cart.component';
import { HistoryComponent } from './pages/user/history/history.component';
import { AboutUsComponent } from './pages/user/about-us/about-us.component';

// Purchase pages
import { RequestlistComponent } from './pages/purchase/requestlist/requestlist.component';
import { DetailComponent } from './pages/purchase/detail/detail.component';
import { HistoryRequestComponent } from './pages/purchase/history-request/history-request.component';
import path from 'path';

// import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [

  {
    path: 'production/request',
    component: requestComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'purchase/requestlist',
    component: RequestlistComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },


  // Production role
  {
    path: 'production',
    children: [
      { path: 'request', component: requestComponent },
      { path: 'cart', component: CartComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'about-us', component: AboutUsComponent }
    ],
  },

  // Purchase role
  {
    path: 'purchase',
    children: [
      { path: 'requestlist', component: RequestlistComponent },
      // { path: 'detail', component: DetailComponent },
      { path: 'detail/:itemNo', component: DetailComponent },
      { path: 'history-request', component: HistoryRequestComponent }
    ],
  },

  { path: 'user-dashboard', redirectTo: 'production/request', pathMatch: 'full' },
  { path: 'purchase-dashboard', redirectTo: 'purchase/requestlist', pathMatch: 'full' },

  { path: '**', redirectTo: 'login' }




  // {path: '',redirectTo: 'login', pathMatch: 'full'},
  // {path: 'login', component: LoginComponent},

  // // User Group Page
  // {path: '', redirectTo: 'request', pathMatch: 'full'},
  // {path: 'request', component: requestComponent},
  // {path: 'cart', component: CartComponent},
  // {path: 'history', component: HistoryComponent},
  // {path: 'about-us', component: AboutUsComponent},

  // // Purchase Group Page
  // {path: '', redirectTo: 'requestlist', pathMatch: 'full'},
  // {path: 'requestlist', component: RequestlistComponent},
  // {path: 'detail', component: DetailComponent},
  // {path: 'history-request', component: HistoryRequestComponent},

  // // Redirect old dashboard routes to new request pages
  // { path: 'user-dashboard', redirectTo: '/user-request', pathMatch: 'full' },
  // { path: 'purchase-dashboard', redirectTo: '/purchase-request', pathMatch: 'full' },

  // // Catch all
  // { path: '**', redirectTo: '/login' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
