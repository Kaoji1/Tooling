import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { RequestService } from '../../../core/services/request.service';
import { CartService } from '../../../core/services/cart.service';
import { DetailPurchaseRequestlistService } from '../../../core/services/DetailPurchaseRequestlist.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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
  DueDate_: string = '';
  today_: string = '';
  InputDate_: string = '';
  MCNo_: string = '';

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
    private router: Router
  ) {
    // Set today's date for min date validation
    this.today_ = new Date().toISOString().split('T')[0];

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
    this.Get_Division();
    this.loadState();
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
      ItemNoList: this.ItemNoList
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
      this.DueDate_ = state.DueDate_;
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
  Get_Division() {
    // โหลด Division จาก SP: Stored_Get_Dropdown_PC_Plan_Division
    this.api.get_Setup_Division().subscribe({
      next: (response: any[]) => {
        // Map: Division_Id, Profit_Center, Division_Name
        const mapped = response.map(item => ({
          Division: item.Profit_Center,  // ใช้ Profit_Center เป็นค่าหลักแทน Division_Id
          Division_Id: item.Division_Id, // เก็บ Division_Id ตัวเลขไว้สำหรับ Facility SP
          DivisionName: item.Profit_Center === '7122' ? 'GM'
            : item.Profit_Center === '71DZ' ? 'PMC'
              : item.Division_Name || item.Profit_Center,
          Profit_Center: item.Profit_Center
        }));

        // Deduplicate by DivisionName
        const seen = new Set();
        this.Division = mapped.filter(item => {
          const duplicate = seen.has(item.DivisionName);
          seen.add(item.DivisionName);
          return !duplicate;
        });
      },
      error: (e: any) => console.error(e),
    });
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
    // เมื่อเลือก/กรอก ItemNo ให้โหลด PartNo ใหม่
    this.PartNo_ = null;
    this.Process_ = null;
    this.MachineType_ = null;
    this.get_PartNo(this.Div_);
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
    // ต้องส่ง Division_Id (ค่าตัวเลข เช่น 2) ไม่ใช่ Profit_Center ("71DZ")
    const divisionId = event.Division_Id || event;
    if (!divisionId) return;

    console.log('get_Facility - sending Division_Id:', divisionId);

    // ใช้ SP: Stored_Get_Dropdown_Facility_By_Division (รับ @Division_Id INT)
    this.api.get_Setup_Facility({ Division: divisionId }).subscribe({
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
        this.MachineType = response.map(m => ({
          MC: m.MC
        }));
        console.log('🔵 MC by Division loaded:', this.MachineType.length, 'items');
      },
      error: (e) => console.error('get_MC_ByDivision Error:', e)
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
        icon: 'warning',
        title: 'Incomplete Data',
        html: 'Missing fields:<br><ul style="text-align:left;">' +
          missingFields.map(f => `<li>${f}</li>`).join('') + '</ul>',
        confirmButtonText: 'ตกลง'
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
        Swal.fire('Error', 'ไม่สามารถดึงข้อมูลได้', 'error');
      }
    });
  }

  get getSelectedItemsCount(): number {
    const mainChecked = (this.items || []).filter((item: any) => item.checked).length;
    const setupChecked = (this.relatedSetupItems || []).filter((item: any) => item.checked).length;
    return mainChecked + setupChecked;
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
        title: 'Incomplete Data',
        text: 'กรุณากรอก QTY ให้ครบทุกรายการที่เลือก',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (totalValid === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Item Selected',
        text: 'กรุณาเลือกอย่างน้อย 1 รายการเพื่อส่งคำขอ',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3b82f6'
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
    const mapItem = (item: any, toolType: string) => ({
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
      DueDate: caseValue === 'SET' ? this.DueDate_ : null,
      Status: 'Waiting',
      MCNo: this.MCNo_,
      PathDwg: toolType === 'CuttingTool' ? this.PathDwg_ : null,
      ON_HAND: item.ON_HAND,
      PhoneNo: this.phone_,
      Requester: Employee_ID,
      ItemName: item.ItemName || null,
      ToolType: toolType
    });

    const allItems: any[] = [];

    if (caseValue === 'SET') {
      // CASE SET: ทั้ง Cutting + Setup ลง tb_IssueCaseSetup_Request_Document
      checkedCutting.forEach((item: any) => allItems.push(mapItem(item, 'CuttingTool')));
      checkedSetup.forEach((item: any) => allItems.push(mapItem(item, 'SetupTool')));
    } else if (this.Tooling_ === 'Setup tool') {
      // Non-SET + Setup Tool
      checkedCutting.forEach((item: any) => allItems.push(mapItem(item, 'SetupTool')));
    } else {
      // Non-SET + Cutting Tool (default)
      checkedCutting.forEach((item: any) => allItems.push(mapItem(item, 'CuttingTool')));
    }

    // Build summary for confirmation dialog
    const cuttingCount = allItems.filter(i => i.ToolType === 'CuttingTool').length;
    const setupCount = allItems.filter(i => i.ToolType === 'SetupTool').length;

    let summaryHtml = `
      <div style="text-align:left; padding: 0.5rem 0;">
        <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #f1f5f9;">
          <span style="color:#64748b;">Case</span>
          <span style="font-weight:700; color:#1e293b;">${caseValue}</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #f1f5f9;">
          <span style="color:#64748b;">Division</span>
          <span style="font-weight:700; color:#1e293b;">${Division}</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #f1f5f9;">
          <span style="color:#64748b;">Factory</span>
          <span style="font-weight:700; color:#1e293b;">F.${Factory}</span>
        </div>`;

    if (cuttingCount > 0) {
      summaryHtml += `
        <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #f1f5f9;">
          <span style="color:#64748b;">🔧 Cutting Tool</span>
          <span style="font-weight:700; color:#2563eb;">${cuttingCount} items</span>
        </div>`;
    }
    if (setupCount > 0) {
      summaryHtml += `
        <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #f1f5f9;">
          <span style="color:#64748b;">⚙️ Setup Tool</span>
          <span style="font-weight:700; color:#7c3aed;">${setupCount} items</span>
        </div>`;
    }
    summaryHtml += `
        <div style="display:flex; justify-content:space-between; padding:0.75rem 0; margin-top:0.25rem;">
          <span style="font-weight:700; color:#1e293b; font-size:1.05rem;">Total</span>
          <span style="font-weight:800; color:#059669; font-size:1.1rem;">${allItems.length} items</span>
        </div>
      </div>`;

    // 🎨 Premium Confirmation Dialog
    Swal.fire({
      title: '<span style="font-size:1.3rem; font-weight:800; color:#1e293b;">Confirm Submission</span>',
      html: summaryHtml,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-shield-check"></i>&nbsp; Yes, Submit',
      cancelButtonText: '<i class="bi bi-x-lg"></i>&nbsp; Cancel',
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

        let detailHtml = `<div style="font-size:1.1rem; color:#059669; font-weight:700; margin-bottom:0.75rem;">
          ${total} items submitted successfully!</div>`;

        if (caseSetup > 0) detailHtml += `<div style="color:#64748b;">📋 Case Setup: <b>${caseSetup}</b></div>`;
        if (cutting > 0) detailHtml += `<div style="color:#64748b;">🔧 Cutting Tool: <b>${cutting}</b></div>`;
        if (setup > 0) detailHtml += `<div style="color:#64748b;">⚙️ Setup Tool: <b>${setup}</b></div>`;

        Swal.fire({
          icon: 'success',
          title: '<span style="color:#059669; font-weight:800;">Request Submitted!</span>',
          html: detailHtml,
          showConfirmButton: true,
          confirmButtonText: 'OK',
          confirmButtonColor: '#059669',
          timer: 4000,
          timerProgressBar: true,
          backdrop: `rgba(15, 23, 42, 0.5)`,
          showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' }
        });

        this.Clearall();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error submitting request:', err);
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: 'ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง',
          confirmButtonText: 'ลองใหม่',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }

  // function clearall
  Clearall() {
    // Delete select group
    this.Tooling_ = null; // ✅ Reset Tooling Selection
    this.Div_ = null;
    this.Fac_ = null;
    this.DueDate_ = '';
    this.Case_ = null;
    this.PartNo_ = null;
    this.Spec_ = null;
    this.MachineType_ = null;
    this.Process_ = null;
    this.phone_ = '';
    this.MCNo_ = '';

    // Delete items
    this.items = [];
    this.relatedSetupItems = []; // ✅ เคลียร์ตารางล่างด้วย
    this.PathDwg_ = null;
    this.loading = false;
    this.isSearched = false;
    this.api.clearRequestState(); // ✅ Clear saved state
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