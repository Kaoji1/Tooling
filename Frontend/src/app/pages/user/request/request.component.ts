import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RequestService } from '../../../core/services/request.service';
import { CartService } from '../../../core/services/cart.service';
import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter } from '../../../core/utils/custom-date-adapter';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

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
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule
  ],
  providers: [
    DatePipe,
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './request.component.html',
  styleUrl: './request.component.scss'
})
export class requestComponent implements OnInit {

  Tooling_: string | null = null; // เริ่มต้นเป็น null
  ToolingList = [
    { label: 'Cutting tool', value: 'Cutting tool' },
    { label: 'Setup tool', value: 'Setup tool' }
  ];

  // เพิ่มตัวแปรเก็บข้อมูล Setup Tool ที่เกี่ยวข้อง
  relatedSetupItems: any[] = [];

  // ไม่ใช้แล้ว (onToolingChange) เพราะ logic เปลี่ยน

  // Dropdown data
  Div_: any;
  Fac_: any;
  Case_: any = null;
  PartNo_: any = null;
  Process_: any = null;
  MachineType_: any = null;
  ItemNo_: any = null;
  caseother: any = null;
  Spec_: any = null;
  setupItem = [];
  otherItem = [];
  PathDwg_: any;

  // option dropdown
  spec: any = [];
  Division: any = [];
  Fac: any = [];
  Case: any = [];
  PartNo: any = [];
  Process: any = [];
  MachineType: any = [];
  ItemNoList: any = [];
  Caseother: any = [];

  // Form fields
  phone_: string = '';
  DueDate_: Date | null = null;
  today_: Date = new Date();
  InputDate_: string = '';
  MCNo_: string = ''; // Keep for backward compatibility or direct binding if needed, but mainly use mcTags
  mcTags: string[] = []; // Store MC No tags

  // Table data
  items: any = []; // array เก่าวแปรสำหรับเก็บรายการข้อมูล (items) ที่มีอยู่แล้ว
  item: any; // array ใหม่ ตัวแปรสำหรับเก็บข้อมูล item ใหม่
  selectedType: string = '';
  isSearched: boolean = false;
  selectAllChecked: boolean = true;
  selectAllSetupChecked: boolean = true;
  loading: boolean = false; // เก็บสถานะกำลังโหลด
  selectedFileName: string = '';

  // Modal สำหรับ View Detail
  showDetailModal: boolean = false;
  selectedItem: any = null;
  detailItems: any[] = [];
  loadingDetail: boolean = false;

