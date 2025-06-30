import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CartComponent } from './pages/cart/cart.component';
import { HistoryComponent } from './pages/history/history.component';

export const routes: Routes = [
    
    {path: 'home', component: HomeComponent},
    {path: 'cart', component: CartComponent},
    {path: 'history' ,component: HistoryComponent }

    
];
