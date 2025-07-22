import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RequestService } from '../../../core/services/request.service';
import { Subject, takeUntil } from 'rxjs';

// Interfaces for better type safety
interface DropdownOption {
  label: string;
  value: string;
}

interface CaseOtherOption {
  Case: string;
  viewCase: string;
}

interface CartItem {
  Doc_no: string | null;
  Division: string | null;
  Factory: string | null;
  Date_of_Req: string | null;
  Item_no: number;
  Part_no: string;
  Process: string;
  MC_type: string;
  Spec: string;
  Usage: number;
  MC_no: string | null;
  Qty: number | null;
  Status: string | null;
  Set_by: string | null;
  Local: number;
  checked?: boolean;
  Case?: string;
  Caseother?: string | null;
  qty?: number | null;
  machineNoother?: string | null;
}

@Component({
  selector: 'app-request',
  standalone: true,
  imports: [
    SidebarComponent,
    RouterOutlet,
    CommonModule,
    FormsModule,
    NgSelectModule,
    NotificationComponent,
  ],
  templateUrl: './request.component.html',
  styleUrl: './request.component.scss',
})
export class RequestComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Selected dropdown values
  selectedDiv: DropdownOption | null = null;
  selectedFac: DropdownOption | null = null;
  selectedCase: DropdownOption | null = null;
  selectedPartNo: any = null;
  selectedProcess: DropdownOption | null = null;
  selectedMachineType: DropdownOption | null = null;
  selectedSpec: DropdownOption | null = null;

  // Static dropdown options
  readonly divisionOptions: DropdownOption[] = [
    { label: 'GM', value: 'GM' },
    { label: 'PMC', value: 'PMC' },
  ];

  readonly factoryOptions: DropdownOption[] = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
  ];

  readonly caseOptions: DropdownOption[] = [
    { label: 'Setup', value: 'setup' },
    { label: 'Other', value: 'other' },
  ];

  readonly caseOtherOptions: CaseOtherOption[] = [
    { Case: 'BRO', viewCase: 'BRO' },
    { Case: 'BUR', viewCase: 'BUR' },
    { Case: 'USA', viewCase: 'USA' },
    { Case: 'HOL', viewCase: 'HOL' },
    { Case: 'INV', viewCase: 'INV' },
    { Case: 'MOD', viewCase: 'MOD' },
    { Case: 'NON', viewCase: 'NON' },
    { Case: 'RET', viewCase: 'RET' },
    { Case: 'SPA', viewCase: 'SPA' },
    { Case: 'STO', viewCase: 'STO' },
    { Case: 'CHA', viewCase: 'CHA' },
  ];

  // Dynamic options (populated from API)
  specOptions: DropdownOption[] = [];
  processOptions: DropdownOption[] = [];
  machineTypeOptions: DropdownOption[] = [];
  partNoOptions: any[] = [];

  // Data arrays for different cases
  setupItems: CartItem[] = [];
  otherItems: CartItem[] = [];
  displayedItems: CartItem[] = [];

  // Form fields
  phoneNumber: string = '';
  dueDate: string = '';
  readonly todayDate: string = new Date().toISOString().split('T')[0];
  selectedFileName: string = '';

  // UI state
  isLoading: boolean = false;
  selectedType: string = '';

  constructor(private requestService: RequestService) {}

  async ngOnInit(): Promise<void> {
    await this.loadPartNumbers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load initial part number list
   */
  private async loadPartNumbers(): Promise<void> {
    this.isLoading = true;
    this.requestService.getPartNoList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (partNumbers) => {
          this.partNoOptions = partNumbers;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading part numbers:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Handle part number selection change
   */
  onPartNoChange(selectedPartNo: any): void {
    if (!selectedPartNo?.PartNo) {
      this.resetAllDependentDropdowns();
      return;
    }

    this.selectedPartNo = selectedPartNo;
    this.loadSpecOptions(selectedPartNo.PartNo);
  }

  /**
   * Handle specification selection change
   */
  onSpecChange(selectedSpec: DropdownOption): void {
    if (!selectedSpec?.value || !this.selectedPartNo?.PartNo) {
      this.resetProcessAndMachineDropdowns();
      return;
    }

    this.selectedSpec = selectedSpec;
    this.loadProcessOptions(this.selectedPartNo.PartNo, selectedSpec.value);
  }

  /**
   * Handle process selection change
   */
  onProcessChange(selectedProcess: DropdownOption): void {
    if (!selectedProcess?.value || !this.selectedPartNo?.PartNo || !this.selectedSpec?.value) {
      this.resetMachineTypeDropdown();
      return;
    }

    this.selectedProcess = selectedProcess;
    this.loadMachineTypeOptions(
      this.selectedPartNo.PartNo,
      this.selectedSpec.value,
      selectedProcess.value
    );
  }

  /**
   * Handle machine type selection change
   */
  onMachineTypeChange(selectedMachineType: DropdownOption): void {
    this.selectedMachineType = selectedMachineType;
  }

  /**
   * Handle case type change (Setup/Other)
   */
  onCaseTypeChange(): void {
    if (!this.selectedCase) {
      this.displayedItems = [];
      return;
    }

    switch (this.selectedCase.value) {
      case 'setup':
        this.displayedItems = [...this.setupItems];
        break;
      case 'other':
        this.displayedItems = this.otherItems.map(item => ({
          ...item,
          qty: null,
          machineNoother: null,
          checked: true,
          Case: this.selectedType || 'other',
          Caseother: null,
        }));
        break;
      default:
        this.displayedItems = [];
    }
  }

  /**
   * Load specification options based on part number
   */
  private loadSpecOptions(partNo: string): void {
    this.isLoading = true;
    this.requestService.getToolData(partNo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (toolData) => {
          this.specOptions = this.extractUniqueOptions(toolData, 'SPECS');
          this.resetProcessAndMachineDropdowns();
          this.updateCaseItems(toolData);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading specifications:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Load process options based on part number and specification
   */
  private loadProcessOptions(partNo: string, spec: string): void {
    this.isLoading = true;
    this.requestService.getToolData(partNo, spec)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (toolData) => {
          this.processOptions = this.extractUniqueOptions(toolData, 'Process');
          this.resetMachineTypeDropdown();
          this.updateCaseItems(toolData);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading processes:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Load machine type options based on part number, specification, and process
   */
  private loadMachineTypeOptions(partNo: string, spec: string, process: string): void {
    this.isLoading = true;
    this.requestService.getToolData(partNo, spec, process)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (toolData) => {
          this.machineTypeOptions = this.extractUniqueOptions(toolData, 'MC');
          this.updateCaseItems(toolData);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading machine types:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Extract unique options from tool data for dropdown population
   */
  private extractUniqueOptions(data: any[], propertyName: string): DropdownOption[] {
    const uniqueValues = [...new Set(data.map(item => item[propertyName]))];
    return uniqueValues
      .filter(value => value != null && value !== '')
      .map(value => ({ label: value, value: value }));
  }

  /**
   * Update setup and other items based on fetched data
   */
  private updateCaseItems(data: any[]): void {
    // Customize this logic based on your business rules
    this.setupItems = data
      .filter(item => item.Process === 'TURNING')
      .map((item, index) => this.createCartItem(item, index + 1, 'setup'));

    this.otherItems = data
      .filter(item => item.Process !== 'TURNING')
      .map((item, index) => this.createCartItem(item, index + 1, 'other'));
  }

  /**
   * Create a standardized cart item from tool data
   */
  private createCartItem(toolData: any, itemNo: number, caseType: string): CartItem {
    return {
      Doc_no: null,
      Division: this.selectedDiv?.value || null,
      Factory: this.selectedFac?.value || null,
      Date_of_Req: this.dueDate || null,
      Item_no: itemNo,
      Part_no: toolData.PartNo || '',
      Process: toolData.Process || '',
      MC_type: toolData.MC || '',
      Spec: toolData.SPECS || '',
      Usage: 0,
      MC_no: null,
      Qty: null,
      Status: null,
      Set_by: null,
      Local: 0,
      qty: null,
      machineNoother: null,
      checked: true,
      Case: caseType,
      Caseother: null,
    };
  }

  /**
   * Add selected items to cart
   */
  addToCart(): void {
    if (!this.validateRequiredFields()) {
      // Show validation error message
      console.warn('Please fill all required fields');
      return;
    }

    const newItem = this.createCartItem({
      PartNo: this.selectedPartNo?.PartNo,
      Process: this.selectedProcess?.value,
      MC: this.selectedMachineType?.value,
      SPECS: this.selectedSpec?.value,
    }, this.displayedItems.length + 1, this.selectedCase?.value || 'setup');

    this.displayedItems.push(newItem);
  }

  /**
   * Validate required fields before adding to cart
   */
  private validateRequiredFields(): boolean {
    return !!(
      this.selectedPartNo &&
      this.selectedSpec &&
      this.selectedProcess &&
      this.selectedMachineType
    );
  }

  /**
   * Clear all form data and reset to initial state
   */
  clearAll(): void {
    // Reset selected values
    this.selectedDiv = null;
    this.selectedFac = null;
    this.selectedCase = null;
    this.selectedPartNo = null;
    this.selectedSpec = null;
    this.selectedProcess = null;
    this.selectedMachineType = null;

    // Reset form fields
    this.dueDate = '';
    this.phoneNumber = '';
    this.selectedFileName = '';

    // Reset data arrays
    this.displayedItems = [];
    this.setupItems = [];
    this.otherItems = [];

    // Reset dropdown options
    this.resetAllDependentDropdowns();
  }

  /**
   * Handle file selection
   */
  onFileChosen(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.selectedFileName = file.name;
    }
  }

  /**
   * Remove item from cart
   */
  removeFromCart(index: number): void {
    if (index >= 0 && index < this.displayedItems.length) {
      this.displayedItems.splice(index, 1);
      // Reorder item numbers
      this.displayedItems.forEach((item, i) => {
        item.Item_no = i + 1;
      });
    }
  }

  /**
   * Submit cart data
   */
  async submitCart(): Promise<void> {
    if (this.displayedItems.length === 0) {
      console.warn('No items in cart to submit');
      return;
    }

    const submitData = {
      items: this.displayedItems,
      requestInfo: {
        division: this.selectedDiv?.value,
        factory: this.selectedFac?.value,
        dueDate: this.dueDate,
        phoneNumber: this.phoneNumber,
      }
    };

    this.isLoading = true;
    this.requestService.submitCartData(submitData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Cart submitted successfully:', response);
          this.clearAll();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error submitting cart:', error);
          this.isLoading = false;
        }
      });
  }

  // Private helper methods for resetting dropdowns
  private resetAllDependentDropdowns(): void {
    this.specOptions = [];
    this.processOptions = [];
    this.machineTypeOptions = [];
    this.selectedSpec = null;
    this.selectedProcess = null;
    this.selectedMachineType = null;
    this.setupItems = [];
    this.otherItems = [];
    this.displayedItems = [];
  }

  private resetProcessAndMachineDropdowns(): void {
    this.processOptions = [];
    this.machineTypeOptions = [];
    this.selectedProcess = null;
    this.selectedMachineType = null;
  }

  private resetMachineTypeDropdown(): void {
    this.machineTypeOptions = [];
    this.selectedMachineType = null;
  }
}

//   // Dropdown data
//   Div_: any = [];
//   Fac_: any = [];
//   Case_: any = [];
//   PartNo_: any = [];
//   Process_: any = [];
//   MachineType_: any = [];
//   caseother: any = [];
//   Spec_:any=[];
//   setupItem = [];
//   otherItem = [];

//   // option dropdown
//   spec:any=[];
//   Div:any=[];
//   Fac:any=[];
//   Case:any=[];
//   PartNo:any=[];
//   Process:any=[];
//   MachineType:any=[];
//   Caseother:any=[];

//   // Form fields
//   phone_: string = '';
//   DueDate_: string = '';
//   today_: string = '';

//   // Table data
//   items: any= [];// array เก่าวแปรสำหรับเก็บรายการข้อมูล (items) ที่มีอยู่แล้ว
//   item: any; //array ใหม่  ตัวแปรสำหรับเก็บข้อมูล item ใหม่
//   selectedType: string = '';
//   isSearched: boolean = false;

//   constructor( //โหลดทันทีที่รันที่จำเป็นต้องใช้ตอนเริ่มเว็ป
//     private api: RequestService
//   ) {
//     // Set today's date for min date validation
//     this.today_ = new Date().toISOString().split('T')[0];

//     // กำหนดตัวเลือกในdropdown
//     this.Div = [
//       { label: 'GM', value: 'GM' }, // ตัวเลือก Division ที่ 1
//       { label: 'PMC', value: 'PMC' }, // ตัวเลือก Division ที่ 2
//     ];

//     this.Fac = [
//       { label: '1', value: '1' }, // ตัวเลือก Fac ที่ 1
//       { label: '2', value: '2' }, // ตัวเลือก Fac ที่2
//       { label: '3', value: '3' },
//       { label: '4', value: '4' },
//       { label: '5', value: '5' },
//       { label: '6', value: '6' },
//       { label: '7', value: '7' },
//     ];

//     this.Case = [
//       { label: 'Setup', value: 'setup' }, // ตัวเลือก Division ที่ 1
//       { label: 'Other', value: 'other' }, // ตัวเลือก Division ที่ 2
//     ];

//      this.Caseother = [
//         { Case: 'BRO', viewCase: 'BRO' }, // ตัวเลือกเคสที่ 1
//         { Case: 'BUR', viewCase: 'BUR' }, // ตัวเลือกเคสที่ 2
//         { Case: 'USA', viewCase: 'USA' }, // ตัวเลือกเคสที่ 3
//         { Case: 'HOL', viewCase: 'HOL' }, // ตัวเลือกเคสที่ 4
//         { Case: 'INV', viewCase: 'INV' }, // ตัวเลือกเคสที่ 5
//         { Case: 'MOD', viewCase: 'MOD' }, // ตัวเลือกเคสที่ 6
//         { Case: 'NON', viewCase: 'NON' }, // ตัวเลือกเคสที่ 7
//         { Case: 'RET', viewCase: 'RET' }, // ตัวเลือกเคสที่ 8
//         { Case: 'SPA', viewCase: 'SPA' }, // ตัวเลือกเคสที่ 9
//         { Case: 'STO', viewCase: 'STO' }, // ตัวเลือกเคสที่ 10
//         { Case: 'CHA', viewCase: 'CHA' }, // ตัวเลือกเคสที่ 11
//       ];




//   }

//   async ngOnInit()  {
//     this.Get_PARTNO();


//   }
// // เรียกใช้ตัวดึงapi
//   Get_PARTNO() {
//     // เรียก API เพื่อดึงข้อมูล SPEC
//     this.api.get_PARTNO().subscribe({
//       // ถ้าสำเร็จ จะทำการเก็บ response ลงใน spec
//       next: (response: any) => {
//         this.PartNo = response;
//         // แสดงผลลัพธ์ใน console
//         // console.log(this.PartNo);
//       },
//       // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
//       error: (e: any) => console.error(e),
//     });
//   }

//   async get_SPEC(event:any) {
//     console.log(event.value); // แสดงค่าที่ได้รับใน console
//     // เช็คว่า event.value มีค่าหรือไม่
//     if (event.value !== undefined) {
//       // เรียก API เพื่อส่งข้อมูลไปยัง SQL
//       this.api.get_SPEC(event.value).subscribe({
//         // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_process
//         next: (response) => {
//           if (response.length > 0) {
//             this.spec= response[0];
//             // แสดงผลลัพธ์ใน console
//             console.log(response);
//           }
//         },
//         // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
//         error: (e) => console.error(e),
//       });
//     }
//   }
//   // Process
//   async post_PROCESS(event:any) {
//     console.log(event.value); // แสดงค่าที่ได้รับใน console
//     // เช็คว่า event.value มีค่าหรือไม่
//     if (event.value !== undefined) {
//       // เรียก API เพื่อส่งข้อมูลไปยัง SQL
//       this.api.post_PROCESS(event.value).subscribe({
//         // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_process
//         next: (response) => {
//           if (response.length > 0) {
//             this.Process = response[0];
//             // แสดงผลลัพธ์ใน console
//             console.log(response);
//           }
//         },
//         // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
//         error: (e) => console.error(e),
//       });
//     }
//   }

// // โดยใช้ Post_machine_type ที่ดึงมาจาก api.service.ts เพื่อเชื่อมต่อ API แล้วทำการส่งข้อมูล(post)ไป SQL
//   // เรียกใช้งาน api.post_machine_type โดยส่งค่าจาก event.value ไป
//   async post_MACHINETYPE(event:any) {
//     // console.log(event.value) // แสดงค่าที่ได้รับใน console
//     // เช็คว่า event.value มีค่าหรือไม่
//     if (event.value !== undefined) {
//       // เก็บค่า OPIST_Process จาก event.value
//       const Process = event.value.Process;
//       // สร้างอ็อบเจ็กต์ data สำหรับส่งไปยัง API
//       const data = {
//         PartNo: this.PartNo.PartNo,
//         Process: Process,
//       };

//       // เรียก API เพื่อส่งข้อมูล machine type
//       this.api
//         .post_MACHINETYPE(data)
//         // console.log(event.value) // แสดงค่าที่ได้รับใน console
//         .subscribe({
//           // ถ้าสำเร็จ จะเก็บค่าผลลัพธ์ใน req_mc และ rev_
//           next: (response) => {
//             if (response.length > 0) {
//               this.MachineType_ = response[0];
//               // this.rev_ = response[0][0].OPIST_DwgRev;
//               // console.log(response, this.rev_, response[0][0].OPIST_DwgRev); // แสดงผลลัพธ์ใน console
//             }
//           },
//           // ถ้ามีข้อผิดพลาดในการเรียก API จะแสดงข้อผิดพลาดใน console
//           error: (e) => console.error(e),
//         });
//     }
//   }


// onTypechange() {

//     if (this.Case_ === 'setup'){
//       this.items = this.setupItem;
//     }
//     else if (this.Case_ === 'other') {
//   this.items = this.otherItem.map(item => ({
//      ...(item as any),   // บอกว่า item เป็น any เพื่อให้ใช้ spread ได้
//       qty: null,
//       machineNoother:null,
//       checked: true,
//       Case: this.selectedType,
//       Caseother: null
//   }));
//     }
//     else {
//       this.items=[];
//     }
//   }



// // ฟังก์ชั่นเรียกดูข้อมูลในตาราง
// // Setupview() {
// //   this.items = [];

// //   const division = this.Div_;
// //   const fac = this.Fac_;
// //   const partNo = this.PartNo_;
// //   const process = this.Process_;
// //   const machineType = this.MachineType_;
// //   const date = this.DueDate_;

// //   this.isSearched = true;

// //   if (
// //     partNo && partNo.trim() !== '' &&
// //     process && process.trim() !== '' &&
// //     machineType && machineType.trim() !== '' &&
// //     division && division.trim() !== '' &&
// //     fac && fac.trim() !== '' &&
// //     date && date.trim() !== ''
// //   ) {
// //     // เรียก API แทน mockData
// //     this.RequestService.getFilteredItems({
// //       partNo,
// //       process,
// //       machineType,
// //       division,
// //       fac,
// //       dueDate: date
// //     }).subscribe((response: any[]) => {
// //       if (response.length > 0) {
// //         this.items = response.map(item => ({
// //           ...item,
// //           qty: null,
// //           machineNoother: null,
// //           checked: true,
// //           case: this.selectedType
// //         }));
// //       } else {
// //         this.items = [];
// //         alert("ไม่พบข้อมูลที่ค้นหา");
// //       }
// //     }, (error: any) => {
// //       console.error("เกิดข้อผิดพลาดขณะดึงข้อมูลจาก API:", error);
// //       alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
// //     });
// //   } else {
// //     alert("กรุณาเลือกข้อมูลให้ครบทุกช่องก่อนค้นหา");
// //   }
// // }

// // function add to cart
// AddToCart() {
//    // กรองรายการที่มีค่า MC_no และ Qty
//     const filteredItems = this.items.filter((item:any) => item.MC_no && item.Qty);
//     //console.log(filteredItems.length, this.items.length); // แสดงจำนวนรายการใน console
//     // เช็คว่ากรอก mc no และ qty ได้กรอกหมดทุกตัวไหม
//     if (filteredItems.length < this.items.length) {

//       return; // หยุดการดำเนินการถ้ายังไม่กรอกข้อมูลครบ
//     }

//     // สร้างอาเรย์ใหม่จากข้อมูลที่ถูกกรอง
// // สร้างอาเรย์ใหม่จากข้อมูลที่ถูกกรอง
// const newArray = filteredItems.map((item:any) => ({
//   Doc_no: null, // หมายเลขเอกสารเริ่มต้นเป็น null
//   Division: this.Div_.value, // ค่าจากฟอร์มสำหรับ Division
//   Factory: this.Fac_.value, // ค่าจากฟอร์มสำหรับ Factory
//   Date_of_Req: null, // วันที่ของการร้องขอเริ่มต้นเป็น null
//   Item_no: item.ITEMNO, // หมายเลขไอเทมจากรายการที่ถูกกรอง
//   Part_no: item.PARTNO, // หมายเลขชิ้นส่วนจากรายการที่ถูกกรอง
//   Process: item.PROCESS, // กระบวนการจากรายการที่ถูกกรอง
//   MC_type: item.MACHINETYPE, // ประเภทเครื่องจักรจากรายการที่ถูกกรอง
//   Spec: item.SPEC, // สเปคจากรายการที่ถูกกรอง
//   Usage: item.Usage_pcs, // การใช้งานจากรายการที่ถูกกรอง
//   MC_no: item.MC_no, // หมายเลขเครื่องจักรจากรายการที่ถูกกรอง
//   Qty: item.Qty, // จำนวนจากรายการที่ถูกกรอง

//   Status: null, // สถานะเริ่มต้นเป็น null
//   Set_by: null, // ตั้งค่าโดยเริ่มต้นเป็น null
//   Local: 0, // ค่าท้องถิ่นเริ่มต้นเป็น 0
//   }));
// }


// // function clearall
// Clearall() {
//   // Delete select group
//   this.Div_=null;
//   this.Fac_=null;
//   this.DueDate_='';
//   this.Case_=null;
//   this.PartNo_=null;
//   this.Spec_=null
//   this.MachineType_=null;

//   // Delete items ค่าที่รวมที่จะส่งไปตะกร้า
//   this.items=null;

//   }
//   // upload file
//   selectedFileName: string = '';
//   onFileChosen(event: any) {
//     const file = event.target.files[0];
//     if (file) {
//       this.selectedFileName = file.name;
//       console.log('Selected file:', file.name);
//     }
//   }
// }

