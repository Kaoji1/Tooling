import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component'; // ปรับ path ตามจริง
import { DropdownSearchComponent } from './components/dropdown-search/dropdown-search.component';
import { SidebarPurchaseComponent } from './components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from './components/notification/notification.component';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, DropdownSearchComponent, SidebarPurchaseComponent, NotificationComponent],
  templateUrl: './app.component.html',
})

export class AppComponent {
  title = 'Frontend';
  showNotification = true;
  isLoginPage = true;
  isProductionRoute = false;
  isPurchaseRoute = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;

      this.isLoginPage = url.includes('/login') || url === '/';
      this.isProductionRoute = url.includes('/production');
      this.isPurchaseRoute = url.includes('/purchase');

      this.showNotification = !this.isLoginPage;
    });

    // --- Cross-Tab Logout Synchronization ---
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('storage', (event) => {
        // Check if the 'logout-event' key was modified
        if (event.key === 'logout-event') {
          // Verify if session should really be cleared (e.g., token is gone)
          // But 'logout-event' is a specific signal, so we trust it.

          // Clear current tab's session
          sessionStorage.clear();
          // localStorage.clear(); // Ensure consistency

          // Try to close the tab if it's a secondary one (popup)
          if (window.opener) {
            window.close();
          }

          // Redirect to login if not already there (and window didn't close)
          if (!this.isLoginPage) {
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        }
      });
    }
  }
}
