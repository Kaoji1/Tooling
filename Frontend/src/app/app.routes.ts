import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CartComponent } from './pages/cart/cart.component';
import { HistoryComponent } from './pages/history/history.component';
import { RequestlistComponent } from './pages/requestlist/requestlist.component';
import { DetailComponent } from './pages/detail/detail.component';

export const routes: Routes = [

    // User Group Page
    // {path: '', redirectTo: 'home', pathMatch: 'full'},
    // {path: 'home', component: HomeComponent},
    // {path: 'cart', component: CartComponent},
    // {path: 'history', component: HistoryComponent},

    // Purchase Group Page
    {path: '', redirectTo: 'requestlist', pathMatch: 'full'},
    {path: 'requestlist', component: RequestlistComponent},
    {path: 'detail', component: DetailComponent}

];
