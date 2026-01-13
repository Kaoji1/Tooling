import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';

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
  {
    path: 'production',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: { roles: ['production', 'view', 'admin', 'engineer', 'PC'] },
    children: [
      {
        path: 'PCPlan',
        loadComponent: () => import('./pages/PC/PCPlan/PCPlan.component').then(m => m.PCPlanComponent),
        data: { roles: ['PC', 'view', 'admin',] }
      },
      {
        path: 'PlanList',
        loadComponent: () => import('./pages/PC/PlanList/PlanList.component').then(m => m.PlanListComponent),
        data: { roles: ['production', 'PC', 'view', 'admin', 'engineer'] }
      },
      {
        path: 'request',
        loadComponent: () => import('./pages/user/request/request.component').then(m => m.requestComponent),
        data: { roles: ['production', 'PC', 'admin', 'engineer'] }
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/user/cart/cart.component').then(m => m.CartComponent),
        data: { roles: ['production', 'view', 'admin', 'engineer'] }
      },
      {
        path: 'return',
        loadComponent: () => import('./pages/user/return/return.component').then(m => m.ReturnComponent),
        data: { roles: ['production', 'view', 'admin', 'engineer'] }
      },
      {
        path: 'history',
        loadComponent: () => import('./pages/user/history/history.component').then(m => m.HistoryComponent),
        data: { roles: ['production', 'view', 'admin', 'engineer'] }
      },
      {
        path: 'about-us',
        loadComponent: () => import('./pages/user/about-us/about-us.component').then(m => m.AboutUsComponent),
        data: { roles: ['production', 'admin', 'engineer'] }
      },
      {
        path: 'historyprint',
        loadComponent: () => import('./pages/user/history-print/history-print.component').then(m => m.HistoryPrintComponent),
        data: { roles: ['production', 'view', 'admin', 'engineer'] }
      }
    ]
  },

  // Purchase role
  {
    path: 'purchase',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    data: { roles: ['purchase', 'view', 'admin'] },
    children: [
      {
        path: 'detail',
        loadComponent: () => import('./pages/purchase/detail/detail.component').then(m => m.DetailComponent),
        data: { roles: ['purchase', 'view', 'admin'] }
      },
      {
        path: 'requestlist',
        loadComponent: () => import('./pages/purchase/requestlist/requestlist.component').then(m => m.RequestlistComponent),
        data: { roles: ['purchase', 'view', 'admin'] }
      },
      {
        path: 'history-request',
        loadComponent: () => import('./pages/purchase/history-request/history-request.component').then(m => m.HistoryRequestComponent),
        data: { roles: ['purchase', 'view', 'admin'] }
      },
      {
        path: 'add-user',
        loadComponent: () => import('./pages/purchase/add-user/add-user.component').then(m => m.AddUserComponent),
        data: { roles: ['purchase', 'admin'] }
      },
      {
        path: 'permission',
        loadComponent: () => import('./pages/purchase/permission/permission.component').then(m => m.PermissionComponent),
        data: { roles: ['purchase', 'view', 'admin'] }
      },
      {
        path: 'analyze',
        loadComponent: () => import('./pages/purchase/analyze/analyze.component').then(m => m.AnalyzeComponent),
        data: { roles: ['purchase', 'view', 'admin'] }
      },
      {
        path: 'analyzeSmartRack',
        loadComponent: () => import('./pages/purchase/analyzeSmartrack/analyzeSmartrack.component').then(m => m.AnalyzeSmartRackComponent),
        data: { roles: ['purchase', 'view', 'admin'] }
      }
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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }