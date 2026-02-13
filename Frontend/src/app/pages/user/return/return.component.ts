import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { ReturnService } from '../../../core/services/return.service';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { startWith, map } from 'rxjs/operators';
import Swal from 'sweetalert2';


// สร้าง Interface เพื่อกำหนดหน้าตาข้อมูลใน 1 แถว
interface ReturnItem {
  partNo: string;
  itemNo: string;
  itemName: string;
  spec: string;
  qty: number;
  remark: string;
  selected?: boolean; // New property for checkbox
}


@Component({
  selector: 'app-return',                     //  ชื่อ Tag สำหรับเรียกใช้ Component นี้ (<app-return>)
  templateUrl: './return.component.html',     //  ไฟล์ HTML ที่ใช้แสดงผล
  styleUrls: ['./return.component.scss'],     //  ไฟล์ CSS/SCSS สำหรับตกแต่ง
  standalone: true,                           //  กำหนดเป็น Standalone Component
  imports: [
    CommonModule,                             //  นำเข้า module พื้นฐาน (เช่น *ngFor, *ngIf)
    FormsModule,                              //  นำเข้า module สำหรับทำ Two-way binding ([(ngModel)])
    SidebarComponent,                          //  นำเข้า Sidebar เพื่อมาแสดงผลในหน้านี้
    HttpClientModule,
    NgSelectModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class ReturnComponent implements OnInit {

  // --- ส่วนของ Dropdown (Header) ---
  divisions: any[] = [];
  facilities: any[] = [];
  processes: any[] = [];

  // ตัวแปรเก็บค่าที่ user เลือกใน Dropdown
  selectedDivision: any = null; // Changed to object to hold whole division object if needed, or just ID
  selectedDivisionId: number | null = null;
  selectedFacility: string = '';
  selectedProcess: string = '';
  phoneNumber: string = '';

  // --- ส่วนของตาราง (Dynamic Table) ---
  // เริ่มต้นให้มีแถวว่างๆ = 0 items (ตามที่ user ขอ)
  returnItems: ReturnItem[] = [];

  // Subject for ng-select typeahead
  partNoInput$ = new Subject<string>();
  currentRowIndex: number = -1;
  searchResults: { [index: number]: any[] } = {}; // Restore searchResults

  // --- Smart Input (Scan/Type) ---
  smartInputControl = new FormControl('');
  smartInputSuggestions: any[] = [];
  isSmartScanMode: boolean = true; // Toggle between Scan (Enter=Add) and Type (Enter=Select) - Actually hybrid is best.

  // --- Table Input Autocomplete ---
  tableInputControls: { [index: number]: FormControl } = {};
  tableInputSuggestions: { [index: number]: any[] } = {};

  // Checkbox State
  isAllSelected: boolean = false;

  constructor(private returnService: ReturnService) {
    // Setup Smart Input Autocomplete
    this.smartInputControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (!value || value.length < 2 || !this.selectedDivisionId) {
          return [];
        }
        return this.returnService.getItemDetails(value, this.selectedDivisionId, true); // true = Autocomplete
      })
    ).subscribe({
      next: (data) => {
        this.smartInputSuggestions = Array.isArray(data) ? data : [];
      },
      error: (err) => console.error('Smart Input Search Error:', err)
    });

    // Existing PartNo Typeahead setup...
    this.partNoInput$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2 || !this.selectedDivisionId || this.currentRowIndex === -1) {
          return [];
        }
        // Call API
        return this.returnService.getPartNo(term, this.selectedDivisionId);
      })
    ).subscribe({
      next: (data) => {
        // Update results for the SPECIFIC row that is active
        if (this.currentRowIndex !== -1) {
          this.searchResults[this.currentRowIndex] = data;
        }
      },
      error: (err) => console.error('Return Page - Search error:', err)
    });
  }

  // Override setCurrentRow to use SweetAlert
  setCurrentRow(index: number) {
    if (!this.selectedDivisionId) {
      Swal.fire({
        icon: 'warning',
        title: 'Division Required',
        text: 'กรุณาเลือก Division ก่อนค้นหา PartNo ครับ / Please select Division first.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107' // Orange warning
      });
      // unfocus
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }
    this.currentRowIndex = index;
    // this.saveState(); // Not critical to save on focus
  }

  // Check if any items are selected for bulk action
  get hasSelectedItems(): boolean {
    return this.returnItems.some(item => item.selected);
  }

  // Toggle All Checkboxes
  toggleSelectAll() {
    this.returnItems.forEach(item => item.selected = this.isAllSelected);
    this.saveState(); // Save selection state (optional but good)
  }

  // Check if all are selected (to update header checkbox)
  checkAllSelected() {
    this.isAllSelected = this.returnItems.length > 0 && this.returnItems.every(item => item.selected);
    this.saveState();
  }

  // Delete Selected Rows
  deleteSelected() {
    const selectedCount = this.returnItems.filter(i => i.selected).length;
    if (selectedCount === 0) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${selectedCount} selected items? / ลบรายการที่เลือก ${selectedCount} รายการ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Filter out selected items
        const keptItems: ReturnItem[] = [];
        const keptSearchResults: { [index: number]: any[] } = {};
        const keptControls: { [index: number]: FormControl } = {};

        // Re-construct logic
        // Since logic depends on index, better to just clear aux data and re-init
        this.returnItems = this.returnItems.filter(i => !i.selected);
        this.isAllSelected = false;
        this.searchResults = {};
        this.tableInputControls = {};

        // Re-init controls for remaining items
        this.returnItems.forEach((_, idx) => this.initTableInputControl(idx));

        this.saveState(); // Save state
      }
    });
  }

  // Called when ng-select receives focus (kept for compatibility)
  // setCurrentRow is already defined above

  // Called when user selects an option
  onPartNoSelect(index: number, event: any) {
    // ngModel handles update
    this.saveState();
  }

  // Allow custom text input in ng-select
  addTagFn(term: string) {
    return { PartNo: term };
  }


  // Workaround since [dropdownClass] is not supported in this version
  onPartNoOpen() {
    setTimeout(() => {
      // Find all open panels (usually just one) and add custom class
      const panels = document.querySelectorAll('ng-dropdown-panel');
      panels.forEach((panel) => {
        panel.classList.add('part-no-dropdown-wide');
      });
    }, 10);
  }

  ngOnInit(): void {
    this.loadDivisions();
  }

  loadDivisions() {
    this.returnService.getDivisions().subscribe({
      next: (data) => {
        this.divisions = data; // Returns [Division_Id, Profit_Center, Division_Name]
        this.restoreState(); // Restore state AFTER divisions are loaded
      },
      error: (err) => {
        console.error('Error loading divisions:', err);
      }
    });
  }

  onDivisionChange() {
    this.facilities = [];
    this.processes = [];
    this.selectedFacility = '';
    this.selectedProcess = '';

    if (this.selectedDivisionId) {
      // Get Profit_Center from selected division object
      const selectedDiv = this.divisions.find(d => d.Division_Id === this.selectedDivisionId);
      const profitCenter = selectedDiv?.Profit_Center || '';

      this.returnService.getFacilities(profitCenter).subscribe({
        next: (data) => {
          // data now uses trans.Stored_Get_Dropdown_Facility_By_Division
          // which returns [FacilityShort, FacilityName]
          this.facilities = data.map((item: any) => ({
            label: item.FacilityShort,
            value: item.FacilityShort
          }));
        },
        error: (err) => console.error('Error loading facilities:', err)
      });

      this.returnService.getProcesses(this.selectedDivisionId).subscribe({
        next: (data) => {
          this.processes = data; // Returns [Process]
        },
        error: (err) => console.error('Error loading processes:', err)
      });
    }
    this.saveState();
  }

  // ฟังก์ชันเพิ่มแถวใหม่ (kept if needed, but UI button removed)
  addRow() {
    this.returnItems.push({
      partNo: this.returnItems.length > 0 ? this.returnItems[this.returnItems.length - 1].partNo : '',
      itemNo: '',
      itemName: '',
      spec: '',
      qty: 0,
      remark: ''
    });
    this.initTableInputControl(this.returnItems.length - 1);
    this.saveState();
  }

  initTableInputControl(index: number) {
    if (!this.tableInputControls[index]) {
      this.tableInputControls[index] = new FormControl('');

      this.tableInputControls[index].valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          if (!value || value.length < 2 || !this.selectedDivisionId) {
            return [];
          }
          return this.returnService.getItemDetails(value, this.selectedDivisionId!, true);
        })
      ).subscribe({
        next: (data) => {
          this.tableInputSuggestions[index] = Array.isArray(data) ? data : [];
        },
        error: (err) => console.error(`Table Input ${index} Error:`, err)
      });
    }
  }


  // Handle Smart Input Enter Key (Scan or Select)
  onSmartInputEnter() {
    // Validate Header Fields First
    if (!this.selectedDivisionId || !this.selectedFacility || !this.selectedProcess) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields',
        text: 'Please select Division, Facility, and Process first.'
      });
      return;
    }

    const value = this.smartInputControl.value;
    if (!value) return;

    // 1. Try Exact Match First (AutoFill logic)
    if (this.selectedDivisionId) {
      this.returnService.getItemDetails(value, this.selectedDivisionId, false).subscribe({
        next: (data) => {
          if (data) {
            // Found Exact Match! Add to table immediately using LAST ROW PartNo if available
            const lastPartNo = this.returnItems.length > 0 ? this.returnItems[this.returnItems.length - 1].partNo : '';

            const newItem: ReturnItem = {
              partNo: lastPartNo, // Auto-carry PartNo
              itemNo: data.ItemNo,
              itemName: data.ItemName,
              spec: data.SPEC,
              qty: 1, // Default Qty 1 for scan
              remark: ''
            };

            // Always ADD to bottom (since we removed the concept of empty row placeholder mostly)
            this.returnItems.push(newItem);
            this.initTableInputControl(this.returnItems.length - 1);

            // Clear Input for next scan
            this.smartInputControl.setValue('', { emitEvent: false });
            this.smartInputSuggestions = [];

            // Optional: Sound effect?
            this.saveState();
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Not Found',
              text: 'Item not found in this Division / ไม่พบรายการ',
              timer: 1500,
              showConfirmButton: false
            });
          }
        },
        error: (err) => {
          // If not found exact, maybe they meant to pick from suggestion?
          // If suggestions exist, open panel?
          // For now, just clear or alert?
          // console.log('Smart Scan: Not found, maybe partial match?');
        }
      });
    }
  }

  onSmartSuggestionSelected(event: any) {
    // Validate Header Fields First
    if (!this.selectedDivisionId || !this.selectedFacility || !this.selectedProcess) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields',
        text: 'Please select Division, Facility, and Process first.'
      });
      this.smartInputControl.setValue(''); // Clear input so they can't proceed
      return;
    }

    const item = event.option.value; // expected whole object from value
    const lastPartNo = this.returnItems.length > 0 ? this.returnItems[this.returnItems.length - 1].partNo : '';

    const newItem: ReturnItem = {
      partNo: lastPartNo,
      itemNo: item.ItemNo,
      itemName: item.ItemName,
      spec: item.SPEC,
      qty: 1,
      remark: ''
    };

    this.returnItems.push(newItem);
    this.initTableInputControl(this.returnItems.length - 1);

    // Clear input
    this.smartInputControl.setValue('');
    this.smartInputSuggestions = [];
    this.saveState();
  }

  // Table Input Selection
  onTableSuggestionSelected(index: number, event: any) {
    // Validate
    if (!this.selectedDivisionId || !this.selectedFacility || !this.selectedProcess) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields',
        text: 'Please select Division, Facility, and Process / กรุณากรอกข้อมูลให้ครบถ้วน'
      });
      this.tableInputControls[index].setValue('', { emitEvent: false }); // Clear invalid input
      return;
    }

    const item = event.option.value;
    this.returnItems[index].itemNo = item.ItemNo;
    this.returnItems[index].itemName = item.ItemName;
    this.returnItems[index].spec = item.SPEC;
    this.tableInputControls[index].setValue(item.ItemNo, { emitEvent: false });
    this.tableInputSuggestions[index] = [];
    this.saveState();
  }

  // ฟังก์ชันลบแถว (ปุ่ม - สีแดง ที่จะใส่เพิ่มให้ในตาราง)
  removeRow(index: number) {
    Swal.fire({
      title: 'Delete Item?',
      text: "Remove this item from the list? / ลบรายการนี้?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'DELETE', // Button text from user request (sort of)
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.returnItems.splice(index, 1);
        delete this.searchResults[index];
        this.searchResults = {};

        // Re-init controls
        this.tableInputControls = {};
        this.returnItems.forEach((_, idx) => this.initTableInputControl(idx));
        this.saveState();
      }
    });
  }

  // PartNo input handler
  onPartNoInput(index: number, value: string) {
    if (!value || !this.selectedDivisionId) {
      this.searchResults[index] = [];
      return;
    }
    // Direct call (Simple debounce could be added if needed, typically 300ms)
    // For now, let's just query.
    this.returnService.getPartNo(value, this.selectedDivisionId!).subscribe((data) => {
      this.searchResults[index] = data; // data = [{ PartNo: '...' }]
    });
  }

  selectPartNo(index: number, partNo: string) {
    this.returnItems[index].partNo = partNo;
    this.searchResults[index] = []; // Clear list after selection
    this.saveState();
  }


  // ฟังก์ชันดึงข้อมูล Item (Updated mapping to SPEC)
  onItemNoChange(index: number, itemNo: string) {
    if (!itemNo) return;

    // เช็คว่าเลือก Division หรือยัง
    if (!this.selectedDivisionId || !this.selectedFacility || !this.selectedProcess) {
      Swal.fire({ icon: 'warning', title: 'Required Fields', text: 'Please select Division, Facility, and Process first.' });
      this.returnItems[index].itemNo = ''; // เคลียร์ค่าที่สแกนมา
      return;
    }

    this.returnService.getItemDetails(itemNo, this.selectedDivisionId!).subscribe({
      next: (data) => {
        if (data) {
          this.returnItems[index].itemName = data.ItemName;
          this.returnItems[index].spec = data.SPEC; // Updated to SPEC (UpperCase)
          // Also have UNIT, ON_HAND if needed
          this.saveState();
        }
      },
      error: (err) => {
        console.error('Error fetching item:', err);
        // Optional: clear fields or alert
        this.returnItems[index].itemName = '';
        this.returnItems[index].spec = '';
        Swal.fire({ icon: 'error', title: 'Not Found', text: 'Item not found / ไม่พบข้อมูลสินค้า' });
      }
    });
  }

  // ฟังก์ชันกดปุ่ม Return (ส่งข้อมูล)
  onSubmit() {
    // 1. Validate
    if (!this.selectedDivisionId || !this.selectedFacility || !this.selectedProcess) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields',
        text: 'Please select Division, Facility, and Process / กรุณากรอกข้อมูลให้ครบถ้วน'
      });
      return;
    }
    // Check at least one valid item
    const validItems = this.returnItems.filter(i => i.itemNo && i.qty > 0);
    if (validItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Items',
        text: 'Please add at least one valid item (ItemNo + Qty > 0) / กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'
      });
      return;
    }

    // 2. Get User Info
    let employeeId = '';
    let returnBy = '';
    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        employeeId = user.Emp_ID || user.Employee_ID || '';
        returnBy = user.Employee_Name || user.Name || 'Guest';
      }
    } catch (e) {
      console.error('Error parsing user:', e);
    }

    // 3. Generate DocNo (Simple Client-side generation)
    // Format: RET-YYYYMMDD-HHMMSS
    const now = new Date();
    const docNo = `RET-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

    // 4. Prepare Data
    const dataToSend = {
      header: {
        docNo: docNo,
        employeeId: employeeId,
        returnBy: returnBy,
        divisionId: this.selectedDivisionId,
        divisionName: this.selectedDivision?.Division_Name || this.divisions.find(d => d.Division_Id == this.selectedDivisionId)?.Division_Name,
        facility: this.selectedFacility,
        process: this.selectedProcess,
        phone: this.phoneNumber
      },
      items: validItems
    };

    console.log('Sending Data:', dataToSend);


    // 5. Confirmation & Call Service
    Swal.fire({
      title: 'Confirm to send data?',
      text: 'ยืนยันจะเบิกไหม?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Send!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.returnService.saveReturnRequest(dataToSend).subscribe({
          next: (res) => {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: `Saved ${validItems.length} records successfully! (DocNo: ${res.docNo})`,
              confirmButtonText: 'OK',
              confirmButtonColor: '#3085d6'
            });

            // Reset form or redirect
            this.clearState(); // Clear state on success
          },
          error: (err) => {
            console.error('Save Error:', err);
            // alert('Save Failed / บันทึกไม่สำเร็จ: ' + (err.error || err.message));
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Save Failed / บันทึกไม่สำเร็จ: ' + (err.error || err.message),
            });
          }
        });
      }
    });
  }

  // --- State Persistence ---
  saveState() {
    const state = {
      selectedDivisionId: this.selectedDivisionId,
      selectedFacility: this.selectedFacility,
      selectedProcess: this.selectedProcess,
      phoneNumber: this.phoneNumber,
      returnItems: this.returnItems,
      currentRowIndex: this.currentRowIndex
    };
    this.returnService.setReturnState(state);
  }

  restoreState() {
    const state = this.returnService.getReturnState();
    if (state) {
      this.selectedDivisionId = state.selectedDivisionId;
      this.selectedFacility = state.selectedFacility;
      this.selectedProcess = state.selectedProcess;
      this.phoneNumber = state.phoneNumber;
      this.returnItems = state.returnItems || [];
      this.currentRowIndex = state.currentRowIndex || -1;

      if (this.selectedDivisionId) {
        this.loadDependentDropdowns();
      }

      // Force re-init controls for restored items
      this.returnItems.forEach((_, idx) => this.initTableInputControl(idx));
    }
  }

  clearState() {
    // Keep Header Logic: Division, Facility, Process, Phone remain active
    // Only clear Table Items
    this.returnItems = [];
    this.isAllSelected = false;
    this.currentRowIndex = -1;
    this.searchResults = {};
    this.tableInputControls = {};

    // Save state so that if user refreshes, these header values + empty table are loaded
    this.saveState();
  }

  loadDependentDropdowns() {
    if (this.selectedDivisionId) {
      // We need profit center first
      const selectedDiv = this.divisions.find(d => d.Division_Id === this.selectedDivisionId);
      const profitCenter = selectedDiv?.Profit_Center;

      if (profitCenter) {
        this.returnService.getFacilities(profitCenter).subscribe(data => {
          this.facilities = data.map((item: any) => ({
            label: item.FacilityShort,
            value: item.FacilityShort
          }));
        });
      }

      this.returnService.getProcesses(this.selectedDivisionId).subscribe(data => this.processes = data);
    }
  }

}