  constructor(
    private cartService: CartService,
    private api: RequestService,
    private detailPurchaseService: DetailPurchaseRequestlistService,
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {
    // Set today's date for min date validation
    this.today_ = new Date();

    // กำหนดตัวเลือกในdropdown
    this.Case = [
      { label: 'SET', value: 'SET' },
      { label: 'USA', value: 'USA' },
      { label: 'BRO', value: 'BRO' },
      { label: 'BUR', value: 'BUR' },
      { label: 'CHA', value: 'CHA' },
      { label: 'F/A', value: 'F/A' },
      { label: 'HOL', value: 'HOL' },
      { label: 'JIG', value: 'JIG' },
      { label: 'MOD', value: 'MOD' },
      { label: 'N/G', value: 'N/G' },
      { label: 'P/P', value: 'P/P' },
      { label: 'REC', value: 'REC' },
      { label: 'INV', value: 'INV' },
      { label: 'SPA', value: 'SPA' },
      { label: 'CBD', value: 'CBD' },
    ];
  }

  async ngOnInit() {
    // 1. Load Divisions first
    this.api.get_Setup_Division().subscribe({
      next: (response: any[]) => {
        // Map: Division_Id, Profit_Center, Division_Name
        const mapped = response.map(item => ({
          Division: item.Profit_Center,
          Division_Id: item.Division_Id,
          DivisionName: item.Profit_Center === '7122' ? 'GM'
            : item.Profit_Center === '71DZ' ? 'PMC'
              : item.Division_Name || item.Profit_Center,
          Profit_Center: item.Profit_Center
        }));

        // Deduplicate
        const seen = new Set();
        this.Division = mapped.filter(item => {
          const duplicate = seen.has(item.DivisionName);
          seen.add(item.DivisionName);
          return !duplicate;
        });

        // 2. Check Query Params AFTER Division is loaded
        this.route.queryParams.subscribe(params => {
          if (params['fromPlan']) {
            this.autoFillFromPlan(params);
          } else {
            this.loadState();
          }
        });
      },
      error: (e: any) => console.error(e),
    });
  }

  autoFillFromPlan(params: any) {
    console.log('🚀 Auto-filling from Plan:', params);

    // 1. Set Case & Tooling
    this.Case_ = params['case'] || 'SET';

    // Default to Cutting tool, but check if MC suggests Setup
    // (Logic could be refined if there's a specific pattern for Setup MCs)
    this.Tooling_ = 'Cutting tool';

    // 2. Match Division
    const divParam = params['division'];
    const foundDiv = this.Division.find((d: any) =>
      d.DivisionName === divParam || d.Profit_Center === divParam
    );

    if (foundDiv) {
      this.Div_ = foundDiv;

      // 3. Load PartNo (Cascade)
      const divisionCode = foundDiv.Division || foundDiv;

      // Load Facility and Match
      this.api.get_Setup_Facility({ Division: divisionCode }).subscribe((facs: any[]) => {
        const seen = new Set<string>();
        this.Fac = facs.map((f: any) => {
          const name = f.FacilityName || f.FacilityShort || '';
          const match = name.match(/F\.\d+/);
          const shortName = match ? match[0] : name;
          return { FacilityName: name, FacilityShort: shortName };
        }).filter((f: any) => {
          if (seen.has(f.FacilityShort)) return false;
          seen.add(f.FacilityShort);
          return true;
        });

        // Match Fac
        const facParam = params['fac']; // e.g., "F.1" or "F.4"
        const foundFac = this.Fac.find((f: any) => f.FacilityShort === facParam || f.FacilityName === facParam);
        if (foundFac) this.Fac_ = foundFac;
      });

      // Handle MC No (Tags)
      const mcNoParam = params['mcNo'];
      if (mcNoParam && mcNoParam !== '-') {
        // Split by comma if multiple, or just take as is
        this.mcTags = mcNoParam.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
      }

      // Handle Date (DueDate)
      const dateParam = params['date'];
      if (dateParam) {
        // Expected format from PlanList: dd/mm/yyyy
        const parts = dateParam.split('/');
        if (parts.length === 3) {
          // new Date(year, monthIndex, day)
          this.DueDate_ = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          // Try standard parsing
          this.DueDate_ = new Date(dateParam);
        }
      }

      this.api.get_CaseSET_Dropdown_PartNo({ Division: divisionCode, ItemNo: null }).subscribe((parts: any[]) => {
        this.PartNo = parts.map((p: any) => ({ PartNo: p.PartNo }));

        // 4. Match PartNo
        const foundPart = this.PartNo.find((p: any) => p.PartNo === params['partNo']);
        if (foundPart) {
          this.PartNo_ = foundPart;

          // 5. Load Process
          this.api.get_CaseSET_Dropdown_Process({
            Division: divisionCode,
            PartNo: foundPart.PartNo,
            ItemNo: null
          }).subscribe((procs: any[]) => {
            this.Process = procs.map(p => ({ Process: p.Process }));

            // 6. Match Process
            const foundProc = this.Process.find((p: any) => p.Process === params['process']);
            if (foundProc) {
              this.Process_ = foundProc;

              // 7. Load MC
              this.api.get_CaseSET_Dropdown_MC({
                Division: divisionCode, PartNo: foundPart.PartNo, Process: foundProc.Process, ItemNo: null
              }).subscribe((mcs: any[]) => {
                this.MachineType = mcs.map((m: any) => ({ MC: m.MC }));

                // 8. Match MC
                const foundMC = this.MachineType.find((m: any) => m.MC === params['mc']);
                if (foundMC) this.MachineType_ = foundMC;

                // 9. Trigger View (Search)
                setTimeout(() => this.Setview(), 100);
              });
            }
          });
        }
      });
    }
  }

  // ==========================================
  //    Persistence Logic
  // ==========================================
  saveState() {
    const state = {
      Tooling_: this.Tooling_,
      Div_: this.Div_,
      Fac_: this.Fac_,
      Case_: this.Case_,
      PartNo_: this.PartNo_,
      Process_: this.Process_,
      MachineType_: this.MachineType_,
      ItemNo_: this.ItemNo_,
      phone_: this.phone_,
      DueDate_: this.DueDate_,
      items: this.items,
      relatedSetupItems: this.relatedSetupItems,
      isSearched: this.isSearched,
      selectAllChecked: this.selectAllChecked,
      selectAllSetupChecked: this.selectAllSetupChecked,
      // Lists
      Fac: this.Fac,
      PartNo: this.PartNo,
      Process: this.Process,
      MachineType: this.MachineType,
      ItemNoList: this.ItemNoList,
      mcTags: this.mcTags // Save tags
    };
    this.api.saveRequestState(state);
  }

  private loadState() {
    const state = this.api.getRequestState();
    if (state) {
      console.log('🔄 Restoring Request Page State...');
      this.Tooling_ = state.Tooling_;
      this.Div_ = state.Div_;
      this.Fac_ = state.Fac_;
      this.Case_ = state.Case_;
      this.PartNo_ = state.PartNo_;
      this.Process_ = state.Process_;
      this.MachineType_ = state.MachineType_;
      this.ItemNo_ = state.ItemNo_;
      this.phone_ = state.phone_;
      this.DueDate_ = state.DueDate_ ? new Date(state.DueDate_) : null;
      this.items = state.items;
      this.relatedSetupItems = state.relatedSetupItems;
      this.isSearched = state.isSearched;
      this.selectAllChecked = state.selectAllChecked;
      this.selectAllSetupChecked = state.selectAllSetupChecked;

      // Restore Lists
      this.Fac = state.Fac || [];
      this.PartNo = state.PartNo || [];
      this.Process = state.Process || [];
      this.MachineType = state.MachineType || [];
      this.ItemNoList = state.ItemNoList || [];
      this.mcTags = state.mcTags || []; // Restore tags
    }
  }

  toggleAllCheckboxes() {
    for (const item of this.items) {
      item.checked = this.selectAllChecked;
    }
    this.saveState();
  }

  toggleAllSetupCheckboxes() {
    for (const item of this.relatedSetupItems) {
      item.checked = this.selectAllSetupChecked;
    }
    this.saveState();
  }

  // เรียกใช้ตัวดึงapi (ดึงข้อมูล Division)
  // เรียกใช้ตัวดึงapi (ดึงข้อมูล Division) - Replaced by ngOnInit logic but kept for reference if needed elsewhere
  Get_Division() {
    // ... moved to ngOnInit for better initialization flow
  }

  // Logic เมื่อเลือก Case
  onCaseChange() {
    // Reset ค่า PartNo/Process/MC ทุกครั้งที่เปลี่ยน Case
    this.PartNo_ = null;
    this.Process_ = null;
    this.MachineType_ = null;
    this.ItemNo_ = null;
    this.MCNo_ = '';
    this.items = [];
    this.relatedSetupItems = [];

    if (this.Case_ === 'SET') {
      // ถ้าเป็น SET ให้ Default เป็น Cutting tool (และจะโชว์ Setup items ใน table แยก)
      this.Tooling_ = 'Cutting tool';
      // โหลด PartNo ใหม่ทันทีตาม Division ที่เลือกไว้
      console.log('🔵 Case SET Selected - Div_:', this.Div_, 'Tooling_:', this.Tooling_);
      if (this.Div_) {
        this.get_PartNo(this.Div_);
      }
    } else {
      // ถ้าเคสอื่น ให้เคลียร์ Tooling_ เพื่อรอ User กดเลือกปุ่ม
      this.Tooling_ = null;
    }
    this.saveState();
  }

  // Logic เมื่อกดปุ่มเลือกประเภท Tool (Setup/Cutting)
  selectTooling(type: string) {
    this.Tooling_ = type;
    // Reset ข้อมูล
    this.PartNo_ = null;
    this.Process_ = null;
    this.MachineType_ = null;
    this.ItemNo_ = null;
    this.MCNo_ = '';
    this.items = [];
    this.relatedSetupItems = [];

    // โหลด PartNo ใหม่
    if (this.Div_) {
      this.get_PartNo(this.Div_);
    }

    // โหลด ItemNo List (สำหรับ Case ที่ไม่ใช่ SET)
    if (this.Case_ && this.Case_ !== 'SET' && this.Div_) {
      this.loadItemNoList();
      // ไม่ต้องโหลด PartNo ทันทีที่นี่ รอให้เลือก ItemNo หรือไม่ก็โหลด PartNo ทั้งหมดถ้า ItemNo ว่าง (ซึ่ง get_PartNo จัดการให้)
    } else {
      // โหลด PartNo ใหม่ (สำหรับ Case SET หรือ Division เปลี่ยน)
      if (this.Div_) {
        this.get_PartNo(this.Div_);
      }
    }
    this.saveState();
  }

  // โหลด ItemNo Dropdown
  loadItemNoList() {
    const divisionId = this.Div_?.Division || this.Div_;
    if (!divisionId) return;

    // Filter by PartNo if selected (Bi-directional)
    const partNo = this.PartNo_?.PartNo || this.PartNo_ || null;

    this.api.get_CaseSET_Dropdown_ItemNo({
      Division: divisionId,
      ToolingType: this.Tooling_,
      PartNo: partNo
    }).subscribe({
      next: (response: any[]) => {
        this.ItemNoList = response.map(item => ({
          ItemNo: item.ItemNo
        }));
        console.log('🟢 ItemNo Dropdown loaded:', this.ItemNoList.length, 'items');
      },
      error: (e) => console.error('ItemNo Dropdown Error:', e)
    });
  }

  // เมื่อเลือก ItemNo
  onItemNoChange(event: any) {
    console.log('🟡 ItemNo changed:', this.ItemNo_);
    // ✅ BUG FIX: Don't clear fields, just refresh lists
    // this.Process_ = null;
    // this.MachineType_ = null;

    this.get_PartNo(this.Div_);

    // Refresh dependent lists to ensure data consistency
    if (this.PartNo_) {
      this.get_Process(this.PartNo_);
    }
    if (this.Process_) {
      this.get_MC(this.Process_);
    }

    this.saveState();
  }


  // ดึงข้อมูล PartNo (ใช้ API เดียวกันทุก Case)
  async get_PartNo(event: any) {
    if (!event) return;
    if (!this.Tooling_) return;

    const division = event.Division ?? event;
    if (!division) return;

    // ItemNo_ อาจเป็น Object (จาก ng-select เก่า) หรือ String (จาก input ใหม่)
    const itemNo = typeof this.ItemNo_ === 'string' ? this.ItemNo_ : (this.ItemNo_?.ItemNo || null);

    console.log('🔵 get_PartNo - division:', division, 'Tooling_:', this.Tooling_, 'ItemNo:', itemNo);

    this.api.get_CaseSET_Dropdown_PartNo({ Division: division, ItemNo: itemNo }).subscribe({
      next: (response: any[]) => {
        this.PartNo = response.map(p => ({ PartNo: p.PartNo }));
        console.log('🟢 PartNo loaded:', this.PartNo.length, 'items');
      },
      error: (e) => console.error('PartNo Error:', e),
    });
  }

  onDivisionChange(value: any) {
    // เมื่อเปลี่ยน Division
    this.get_Facility(value);

    // ถ้าเลือก Case และ Tooling แล้ว ให้โหลด PartNo ใหม่ด้วย
    if (this.Tooling_) {
      this.get_PartNo(value);
    }
  }

  async get_Facility(event: any) {
    if (!event) return;

    // Division object มี: { Division: "71DZ", Division_Id: 2, DivisionName: "PMC", Profit_Center: "71DZ" }
    // เปลี่ยนมาใช้ Division (Profit_Center) เพื่อให้ตรงกับ Backend ชุดใหม่
    const divisionCode = event.Division || event;
    if (!divisionCode) return;

    console.log('get_Facility - sending Division Code:', divisionCode);

    // ใช้ SP: Stored_Get_Dropdown_Facility_By_Division (รับ @Profit_Center NVARCHAR)
    this.api.get_Setup_Facility({ Division: divisionCode }).subscribe({
      next: (response: any[]) => {
        // Extract "F.X" suffix from FacilityName and deduplicate
        const seen = new Set<string>();
        this.Fac = response
          .map(f => {
            const name = f.FacilityName || f.FacilityShort || '';
            const match = name.match(/F\.\d+/);
            const shortName = match ? match[0] : name;
            return { FacilityName: name, FacilityShort: shortName };
          })
          .filter(f => {
            if (seen.has(f.FacilityShort)) return false;
            seen.add(f.FacilityShort);
            return true;
          });
        console.log('Facility Dropdown:', this.Fac);
      },
      error: (e) => console.error('Error get_Facility:', e),
    });
  }

  // Process (ใช้ API เดียวกันทุก Case)
  async get_Process(event: any) {
    const partNo = event?.PartNo ?? event;
    const division = this.Div_?.Division || this.Div_;
    const itemNo = typeof this.ItemNo_ === 'string' ? this.ItemNo_ : (this.ItemNo_?.ItemNo || null);

    // ⭐ Strict Cascade: ต้องเลือก PartNo ก่อน
    if (!partNo || !division) return;

    this.api.get_CaseSET_Dropdown_Process({
      Division: division,
      PartNo: partNo,
      ItemNo: itemNo
    }).subscribe({
      next: (response: any[]) => {
        this.Process = response.map(p => ({ Process: p.Process }));
        console.log('🟢 Process loaded:', this.Process.length, 'items');
      },
      error: (e) => console.error('Process Error:', e)
    });
  }

  // MachineType (ใช้ API เดียวกันทุก Case)
  async get_MC(event: any) {
    const process = event?.Process ?? event;
    const division = this.Div_?.Division || this.Div_;
    const partNo = this.PartNo_?.PartNo || this.PartNo_;
    const itemNo = typeof this.ItemNo_ === 'string' ? this.ItemNo_ : (this.ItemNo_?.ItemNo || null);

    // ⭐ Strict Cascade: ต้องเลือก Process ก่อน
    if (!process || !division || !partNo) return;

    this.api.get_CaseSET_Dropdown_MC({ Division: division, PartNo: partNo, Process: process, ItemNo: itemNo }).subscribe({
      next: (response: any[]) => {
        this.MachineType = response.map(m => ({ MC: m.MC, Process: process }));
        console.log('🟢 MC loaded:', this.MachineType.length, 'items');
      },
      error: (e) => console.error('MC Error:', e)
    });
  }

  // โหลด Machine Type ตาม Division เท่านั้น (ใช้แสดงเฉยๆ ไม่ใช้กรอง)
  async get_MC_ByDivision(event: any) {
    if (!event) return;
    const divisionId = event.Division || event;
    if (!divisionId) return;

    console.log('get_MC_ByDivision - Division:', divisionId);

    // เรียก API ดึง MC ทั้งหมดใน Division นี้
    this.api.get_MC_ByDivision({ Division: divisionId }).subscribe({
      next: (response: any[]) => {
        // Did you mean to assign response to something? 
        // Based on previous code, this was likely intended to populate MachineType or similar, 
        // but the previous snapshot showed it commented out or empty next block.
        // Assuming we just log it or maybe it's not used yet?
        // Ah, looking at the previous file content, it was:
        // this.MachineType = response.map(...)
        // But in the snapshot I saw, lines 459-461 were messed up with 'error: (e)...' appearing inside next?
        // Let's fix the structure.
        this.MachineType = response.map(m => ({ MC: m.MC }));
        console.log('🔵 MC by Division loaded:', this.MachineType.length, 'items');
      },
      error: (e: any) => console.error('get_MC_ByDivision Error:', e)
    });
  }


  Setview() {
    const Division = this.Div_?.Division || this.Div_;
    const FacilityName = this.Fac_
      ? (typeof this.Fac_ === 'string' ? this.Fac_ : this.Fac_.FacilityShort)
      : '';
    const PartNo = this.PartNo_?.PartNo || this.PartNo_;
    const Process = this.Process_?.Process || this.Process_;
    const DueDate_ = this.DueDate_;
    const Case_ = this.Case_;

    // ===== ตรวจสอบฟิลด์ =====
    const missingFields: string[] = [];
    if (!Division) missingFields.push("Division");
    if (!FacilityName) missingFields.push("FacilityName");
    if (!PartNo) missingFields.push("PartNo");
    if (!Process) missingFields.push("Process");

    // DueDate is required only for Case SET
    if (Case_ === 'SET' && !DueDate_) missingFields.push("DueDate");

    if (!Case_) missingFields.push("Case");

    if (missingFields.length > 0) {
      Swal.fire({
        title: '<span style="color:#f59e0b; font-weight:800;">Incomplete Data</span>',
        html: `<div style="text-align:left; background:#fffbeb; border-radius:12px; padding:1.25rem; border:1px solid #fef3c7; color:#92400e;">
          กรุณากรอกข้อมูลให้ครบถ้วน:<br><ul style="margin:10px 0 0 20px; padding:0;">` +
          missingFields.map(f => `<li>${f}</li>`).join('') + '</ul></div>',
        icon: 'warning',
        confirmButtonText: 'ตกลง',
        customClass: {
          popup: 'swal-premium-popup',
          title: 'swal-premium-title',
          confirmButton: 'swal-premium-confirm'
        }
      });
      return;
    }

    this.loading = true;

    // ⭐ Unified: ทุก Case ใช้ API เดียวกัน (get_CaseSET_All)
    const MC = this.MachineType_ ? this.MachineType_.MC : '';
    const ItemNo = typeof this.ItemNo_ === 'string' ? this.ItemNo_ : (this.ItemNo_?.ItemNo || '');
    const data = { Division, FacilityName, PartNo, Process, MC, ItemNo };

    console.log('🔵 Setview() - Unified Search:', data, 'Tooling_:', this.Tooling_, 'Case_:', Case_);

    this.api.get_CaseSET_All(data).subscribe({
      next: (response: any[]) => {
        console.log('🟢 Unified Data:', response.length, 'items');

        const defaultQty = Math.max(1, this.mcTags.length);

        if (this.Case_ === 'SET') {
          // === Case SET: แสดง Cutting + Setup ===
          this.items = response.map(item => ({
            ...item,
            PartNo: item.PartNo || item.Part_No,
            ItemNo: item.ItemNo || item.Cutting_Item_No,
            SPEC: item.SPEC || item.Cutting_Spec,
            MC: item.MC || item.MC_Group,
            ItemName: item.Cutting_Name, // Map for Cutting Tool
            checked: true,
            QTY: item.QTY ?? defaultQty,
            FreshQty: item.FreshQty ?? 0,
            ReuseQty: item.ReuseQty ?? 0
          }));

          this.relatedSetupItems = response
            .filter(item => item.Setup_ID)
            .map(item => ({
              ...item,
              PartNo: item.PartNo || item.Part_No,
              ItemNo: item.Setup_Item_No || item.ItemNo,
              ItemName: item.Setup_Name, // Use Setup_Name specifically
              SPEC: item.Setup_Spec || item.SPEC,
              MC: item.MC || item.MC_Group,
              Process: item.Process,
              Position: item.Position,
              checked: true,
              QTY: defaultQty
            }));

        } else if (this.Tooling_ === 'Setup tool') {
          // === Case อื่น + Setup Tool: แสดงเฉพาะ Setup ===
          this.relatedSetupItems = [];
          this.items = response
            .filter(item => item.Setup_ID)
            .map(item => ({
              ...item,
              PartNo: item.PartNo || item.Part_No,
              ItemNo: item.Setup_Item_No || item.ItemNo,
              ItemName: item.Setup_Name, // Map for Setup Tool
              SPEC: item.Setup_Spec || item.SPEC,
              MC: item.MC || item.MC_Group,
              checked: true,
              QTY: defaultQty,
              FreshQty: 0,
              ReuseQty: 0
            }));

        } else {
          // === Case อื่น + Cutting Tool: แสดงเฉพาะ Cutting ===
          this.relatedSetupItems = [];
          this.items = response.map(item => ({
            ...item,
            PartNo: item.PartNo || item.Part_No,
            ItemNo: item.ItemNo || item.Cutting_Item_No,
            ItemName: item.Cutting_Name, // Map for Cutting Tool (non-SET)
            SPEC: item.SPEC || item.Cutting_Spec,
            MC: item.MC || item.MC_Group,
            checked: true,
            QTY: item.QTY ?? defaultQty,
            FreshQty: item.FreshQty ?? 0,
            ReuseQty: item.ReuseQty ?? 0
          }));
        }

        this.loading = false;
        this.isSearched = true;
        this.saveState(); // Save results
      },
      error: (e) => {
        console.error('Unified API Error:', e);
        this.loading = false;
        Swal.fire({
          title: '<span style="color:#ef4444; font-weight:800;">Error</span>',
          text: 'ไม่สามารถดึงข้อมูลได้',
          icon: 'error',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title',
            confirmButton: 'swal-premium-confirm'
          }
        });
      }
    });
  }

