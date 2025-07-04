import { Injectable } from '@angular/core';

@Injectable ({
    providedIn: 'root'
})

export class CartService {
    private cartItems: any[] = [];

    setCartItems(items:any[]) {
        this.cartItems = items;
    }
    getCartItem() {
        return this.cartItems;
    }
    clearCart() {
        this.cartItems = [];
    }
}