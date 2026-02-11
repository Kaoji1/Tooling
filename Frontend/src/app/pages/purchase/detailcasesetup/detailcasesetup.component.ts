import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';

@Component({
    selector: 'app-detailcasesetup',
    standalone: true,
    imports: [CommonModule, SidebarPurchaseComponent], // Import Shared Modules
    templateUrl: './detailcasesetup.component.html',
    styleUrls: ['./detailcasesetup.component.scss']
})
export class DetailCaseSetupComponent implements OnInit {

    constructor() { }

    ngOnInit() {
    }

}