  get getSelectedItemsCount(): number {
    const mainChecked = (this.items || []).filter((item: any) => item.checked).length;
    const setupChecked = (this.relatedSetupItems || []).filter((item: any) => item.checked).length;
    return mainChecked + setupChecked;
  }

  // ==========================================
  //    MC No Tag Input Logic
  // ==========================================
  addMCTag(event: any) {
    const input = event.target;
    const value = input.value.trim();

    // Check if Enter or Space was pressed, OR if it's a 'blur' event
    const isTriggerKey = event.key === 'Enter' || event.key === ' ';
    const isBlurEvent = event.type === 'blur';

    if ((isTriggerKey || isBlurEvent) && value) {
      if (isTriggerKey) event.preventDefault(); // Prevent form submission or extra space

      // Check for duplicates before pushing
      if (!this.mcTags.includes(value)) {
        this.mcTags.push(value);
        input.value = ''; // Clear input
        this.updateQtyFromMcTags();
        this.saveState();
      } else {
        // Just clear if duplicate
        input.value = '';
      }
    } else if (event.key === 'Backspace' && !value && this.mcTags.length > 0) {
      // Remove last tag if backspace pressed on empty input
      this.mcTags.pop();
      this.updateQtyFromMcTags();
      this.saveState();
    }
  }

