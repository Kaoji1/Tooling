import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet,CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  data = [
    {
      partNo: 'P001',
      itemNo: 'I001',
      spec: 'Spec A',
      process: 'Cutting',
      machineType: 'Type A',
      machineNo: 'M01',
      qty: 10,
      inputDate: '2025-07-01',
      dueDate: '2025-07-10',
      status: 'Pending',
      selected: false
    },
    {
      partNo: 'P002',
      itemNo: 'I002',
      spec: 'Spec B',
      process: 'Welding',
      machineType: 'Type B',
      machineNo: 'M02',
      qty: 5,
      inputDate: '2025-07-01',
      dueDate: '2025-07-12',
      status: 'Complete',
      selected: false
    }
  ];

  toggleAll(event: any) {
    const isChecked = event.target.checked;
    this.data.forEach(row => (row.selected = isChecked));
  }
  
}
