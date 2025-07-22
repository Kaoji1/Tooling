// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
// import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { NgSelectModule } from '@ng-select/ng-select';
// import { NotificationComponent } from '../../../components/notification/notification.component';
// import { RequestService } from '../../../core/services/request.service';
// import { Subject, takeUntil } from 'rxjs';

// // Interfaces for better type safety
// interface DropdownOption {
//   label: string;
//   value: string;
// }

// interface CaseOtherOption {
//   Case: string;
//   viewCase: string;
// }

// interface CartItem {
//   Doc_no: string | null;
//   Division: string | null;
//   Factory: string | null;
//   Date_of_Req: string | null;
//   Item_no: number;
//   Part_no: string;
//   Process: string;
//   MC_type: string;
//   Spec: string;
//   Usage: number;
//   MC_no: string | null;
//   Qty: number | null;
//   Status: string | null;
//   Set_by: string | null;
//   Local: number;
//   checked?: boolean;
//   Case?: string;
//   Caseother?: string | null;
//   qty?: number | null;
//   machineNoother?: string | null;
// }

// @Component({
//   selector: 'app-request',
//   standalone: true,
//   imports: [
//     SidebarComponent,
//     RouterOutlet,
//     CommonModule,
//     FormsModule,
//     NgSelectModule,
//     NotificationComponent,
//   ],
//   templateUrl: './request.component.html',
//   styleUrl: './request.component.scss',
// })
// export class RequestComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   // Selected dropdown values
//   selectedDiv: DropdownOption | null = null;
//   selectedFac: DropdownOption | null = null;
//   selectedCase: DropdownOption | null = null;
//   selectedPartNo: any = null;
//   selectedProcess: DropdownOption | null = null;
//   selectedMachineType: DropdownOption | null = null;
//   selectedSpec: DropdownOption | null = null;

//   // Static dropdown options
//   readonly divisionOptions: DropdownOption[] = [
//     { label: 'GM', value: 'GM' },
//     { label: 'PMC', value: 'PMC' },
//   ];

//   readonly factoryOptions: DropdownOption[] = [
//     { label: '1', value: '1' },
//     { label: '2', value: '2' },
//     { label: '3', value: '3' },
//     { label: '4', value: '4' },
//     { label: '5', value: '5' },
//     { label: '6', value: '6' },
//     { label: '7', value: '7' },
//   ];

//   readonly caseOptions: DropdownOption[] = [
//     { label: 'Setup', value: 'setup' },
//     { label: 'Other', value: 'other' },
//   ];

//   readonly caseOtherOptions: CaseOtherOption[] = [
//     { Case: 'BRO', viewCase: 'BRO' },
//     { Case: 'BUR', viewCase: 'BUR' },
//     { Case: 'USA', viewCase: 'USA' },
//     { Case: 'HOL', viewCase: 'HOL' },
//     { Case: 'INV', viewCase: 'INV' },
//     { Case: 'MOD', viewCase: 'MOD' },
//     { Case: 'NON', viewCase: 'NON' },
//     { Case: 'RET', viewCase: 'RET' },
//     { Case: 'SPA', viewCase: 'SPA' },
//     { Case: 'STO', viewCase: 'STO' },
//     { Case: 'CHA', viewCase: 'CHA' },
//   ];

//   // Dynamic options (populated from API)
//   specOptions: DropdownOption[] = [];
//   processOptions: DropdownOption[] = [];
//   machineTypeOptions: DropdownOption[] = [];
//   partNoOptions: any[] = [];

//   // Data arrays for different cases
//   setupItems: CartItem[] = [];
//   otherItems: CartItem[] = [];
//   displayedItems: CartItem[] = [];

//   // Form fields
//   phoneNumber: string = '';
//   dueDate: string = '';
//   readonly todayDate: string = new Date().toISOString().split('T')[0];
//   selectedFileName: string = '';

//   // UI state
//   isLoading: boolean = false;
//   selectedType: string = '';

//   constructor(private requestService: RequestService) {}

//   async ngOnInit(): Promise<void> {
//     await this.loadPartNumbers();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   /**
//    * Load initial part number list
//    */
//   private async loadPartNumbers(): Promise<void> {
//     this.isLoading = true;
//     this.requestService.getPartNoList()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (partNumbers) => {
//           this.partNoOptions = partNumbers;
//           this.isLoading = false;
//         },
//         error: (error) => {
//           console.error('Error loading part numbers:', error);
//           this.isLoading = false;
//         }
//       });
//   }
// }

