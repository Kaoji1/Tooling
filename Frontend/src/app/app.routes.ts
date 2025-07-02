import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CartComponent } from './pages/cart/cart.component';
import { HistoryComponent } from './pages/history/history.component';
import { RequestlistComponent } from './pages/requestlist/requestlist.component';

export const routes: Routes = [

    {path: '',redirectTo:'home',pathMatch:'full'},
    {path: 'home', component: HomeComponent},
    {path: 'cart', component: CartComponent},
    {path: 'history' ,component: HistoryComponent },
    {path: 'requestlist' ,component: RequestlistComponent },


];
