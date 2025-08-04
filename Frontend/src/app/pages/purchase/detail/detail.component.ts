import { Component, OnInit } from '@angular/core';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';


@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [SidebarPurchaseComponent, RouterOutlet,NotificationComponent,NgSelectModule],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss'
})

export class DetailComponent implements OnInit {
  request:any[]=[];

  itemNo!: string;
  displayIndex!: number;
  items: any[] = [];


  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';

    const navigation = this.router.getCurrentNavigation();
    this.items = navigation?.extras?.state?.['items'] || [];

    const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
    this.displayIndex = index >= 0 ? index + 1 : -1;
  }
  
}
// export class DetailComponent implements OnInit{
//   itemNo!: string;
//   displayIndex!: number;
  
//   items: any[] = [];


//   constructor(private route: ActivatedRoute) {}

//   ngOnInit(): void {
//     this.itemNo = this.route.snapshot.paramMap.get('itemNo') || '';

//   const index = this.items.findIndex(item => item.ItemNo === this.itemNo);
//     this.displayIndex = index >= 0 ? index + 1 : -1;
// }

// 
