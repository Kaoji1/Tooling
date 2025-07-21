import { Component } from '@angular/core';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { DropdownSearchComponent } from '../../../components/dropdown-search/dropdown-search.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { NgForOf } from '@angular/common';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, DropdownSearchComponent, NotificationComponent, NgForOf,CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent {

  docs: any[] = [];
  docNo: string = '';
  items: any[] = [];

  ngOnInit() {
    const docData = sessionStorage.getItem('created_doc');
    if (docData) {
      const parsed = JSON.parse(docData);
      this.docs = parsed.docs || [];
      this.docNo = parsed.doc_no;
      this.items = parsed.items;
    }
  }

}
