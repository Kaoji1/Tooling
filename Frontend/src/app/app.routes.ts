import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';


// User pages
import { requestComponent } from './pages/user/request/request.component';
import { CartComponent } from './pages/user/cart/cart.component';
import { HistoryComponent } from './pages/user/history/history.component';
import { AboutUsComponent } from './pages/user/about-us/about-us.component';

// Purchase pages
import { RequestlistComponent } from './pages/purchase/requestlist/requestlist.component';
import { DetailComponent } from './pages/purchase/detail/detail.component';
import { HistoryRequestComponent } from './pages/purchase/history-request/history-request.component';
import { pathToFileURL } from 'url';


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

  // {
  //   path: 'production/request',
  //   component: requestComponent
  //   // canActivate: [AuthGuard]
  // },
  // {
  //   path: 'purchase/requestlist',
  //   component: RequestlistComponent
  //   // canActivate: [AuthGuard]
  // },

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
      { path: 'detail', component: DetailComponent },
      { path: 'history-request', component: HistoryRequestComponent }
    ],
  },

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

  // { path: '**', redirectTo: 'login' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
