import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component'; // ปรับ path ตามจริง
import { DropdownSearchComponent } from './components/dropdown-search/dropdown-search.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent,DropdownSearchComponent],
  templateUrl: './app.component.html',
})

export class AppComponent {
  title = 'Frontend';
}