  removeMCTag(index: number) {
    this.mcTags.splice(index, 1);
    this.updateQtyFromMcTags();
    this.saveState();
  }

  // Auto-populate QTY based on MC No tag count (editable, user can still change)
  private updateQtyFromMcTags() {
    const qty = Math.max(1, this.mcTags.length);
    for (const item of this.items) {
      item.QTY = qty;
    }
    for (const setup of this.relatedSetupItems) {
      setup.QTY = qty;
    }
  }

  // Helper to get alternating colors for tags
  getTagClass(index: number): string {
    const classes = ['tag-blue', 'tag-green', 'tag-purple', 'tag-orange'];
    return classes[index % classes.length];
  }

  // ========================================
  //   Submit Request (Direct Insert)
  // ========================================
  AddToCart() {
    // 1. Collect checked Cutting Tool items
    const checkedCutting = this.items.filter((item: any) => item.checked && item.QTY);
    // 2. Collect checked Setup Tool items (from relatedSetupItems for CASE SET)
    const checkedSetup = this.relatedSetupItems.filter((item: any) => item.checked && item.QTY);

    // Validate: at least one item must have QTY filled
    const totalChecked = this.items.filter((i: any) => i.checked).length
      + this.relatedSetupItems.filter((i: any) => i.checked).length;
    const totalValid = checkedCutting.length + checkedSetup.length;

    if (totalChecked > 0 && totalValid < totalChecked) {
      Swal.fire({
        icon: 'warning',
        title: '<span style="color:#f59e0b; font-weight:800;">Incomplete Data</span>',
        text: 'กรุณากรอก QTY ให้ครบทุกรายการที่เลือก',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'swal-premium-popup',
          title: 'swal-premium-title',
          confirmButton: 'swal-premium-confirm'
        }
      });
      return;
    }

