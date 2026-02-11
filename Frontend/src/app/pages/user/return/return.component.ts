import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { ReturnService } from '../../../core/services/return.service';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';


// สร้าง Interface เพื่อกำหนดหน้าตาข้อมูลใน 1 แถว
interface ReturnItem {
  partNo: string;
  itemNo: string;
  itemName: string;
  spec: string;
  qty: number;
  remark: string;
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
    NgSelectModule
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
  // เริ่มต้นให้มีแถวว่างๆ 1 แถวเสมอ
  returnItems: ReturnItem[] = [
    { partNo: '', itemNo: '', itemName: '', spec: '', qty: 0, remark: '' }
  ];

  // Subject for ng-select typeahead
  partNoInput$ = new Subject<string>();
  currentRowIndex: number = -1;
  searchResults: { [index: number]: any[] } = {}; // Restore searchResults

  constructor(private returnService: ReturnService) {
    // Setup Typeahead Search
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
      error: (err) => console.error('Search error:', err)
    });
  }

  // Called when ng-select receives focus
  setCurrentRow(index: number) {
    if (!this.selectedDivisionId) {
      // Alert if Division not selected
      alert("กรุณาเลือก Division ก่อนค้นหา PartNo ครับ / Please select Division first.");
      // Optional: Blur or clear focus?
      return;
    }
    this.currentRowIndex = index;
  }

  // Called when user selects an option
  onPartNoSelect(index: number, event: any) {
    // Event is the selected item (or null if cleared)
    // If value is bound to partNo, it might be just string if bindValue used, or object if not.
    // In HTML we used bindValue="PartNo", so 'event' is likely not the whole object unless we remove bindValue.
    // Actually, usually ng-select (change) emits the selected value (Model).
    // Let's rely on ngModel update.

    // If we need the whole object (if PartNo isn't enough), we might change bindValue.
    // But for now, user just asked for "PartNo Smoot".

    // Clear results after selection to keep clean
    // this.searchResults[index] = []; 
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

  // Remove old onPartNoInput/selectPartNo if not used


  loadDivisions() {
    this.returnService.getDivisions().subscribe({
      next: (data) => {
        this.divisions = data; // Returns [Division_Id, Profit_Center, Division_Name]
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
      this.returnService.getFacilities(this.selectedDivisionId).subscribe({
        next: (data) => {
          // data = [{ Profit_Center: '...', FacilityName: 'Turning F.1' }, ...]

          // Logic: Extract "F.x", Map to Object, Unique
          const mapped = data.map((item: any) => {
            const name = item.FacilityName || '';
            const match = name.match(/F\.\d+/);
            const shortName = match ? match[0] : name; // Use Short Name if found, else original
            return { label: shortName, value: shortName };
          });

          // Unique by label
          const unique = new Map();
          mapped.forEach((m: any) => {
            if (m.label) unique.set(m.label, m);
          });

          // Convert back to array and Sort by label
          this.facilities = Array.from(unique.values()).sort((a: any, b: any) => a.label.localeCompare(b.label, undefined, { numeric: true }));
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
  }

  // ฟังก์ชันเพิ่มแถวใหม่ (ปุ่ม + สีเขียว)
  addRow() {
    this.returnItems.push({
      partNo: '',
      itemNo: '',
      itemName: '',
      spec: '',
      qty: 0,
      remark: ''
    });
  }

  // ฟังก์ชันลบแถว (ปุ่ม - สีแดง ที่จะใส่เพิ่มให้ในตาราง)
  removeRow(index: number) {
    if (this.returnItems.length > 1) {
      this.returnItems.splice(index, 1);
      delete this.searchResults[index]; // Clear search results
    } else {
      alert("ต้องมีอย่างน้อย 1 รายการครับ");
    }
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
  }


  // ฟังก์ชันดึงข้อมูล Item (Updated mapping to SPEC)
  onItemNoChange(index: number, itemNo: string) {
    if (!itemNo) return;

    // เช็คว่าเลือก Division หรือยัง
    if (!this.selectedDivisionId) {
      alert("Please select a Division first / กรุณาเลือก Division ก่อนครับ");
      this.returnItems[index].itemNo = ''; // เคลียร์ค่าที่สแกนมา
      return;
    }

    this.returnService.getItemDetails(itemNo, this.selectedDivisionId!).subscribe({
      next: (data) => {
        if (data) {
          this.returnItems[index].itemName = data.ItemName;
          this.returnItems[index].spec = data.SPEC; // Updated to SPEC (UpperCase)
          // Also have UNIT, ON_HAND if needed
        }
      },
      error: (err) => {
        console.error('Error fetching item:', err);
        // Optional: clear fields or alert
        this.returnItems[index].itemName = '';
        this.returnItems[index].spec = '';
        alert('Item not found / ไม่พบข้อมูลสินค้า');
      }
    });
  }

  // ฟังก์ชันกดปุ่ม Return (ส่งข้อมูล)
  onSubmit() {
    // 1. Validate
    if (!this.selectedDivisionId) {
      alert("Please select Division / กรุณาเลือก Division");
      return;
    }
    // Check at least one valid item
    const validItems = this.returnItems.filter(i => i.itemNo && i.qty > 0);
    if (validItems.length === 0) {
      alert("Please add at least one valid item (ItemNo + Qty > 0) / กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
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

    // 5. Call Service
    this.returnService.saveReturnRequest(dataToSend).subscribe({
      next: (res) => {
        // alert(`Save Success! DocNo: ${res.docNo} / บันทึกสำเร็จ`);
        // Use SweetAlert2 as requested
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Saved ${validItems.length} records successfully! (DocNo: ${res.docNo})`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6'
        });

        // Reset form or redirect
        this.returnItems = [{ partNo: '', itemNo: '', itemName: '', spec: '', qty: 0, remark: '' }];
        this.selectedFacility = '';
        this.selectedProcess = '';
        this.phoneNumber = '';
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
}