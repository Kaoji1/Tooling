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
import { forkJoin, of } from 'rxjs';
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

  async onSubmit() {
    // 1. ตรวจสอบข้อมูล Header
    const Division = this.Div_?.Division || this.Div_;
    const FacilityName = this.Fac_
      ? (typeof this.Fac_ === 'string' ? this.Fac_ : this.Fac_.FacilityShort)
      : '';
    const PartNo = this.PartNo_?.PartNo || this.PartNo_;
    const Process = this.Process_?.Process || this.Process_;
    const Case_ = this.Case_;

    // Check if fields are missing (Reuse logic if needed, but for submit we double check)
    // Actually items won't be in the list if search failed, but let's be safe.
    if (!Division || !FacilityName || !PartNo || !Process || !Case_) {
      Swal.fire('Error', 'Please fill in all Header fields.', 'warning');
      return;
    }

    // 2. รวบรวม Item ที่ Checked
    const cuttingItems = this.items.filter((i: any) => i.checked);
    const setupItems = this.relatedSetupItems.filter((i: any) => i.checked);
    const allItems = [...cuttingItems, ...setupItems];

    if (allItems.length === 0) {
      Swal.fire('No Items Selected', 'Please select at least one item.', 'warning');
      return;
    }

    // 3. Prepare Premium "Bill" Html
    let billHtml = `
      <div style="text-align: left; font-family: 'Kanit', sans-serif; color: #334155; max-height: 400px; overflow-y: auto; padding-right: 5px;">
        
        <!-- Header Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; font-size: 0.9rem; background: #f8fafc; padding: 10px; border-radius: 8px;">
           <div><small style="color:#94a3b8;">CASE</small><br><strong>${Case_}</strong></div>
           <div><small style="color:#94a3b8;">DIVISION</small><br><strong>${Division}</strong></div>
           <div><small style="color:#94a3b8;">FACTORY</small><br><strong>${FacilityName}</strong></div>
           <div style="text-align:right;"><small style="color:#94a3b8;">TOTAL ITEMS</small><br><strong style="color:#2563eb; font-size:1.1rem;">${allItems.length}</strong></div>
        </div>

    `;

    // --- Cutting Tool Section ---
    if (cuttingItems.length > 0) {
      billHtml += `
        <div style="margin-bottom: 15px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px; color:#475569;">
            <i class="bi bi-tools" style="color:#64748b;"></i>
            <strong style="font-size:0.95rem;">Cutting Tool</strong>
            <span style="font-size:0.8rem; background:#e2e8f0; padding:1px 6px; border-radius:4px;">${cuttingItems.length}</span>
          </div>
          <table style="width:100%; font-size:0.85rem; border-collapse:collapse;">
            <tr style="border-bottom:1px solid #e2e8f0; color:#94a3b8; font-size:0.75rem;">
              <th style="text-align:left; padding:4px 0;">Item Name (Spec)</th>
              <th style="text-align:right; padding:4px 0;">Qty</th>
            </tr>
      `;
      cuttingItems.forEach((item: any) => {
        billHtml += `
           <tr style="border-bottom:1px dashed #f1f5f9;">
             <td style="padding:6px 0;">
               <div style="font-weight:500;">${item.ItemName || item.ItemNo}</div>
               <div style="font-size:0.75rem; color:#94a3b8;">${item.SPEC || '-'}</div>
             </td>
             <td style="text-align:right; font-weight:600; padding:6px 0;">${item.QTY}</td>
           </tr>
         `;
      });
      billHtml += `</table></div>`;
    }

    // --- Setup Tool Section ---
    if (setupItems.length > 0) {
      billHtml += `
        <div style="margin-bottom: 10px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px; color:#475569;">
            <i class="bi bi-gear" style="color:#64748b;"></i>
            <strong style="font-size:0.95rem;">Setup Tool</strong>
            <span style="font-size:0.8rem; background:#e2e8f0; padding:1px 6px; border-radius:4px;">${setupItems.length}</span>
          </div>
          <table style="width:100%; font-size:0.85rem; border-collapse:collapse;">
            <tr style="border-bottom:1px solid #e2e8f0; color:#94a3b8; font-size:0.75rem;">
              <th style="text-align:left; padding:4px 0;">Item Name (Spec)</th>
              <th style="text-align:right; padding:4px 0;">Qty</th>
            </tr>
      `;
      setupItems.forEach((item: any) => {
        billHtml += `
           <tr style="border-bottom:1px dashed #f1f5f9;">
             <td style="padding:6px 0;">
               <div style="font-weight:500;">${item.ItemName || item.ItemNo}</div>
               <div style="font-size:0.75rem; color:#94a3b8;">${item.SPEC || '-'}</div>
             </td>
             <td style="text-align:right; font-weight:600; padding:6px 0;">${item.QTY}</td>
           </tr>
         `;
      });
      billHtml += `</table></div>`;
    }

    billHtml += `</div>`; // Close Main Div

    // 4. Show Confirmation
    const result = await Swal.fire({
      title: '<span style="font-family: Kanit; font-weight: 700; color: #1e293b; font-size: 1.5rem;">Confirm Request</span>',
      html: billHtml,
      showCancelButton: true,
      confirmButtonText: 'Yes, Submit',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#94a3b8',
      width: 500,
      customClass: {
        popup: 'swal-premium-popup-minimal',
        confirmButton: 'swal-premium-btn-primary',
        cancelButton: 'swal-premium-btn-secondary'
      },
      backdrop: `rgba(15, 23, 42, 0.6)`
    });

    if (!result.isConfirmed) return;

    // 5. Show Loading
    Swal.fire({
      title: '',
      html: '<div style="font-family: Kanit; margin-top: 10px;">Submitting your request...</div>',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: { popup: 'swal-premium-popup-minimal' }
    });

    // 6. Execute Submit
    this.submitItemsOneByOne(allItems, Division, FacilityName, PartNo, Process);
  }

  // แยก Logic Save ออกมาเพื่อความสะอาด
  submitItemsOneByOne(
    items: any[],
    Division: string,
    FacilityName: string,
    PartNo: string,
    Process: string
  ): void {
    let completedCount = 0;
    let errorCount = 0;
    const total = items.length;

    // TODO: Consider sending BULK API instead of loop for atomic transaction
    // But for now, keeping existing loop structure as requested/existing pattern.
    // If user wants BULK later, we switch.

    // Create an array of observables
    const requests = items.map(item => {
      const payload = {
        Division: Division,
        Facility: FacilityName,
        Process: Process,
        Part_No: PartNo,
        ItemNo: item.ItemNo, // Ensure this maps to DB column
        ItemName: item.ItemName || item.Cutting_Name || item.Setup_Name,
        Spec: item.SPEC || item.Spec,
        QTY: item.QTY,
        Unit: item.Unit || 'pcs', // Default unit
        Requester: 'Guest', // Todo: Get from Session
        Remark: item.Remark || '',
        MC_No: this.MCNo_ || '', // Use the bound MCNo
        Ref_No: 'REQ-' + Date.now() // Simple Ref
      };

      return this.api.add_Request_Tooling(payload).pipe(
        tap({
          next: (res: any) => completedCount++,
          error: (err: any) => {
            console.error('Request Item Error:', err);
            errorCount++;
          }
        }),
        catchError((err: any) => of(null)) // Prevent chain breaking
      );
    });

    // Execute All
    forkJoin(requests).subscribe({
      next: () => {
        // Success Dialog (Premium)
        Swal.fire({
          title: '<span style="color:#059669; font-family: Kanit; font-weight: 700; font-size: 1.8rem;">Request Submitted!</span>',
          html: `
                 <div style="font-family: Kanit; color: #475569; margin-top: 10px;">
                   <p style="font-size: 1.1rem;">Successfully submitted <strong>${completedCount}</strong> items.</p>
                   ${errorCount > 0 ? `<p style="color:#ef4444; font-size:0.9rem;">(Failed: ${errorCount})</p>` : ''}
                 </div>
               `,
          showConfirmButton: true,
          confirmButtonText: 'Great!',
          confirmButtonColor: '#10b981',
          customClass: {
            popup: 'swal-premium-popup-minimal',
            confirmButton: 'swal-premium-btn-success'
          },
          backdrop: `rgba(15, 23, 42, 0.4)`
        });

        // Reset Form
        this.resetAfterSubmit();
      },
      error: (err: any) => {
        console.error('Submit Error:', err);
      }
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
            QTY: item.QTY ?? 1,
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
              QTY: 1
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
              QTY: 1,
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
            QTY: item.QTY ?? 1,
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
        this.saveState();
      } else {
        // Just clear if duplicate
        input.value = '';
      }
    } else if (event.key === 'Backspace' && !value && this.mcTags.length > 0) {
      // Remove last tag if backspace pressed on empty input
      this.mcTags.pop();
      this.saveState();
    }
  }

  removeMCTag(index: number) {
    this.mcTags.splice(index, 1);
    this.saveState();
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

    // 🎨 Build Detailed Verification Table
    let summaryHtml = `
      <div style="font-family: 'Kanit', sans-serif; color: #1e293b;">
        <!-- Header Info Cards -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div><small style="color:#64748b; text-transform:uppercase; font-size:0.65rem; font-weight:700;">Case Selection</small><br><strong style="color:#0f172a; font-size:0.9rem;">${caseValue}</strong></div>
          <div><small style="color:#64748b; text-transform:uppercase; font-size:0.65rem; font-weight:700;">Division / Factory</small><br><strong style="color:#0f172a; font-size:0.9rem;">${Division} / F.${Factory}</strong></div>
          <div style="text-align:right;"><small style="color:#64748b; text-transform:uppercase; font-size:0.65rem; font-weight:700;">Total Items</small><br><strong style="color:#2563eb; font-size:1rem;">${allItems.length}</strong></div>
        </div>

        <!-- Detailed Table -->
        <div style="max-height: 380px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
            <thead style="background: #f1f5f9; position: sticky; top: 0; z-index: 10;">
              <tr>
                <th style="padding: 10px 8px; border-bottom: 2px solid #e2e8f0; color:#475569; width: 130px;">Part No.</th>
                <th style="padding: 10px 8px; border-bottom: 2px solid #e2e8f0; color:#475569;">Item Info</th>
                <th style="padding: 10px 8px; border-bottom: 2px solid #e2e8f0; color:#475569; width: 90px;">Process/MC</th>
                <th style="padding: 10px 8px; border-bottom: 2px solid #e2e8f0; color:#475569; width: 50px; text-align:center;">Case</th>
                <th style="padding: 10px 8px; border-bottom: 2px solid #e2e8f0; color:#475569; width: 60px; text-align:center;">Pos.</th>
                <th style="padding: 10px 8px; border-bottom: 2px solid #e2e8f0; color:#475569; width: 50px; text-align:right;">QTY</th>
              </tr>
            </thead>
            <tbody>
              ${allItems.map(item => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px; font-weight: 600; color: #334155;">${item.PartNo}</td>
                  <td style="padding: 8px;">
                    <div style="font-weight: 700; color: #0f172a;">${item.ItemNo}</div>
                    <div style="font-size: 0.7rem; color: #64748b; line-height: 1.2;">${item.ItemName || ''}</div>
                    <div style="font-size: 0.7rem; color: #94a3b8; font-style: italic;">${item.SPEC || '-'}</div>
                  </td>
                  <td style="padding: 8px; color: #475569;">
                    <div style="font-weight: 600;">${item.Process}</div>
                    <div style="font-size: 0.7rem;">${item.MCType || '-'}</div>
                  </td>
                  <td style="padding: 8px; text-align:center;"><span style="background:#f1f5f9; padding:2px 4px; border-radius:4px; font-size:0.7rem; font-weight:600;">${item.CASE}</span></td>
                  <td style="padding: 8px; text-align:center; color:#64748b; font-size:0.75rem;">${item.Position || '-'}</td>
                  <td style="padding: 8px; text-align:right; font-weight:800; color:#2563eb; font-size:0.95rem;">${item.QTY}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 12px; font-size: 0.75rem; color: #94a3b8; text-align: right;">
          * Please verify all item details and quantities before clicking Submit.
        </div>
      </div>`;

    // 🎨 Premium Confirmation Dialog
    Swal.fire({
      title: '<span style="font-size:1.3rem; font-weight:800; color:#1e293b; font-family: \'Kanit\', sans-serif;">Final Request Verification</span>',
      html: summaryHtml,
      width: 'min(950px, 90%)',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-shield-check"></i>&nbsp; Yes, Submit Now',
      cancelButtonText: '<i class="bi bi-x-lg"></i>&nbsp; Back to Edit',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        confirmButton: 'swal-premium-confirm',
        cancelButton: 'swal-premium-cancel'
      },
      backdrop: `rgba(15, 23, 42, 0.6)`,
      showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
      hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeSubmit(allItems);
      }
    });
  }

  // ========================================
  //   Execute Submit (API Call)
  // ========================================
  private executeSubmit(allItems: any[]) {
    this.loading = true;

    this.detailPurchaseService.insertRequestBulk(allItems).subscribe({
      next: (res: any) => {
        this.loading = false;
        const total = res?.successCount ?? allItems.length;
        const caseSetup = res?.CaseSetupCount ?? 0;
        const cutting = res?.CuttingCount ?? 0;
        const setup = res?.SetupCount ?? 0;

        let detailHtml = `<div style="font-size:1.15rem; color:#059669; font-weight:800; margin-bottom:1rem; letter-spacing:-0.01em;">
          ${total} items submitted successfully!</div>
          <div style="background:#f8fafc; border-radius:12px; padding:1.25rem; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:0.5rem;">`;

        if (caseSetup > 0) detailHtml += `<div style="color:#475569; display:flex; gap:8px;">📋 <span style="flex:1">Case Setup:</span> <b style="color:#1e293b">${caseSetup}</b></div>`;
        if (cutting > 0) detailHtml += `<div style="color:#475569; display:flex; gap:8px;">🔧 <span style="flex:1">Cutting Tool:</span> <b style="color:#1e293b">${cutting}</b></div>`;
        if (setup > 0) detailHtml += `<div style="color:#475569; display:flex; gap:8px;">⚙️ <span style="flex:1">Setup Tool:</span> <b style="color:#1e293b">${setup}</b></div>`;
        detailHtml += `</div>`;

        Swal.fire({
          icon: 'success',
          title: '<span style="color:#059669; font-weight:800; font-size:1.5rem;">Request Submitted!</span>',
          html: detailHtml,
          showConfirmButton: true,
          confirmButtonText: 'Great!',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title',
            confirmButton: 'swal-premium-confirm swal-premium-confirm-success',
          },
          timer: 5000,
          timerProgressBar: true,
          backdrop: `rgba(15, 23, 42, 0.6)`,
          showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
          hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
        });

        this.resetAfterSubmit();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error submitting request:', err);
        Swal.fire({
          icon: 'error',
          title: '<span style="color:#ef4444; font-weight:800;">Submission Failed</span>',
          text: 'ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง',
          confirmButtonText: 'ลองใหม่',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title',
            confirmButton: 'swal-premium-confirm',
          },
          backdrop: `rgba(15, 23, 42, 0.6)`
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