    if (totalValid === 0) {
      Swal.fire({
        icon: 'warning',
        title: '<span style="color:#f59e0b; font-weight:800;">No Item Selected</span>',
        text: 'กรุณาเลือกอย่างน้อย 1 รายการเพื่อส่งคำขอ',
        confirmButtonText: 'ตกลง',
        customClass: {
          popup: 'swal-premium-popup',
          title: 'swal-premium-title',
          confirmButton: 'swal-premium-confirm'
        }
      });
      return;
    }

    // Prepare common data
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const Employee_ID = currentUser.Employee_ID || 'Unknown';

    let rawFac = '';
    if (this.Fac_) {
      if (typeof this.Fac_ === 'string') rawFac = this.Fac_;
      else if (this.Fac_.FacilityName) rawFac = this.Fac_.FacilityName;
    }
    const FactoryNumberMatch = rawFac.match(/F\.(\d+)/);
    const Factory = FactoryNumberMatch ? parseInt(FactoryNumberMatch[1], 10) : null;

    const Division = this.Div_?.Division || this.Div_;
    const caseValue = this.Case_;

    // Map items with ToolType tag
    const mapItem = (item: any, toolType: string) => {
      let formattedDate = null;
      if (caseValue === 'SET' && this.DueDate_) {
        formattedDate = this.datePipe.transform(this.DueDate_, 'yyyy-MM-dd');
      }

      return {
        DocNo: null,
        Division: Division,
        Fac: Factory,
        ItemNo: item.ItemNo,
        PartNo: item.PartNo,
        Process: item.Process,
        CASE: item.Case_ || caseValue,
        MCType: item.MC,
        SPEC: item.SPEC,
        QTY: item.QTY,
        Req_QTY: item.QTY,
        DueDate: formattedDate,
        Status: 'Waiting',
        MCNo: this.mcTags.length > 0 ? this.mcTags.join(',') : this.MCNo_, // Join tags or use input
        PathDwg: toolType === 'CuttingTool' ? this.PathDwg_ : null,
        ON_HAND: item.ON_HAND,
        PhoneNo: this.phone_,
        Requester: Employee_ID,
        ItemName: item.ItemName || null,
        ToolType: toolType,
        MFGOrderNo: item.MFGOrderNo || null,
        MR_No: item.MR_No || null,
        Position: item.Position || null // ✅ Added for verification display
      };
    };

