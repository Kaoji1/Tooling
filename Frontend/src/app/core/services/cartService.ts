import { inject, Injectable } from "@angular/core";

@Injectable ({
    providedIn: 'root'
})
export class cartService {
    private storageKey = 'cart_item';
    setCartItem(items: any[]){
        localStorage.setItem(this.storageKey,JSON.stringify(items));
    }
    getcartItems(item: any[]) {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }
    clearCart(){
        localStorage.removeItem(this.storageKey);
    }
}