    const allItems: any[] = [];

    if (caseValue === 'SET') {
      checkedCutting.forEach((item: any) => allItems.push(mapItem(item, 'CuttingTool')));
      checkedSetup.forEach((item: any) => allItems.push(mapItem(item, 'SetupTool')));
    } else if (this.Tooling_ === 'Setup tool') {
      checkedCutting.forEach((item: any) => allItems.push(mapItem(item, 'SetupTool')));
    } else {
      checkedCutting.forEach((item: any) => allItems.push(mapItem(item, 'CuttingTool')));
    }

    // 🎨 Build Premium Confirmation Table (7 Columns)
    let summaryHtml = `
      <div style="text-align: left; font-family: 'Kanit', sans-serif; color: #334155;">
        
        <!-- Header Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
          <div style="font-size: 0.95rem;">
            <span style="font-weight: 700; color: #1e293b;">Division:</span> <span style="color: #2563eb; font-weight: 700;">${Division}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
            <span style="font-weight: 700; color: #1e293b;">Fac:</span> <span style="color: #2563eb; font-weight: 700;">F.${Factory}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
            <span style="font-weight: 700; color: #1e293b;">Case:</span> <span style="color: #2563eb; font-weight: 700;">${caseValue}</span>
          </div>
          <div style="font-size: 0.85rem; color: #64748b;">รายการที่ต้องการบันทึก</div>
        </div>

        <!-- Table Container -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 15px; max-height: 400px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left;">
            <thead style="position: sticky; top: 0; background-color: #f8fafc; z-index: 10;">
              <tr style="border-bottom: 2px solid #e2e8f0; color: #1e293b;">
                <th style="padding: 12px 10px; font-weight: 700;">Part No.</th>
                <th style="padding: 12px 10px; font-weight: 700;">Item No.</th>
                <th style="padding: 12px 10px; font-weight: 700;">Name</th>
                <th style="padding: 12px 10px; font-weight: 700;">Spec</th>
                <th style="padding: 12px 10px; font-weight: 700;">Process</th>
                <th style="padding: 12px 10px; font-weight: 700;">MC</th>
                <th style="padding: 12px 10px; font-weight: 700; text-align: center;">QTY</th>
              </tr>
            </thead>
            <tbody>
              ${allItems.map((item, index) => `
                <tr style="border-bottom: 1px dashed #e2e8f0; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 10px; font-weight: 700; color: #334155;">${item.PartNo || '-'}</td>
                  <td style="padding: 10px; color: #475569; font-weight: 600;">${item.ItemNo || '-'}</td>
                  <td style="padding: 10px; color: #64748b;">
                    <div style="max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.ItemName || '-'}">
                      ${item.ItemName || '-'}
                    </div>
                  </td>
                  <td style="padding: 10px; color: #64748b;">
                    <div style="max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.SPEC || '-'}">
                      ${item.SPEC || '-'}
                    </div>
                  </td>
                  <td style="padding: 10px; color: #64748b;">${item.Process || '-'}</td>
                  <td style="padding: 10px; color: #64748b;">${item.MCType || '-'}</td>
                  <td style="padding: 10px; font-weight: 700; text-align: center; color: #1e293b; font-size: 0.95rem;">${item.QTY}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Total Section -->
        <div style="text-align: right; font-size: 0.95rem; font-weight: 700; color: #475569; padding-right: 5px;">
          รวมจำนวนรายการทั้งหมด 
          <span style="color: #10b981; font-size: 1.4rem; font-weight: 800; margin: 0 8px;">${allItems.length}</span> 
          รายการ
        </div>
      </div>`;

    // 🎨 Premium Confirmation Dialog
    Swal.fire({
      title: '<span style="font-family: Kanit; font-weight: 800; color: #1e293b; font-size: 1.75rem;">Confirm Submission</span>',
      html: summaryHtml,
      width: 900,
      showCancelButton: true,
      confirmButtonText: 'Submit Final Request',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      customClass: {
        popup: 'swal-premium-popup-minimal',
        confirmButton: 'swal-premium-btn-primary',
        cancelButton: 'swal-premium-btn-secondary'
      },
      backdrop: `rgba(15, 23, 42, 0.6)`,
      showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
      hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
    }).then((result) => {
      if (result.isConfirmed) {
        // Step 2: "Are you sure?" confirmation prompt
        Swal.fire({
          title: '<span style="font-family: Kanit; font-weight: 800; color: #1e293b; font-size: 1.4rem;">Are you sure?</span>',
          html: '<span style="font-family: Kanit; color: #334155;">คุณต้องการบันทึกคำขอทั้งหมดนี้ใช่หรือไม่?</span>',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Submit!',
          cancelButtonText: 'Go back',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#94a3b8',
          width: 450,
          customClass: {
            popup: 'swal-premium-popup-minimal',
            confirmButton: 'swal-premium-btn-primary',
            cancelButton: 'swal-premium-btn-secondary'
          },
          backdrop: `rgba(15, 23, 42, 0.6)`
        }).then((res2) => {
          if (res2.isConfirmed) {
            this.executeSubmit(allItems);
          } else if (res2.dismiss === Swal.DismissReason.cancel) {
            this.AddToCart(); // Reopen the first modal
          }
        });
      }
    });
  }

  // ========================================
  //   Execute Submit (API Call)
  // ========================================
  private executeSubmit(allItems: any[]) {
    this.loading = true; // ✅ Ensure button is disabled

    // Show Loading sequence
    Swal.fire({
      title: '',
      html: `
        <div style="padding: 20px;">
          <svg width="80" height="80" viewBox="0 0 50 50" style="margin: 0 auto; display: block;">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#e2e8f0" stroke-width="4" />
            <circle cx="25" cy="25" r="20" fill="none" stroke="#3b82f6" stroke-width="4" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
              <animate attributeName="stroke-dasharray" values="1,150;90,150;1,150" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <path d="M25 15 L25 25 L32 25" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" fill="none">
               <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="4s" repeatCount="indefinite" />
            </path>
          </svg>
          <div style="font-family: 'Kanit', sans-serif; margin-top: 20px; color: #1e293b; font-weight: 600; font-size: 1.1rem;">
            Saving your plans...
          </div>
          <div style="font-family: 'Kanit', sans-serif; margin-top: 5px; color: #64748b; font-size: 0.85rem;">
            รอสักครู่นะครับ เรากำลังจัดการข้อมูลให้คุณ.
          </div>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      customClass: {
        popup: 'swal-premium-popup-minimal'
      }
    });

    // forkJoin for artificial delay + API call
    forkJoin([
      timer(1500),
      this.detailPurchaseService.insertRequestBulk(allItems)
    ]).subscribe({
      next: ([_, res]) => {
        this.loading = false;
        const total = res?.successCount ?? allItems.length;

        // Success turtle animation
        Swal.fire({
          html: `
            <svg width="200" height="120" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto; display: block; overflow: visible;">
                <path d="M 0 100 Q 100 98 200 100" stroke="#1d1d1f" stroke-width="2" fill="none" stroke-linecap="round"/>
                <g class="walking-turtle-group" transform="translate(10, 5)">
                  <path class="turtle-leg-back" d="M 125 95 C 120 75 145 75 140 95" fill="#fff" stroke="#1d1d1f" stroke-width="2"/>
                  <path class="turtle-leg-back" d="M 85 95 C 80 75 105 75 100 95" fill="#fff" stroke="#1d1d1f" stroke-width="2"/>
                  <path d="M 68 85 C 100 95 140 95 162 85" fill="#fff" stroke="#1d1d1f" stroke-width="2"/>
                  <path d="M 62 85 C 65 30 160 30 168 85" fill="#c4ebc8" stroke="#1d1d1f" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M 88 85 L 98 55 L 132 55 L 142 85" fill="none" stroke="#1d1d1f" stroke-width="2"/>
                  <path d="M 98 55 L 115 35 L 132 55" fill="none" stroke="#1d1d1f" stroke-width="2"/>
                  <path d="M 66 70 L 92 70 L 98 55 M 132 55 L 138 70 L 165 70" fill="none" stroke="#1d1d1f" stroke-width="2"/>
                  <path class="turtle-leg-front" d="M 110 85 C 105 105 130 105 125 85" fill="#fff" stroke="#1d1d1f" stroke-width="2"/>
                  <g class="turtle-leg-front">
                    <circle cx="115" cy="92" r="1.5" fill="#1d1d1f"/><circle cx="120" cy="95" r="1.5" fill="#1d1d1f"/><circle cx="122" cy="88" r="1.5" fill="#1d1d1f"/>
                  </g>
                  <path class="turtle-leg-front" d="M 70 85 C 65 105 90 105 85 85" fill="#fff" stroke="#1d1d1f" stroke-width="2"/>
                  <g class="turtle-leg-front">
                    <circle cx="75" cy="92" r="1.5" fill="#1d1d1f"/><circle cx="80" cy="95" r="1.5" fill="#1d1d1f"/><circle cx="82" cy="88" r="1.5" fill="#1d1d1f"/>
                  </g>
                  <path d="M 64 78 C 30 80 40 40 60 40 C 75 40 70 60 70 60" fill="#fff" stroke="#1d1d1f" stroke-width="2"/>
                  <circle cx="50" cy="50" r="2.5" fill="#1d1d1f"/>
                  <path d="M 58 55 C 60 62 48 65 46 60" fill="none" stroke="#1d1d1f" stroke-width="2" stroke-linecap="round"/>
                </g>
            </svg>
            <h2 style="color: #2e7d32; font-family: Kanit, sans-serif; font-size: 2.2rem; font-weight: 800; margin: 15px 0 5px 0;">Success!</h2>
            <p style="color: #5c6e58; font-family: Kanit, sans-serif; font-size: 1.1rem; margin: 0; font-weight: 500;">บันทึกข้อมูลคำอขอสำเร็จแล้ว</p>
            <p style="color: #8da488; font-family: Kanit, sans-serif; font-size: 0.95rem; margin-top: 5px;">(บันทึกทั้งหมด ${total} รายการ)</p>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Continue',
          showCloseButton: true,
          timer: 5000,
          timerProgressBar: true,
          customClass: {
            popup: 'swal-turtle-popup-success',
            confirmButton: 'swal-turtle-btn-success',
            actions: 'swal-turtle-actions'
          },
          backdrop: `rgba(15, 23, 42, 0.5)`
        });

        this.resetAfterSubmit();
      },
      error: (err) => {
        this.loading = false;
        console.error('Submit error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'ไม่สามารถส่งคำขอได้ กรุณาลองใหมีกครั้ง',
          customClass: {
            popup: 'swal-premium-popup-minimal'
          }
        });
      }
    });
  }

  // ✅ New Logic: Reset only transaction data, keep headers
  resetAfterSubmit() {
    // Keep: Tooling_, Div_, Fac_, phone_, Case_

    // Clear dependent dropdowns & inputs
    this.DueDate_ = null;
    this.PartNo_ = null;
    this.Spec_ = null;
    this.MachineType_ = null;
    this.Process_ = null;
    this.MCNo_ = '';
    this.ItemNo_ = null;
    this.PathDwg_ = null;

    // Clear items/search results
    this.items = [];
    this.relatedSetupItems = [];
    this.isSearched = false;
    this.loading = false; // Ensure loading is off

    // Save state (so headers persist on refresh)
    this.saveState();
  }

  // function clearall
  Clearall() {
    Swal.fire({
      title: '<span style="font-family: Kanit; font-weight: 800; color: #1e293b; font-size: 1.5rem;">Clear All Selection?</span>',
      text: 'รายการที่เลือกทั้งหมดจะถูกล้างทิ้ง คุณแน่ใจหรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      customClass: {
        popup: 'swal-premium-popup-minimal',
        confirmButton: 'swal-premium-btn-danger',
        cancelButton: 'swal-premium-btn-secondary'
      },
      backdrop: `rgba(15, 23, 42, 0.6)`
    }).then((result) => {
      if (result.isConfirmed) {
        this.resetForm();

        Swal.fire({
          icon: 'success',
          title: 'Cleared!',
          text: 'ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: 'swal-premium-popup-minimal'
          }
        });
      }
    });
  }

  private resetForm() {
    // Delete select group - KEEP Tooling_ and Case_ as requested
    // this.Tooling_ = null; 
    // this.Case_ = null;

    this.Div_ = null;
    this.Fac_ = null;
    this.DueDate_ = null;
    this.PartNo_ = null;
    this.Spec_ = null;
    this.MachineType_ = null;
    this.Process_ = null;
    this.phone_ = '';
    this.MCNo_ = '';
    this.mcTags = []; // ✅ Clear tags as well
    this.ItemNo_ = null;

    // Delete items
    this.items = [];
    this.relatedSetupItems = []; // ✅ เคลียร์ตารางล่างด้วย
    this.PathDwg_ = null;
    this.loading = false;
    this.isSearched = false;

    // Save state (persists the cleared form but keeps the Case/Tooling mode)
    this.saveState();
  }

  // upload file
  onFileChosen(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
    }
  }

  onPartNoChange() {
    this.Process_ = null;
    this.MachineType_ = null;

    // If Case isn't SET (has ItemNo field), reload ItemNo list to filter by selected PartNo
    if (this.Case_ && this.Case_ !== 'SET') {
      this.loadItemNoList();
    }
  }

  getRowClass(item: any): string {
    if (item.checked) {
      return 'row-selected';
    }
    return '';
  }

  // ==========================================
  //    View Detail Modal (Box/Shelf/Rack)
  // ==========================================

  openDetailModal(item: any) {
    this.selectedItem = item;
    this.showDetailModal = true;
    this.loadingDetail = true;
    this.detailItems = [];

    const Division = this.Div_?.Division || this.Div_;
    // ส่ง FacilityShort (F.6) ไปให้ SQL ใช้ LIKE '%F.6' กรอง
    const FacilityName = this.Fac_
      ? (typeof this.Fac_ === 'string' ? this.Fac_ : this.Fac_.FacilityShort)
      : '';

    const data = {
      Division: Division,
      ItemNo: item.ItemNo,
      FacilityName: FacilityName,  // เปลี่ยนจาก Facility เป็น FacilityName
      PartNo: item.PartNo,
      Process: item.Process
      // ลบ MC ออก
    };

    this.api.get_CaseSET_CuttingTool_Detail(data).subscribe({
      next: (response: any[]) => {
        this.detailItems = response;
        this.loadingDetail = false;
      },
      error: (e) => {
        console.error('Detail API Error:', e);
        this.loadingDetail = false;
      }
    });
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedItem = null;
    this.detailItems = [];
  }
}
// สวัสดีครับชาวโลก