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
  }

  toggleAllCheckboxes() {
    for (const item of this.items) {
      item.checked = this.selectAllChecked;
    }
  }

  // เรียกใช้ตัวดึงapi (ดึงข้อมูล Division)
  Get_Division() {
    // โหลด Division จาก SP: Stored_Get_Dropdown_PC_Plan_Division
    this.api.get_Setup_Division().subscribe({
      next: (response: any[]) => {
        // Map: Division_Id, Profit_Center, Division_Name
        this.Division = response.map(item => ({
          Division: item.Division_Id?.toString(),  // ใช้ Division_Id
          DivisionName: item.Division_Name || item.Profit_Center,
          Profit_Center: item.Profit_Center  // เก็บไว้สำหรับใช้งานอื่น
        }));
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
  }

  // Logic เมื่อกดปุ่มเลือกประเภท Tool (Setup/Cutting)
  selectTooling(type: string) {
    this.Tooling_ = type;
    // Reset ข้อมูล
    this.PartNo_ = null;
    this.Process_ = null;
    this.MachineType_ = null;
    this.MCNo_ = '';
    this.items = [];
    this.relatedSetupItems = [];

    // โหลด PartNo ใหม่
    if (this.Div_) {
      this.get_PartNo(this.Div_);
    }
  }


  // เรียกใช้ตัวดึงapi (ดึงข้อมูล PartNo เมื่อเลือก Division)
  async get_PartNo(event: any) {
    if (!event) return;

    // ถ้ายังไม่ได้เลือก Tooling (เช่นยังไม่กดปุ่ม) ไม่ต้องโหลด
    if (!this.Tooling_) return;

    const division = event.Division ?? event;
    console.log('🔵 get_PartNo - event:', event, 'division:', division, 'Tooling_:', this.Tooling_, 'Case_:', this.Case_);
    if (division) {
      // ✅ Case SET: ใช้ API ใหม่สำหรับ Dropdown
      if (this.Case_ === 'SET') {
        this.api.get_CaseSET_Dropdown_PartNo({ Division: division }).subscribe({
          next: (response: any[]) => {
            this.PartNo = response.map(p => ({
              PartNo: p.PartNo
            }));
            console.log('🟢 CaseSET PartNo loaded:', this.PartNo.length, 'items');
          },
          error: (e) => console.error('CaseSET PartNo Error:', e),
        });
      } else if (this.Tooling_ === 'Setup tool') {
        // === Setup Tool: เรียก API ใหม่ ===
        this.api.get_Setup_PartNo({ Division: division }).subscribe({
          next: (response: any[]) => {
            this.PartNo = response.map(p => ({
              PartNo: p.Setup_PartNo
            }));
          },
          error: (e) => console.error(e),
        });
      } else {
        // === Cutting Tool: เรียก API เดิม ===
        this.api.get_PartNo({ Division: division }).subscribe({
          next: (response: any[]) => {
            this.PartNo = response.filter((item, index, self) =>
              index === self.findIndex(obj => obj.PartNo === item.PartNo)
            );
          },
          error: (e) => console.error(e),
        });
      }
    }
  }

  onDivisionChange(value: any) {
    // เมื่อเปลี่ยน Division
    this.get_Facility(value);
    this.get_MC_ByDivision(value);  // โหลด Machine Type ตาม Division (แสดงเฉยๆ ไม่ใช้กรอง)
    // ถ้าเลือก Case และ Tooling แล้ว ให้โหลด PartNo ใหม่ด้วย
    if (this.Tooling_) {
      this.get_PartNo(value);
    }
  }

  async get_Facility(event: any) {
    if (!event) return;

    // Division object มี: { Division: "2", DivisionName: "PMC", Profit_Center: "71DZ" }
    // ต้องส่ง Division_Id (ค่า "2") ไม่ใช่ DivisionName ("PMC")
    const divisionId = event.Division || event;
    if (!divisionId) return;

    console.log('get_Facility - sending Division_Id:', divisionId);

    // ใช้ SP: Stored_Get_Dropdown_Facility_By_Division (รับ @Division_Id)
    this.api.get_Setup_Facility({ Division: divisionId }).subscribe({
      next: (response: any[]) => {
        // SP Returns: FacilityName + FacilityShort (e.g., "F.1")
        this.Fac = response.map(f => ({
          FacilityName: f.FacilityName,    // ใช้ส่งไป API
          FacilityShort: f.FacilityShort   // ใช้แสดงใน dropdown
        }));
        console.log('Facility Dropdown:', this.Fac);
      },
      error: (e) => console.error('Error get_Facility:', e),
    });
  }

  // Process
  async get_Process(event: any) {
    const partNo = event?.PartNo ?? event;
    const division = this.Div_?.Division || this.Div_;

    if (!partNo || !division) return;

    // ✅ Case SET: ใช้ API ใหม่สำหรับ Dropdown
    if (this.Case_ === 'SET') {
      this.api.get_CaseSET_Dropdown_Process({ Division: division, PartNo: partNo }).subscribe({
        next: (response: any[]) => {
          this.Process = response.map(p => ({
            Process: p.Process
          }));
          console.log('🟢 CaseSET Process loaded:', this.Process.length, 'items');
        },
        error: (e) => console.error('CaseSET Process Error:', e)
      });
    } else if (this.Tooling_ === 'Setup tool') {
      // Setup Tool Logic
      this.api.get_Setup_Process({ Division: division, PartNo: partNo }).subscribe({
        next: (response: any[]) => {
          this.Process = response.map(p => ({
            Process: p.Setup_Process
          }));
        },
        error: (e) => console.error(e)
      });
    } else {
      // Cutting Tool Logic (Existing)
      const data = {
        Division: division,
        PartNo: partNo,
      }
      this.api.get_Process(data).subscribe({
        next: (response: any[]) => {
          this.Process = response.filter((item, index, self) =>
            index === self.findIndex(obj => obj.Process === item.Process)
          );
          console.log(this.Process);
        },
        error: (e) => console.error(e),
      });
    }
  }

  // MAchineType
  async get_MC(event: any) {
    const process = event?.Process ?? event;
    const division = this.Div_?.Division || this.Div_;
    const partNo = this.PartNo_?.PartNo || this.PartNo_;

    if (!process || !division || !partNo) return;

    // ✅ Case SET: ใช้ API ใหม่สำหรับ Dropdown
    if (this.Case_ === 'SET') {
      this.api.get_CaseSET_Dropdown_MC({ Division: division, PartNo: partNo, Process: process }).subscribe({
        next: (response: any[]) => {
          this.MachineType = response.map(m => ({
            MC: m.MC,
            Process: process
          }));
          console.log('🟢 CaseSET MC loaded:', this.MachineType.length, 'items');
        },
        error: (e) => console.error('CaseSET MC Error:', e)
      });
    } else if (this.Tooling_ === 'Setup tool') {
      // Setup Tool Logic
      this.api.get_Setup_MC({ Division: division, PartNo: partNo, Process: process }).subscribe({
        next: (response: any[]) => {
          this.MachineType = response.map(m => ({
            MC: m.Setup_MC,
            Process: process
          }));
        },
        error: (e) => console.error(e)
      });
    } else {
      // Cutting Tool Logic (Existing)
      const spec = this.PartNo_?.SPEC || '';
      const data = {
        Division: division,
        PartNo: partNo,
        Spec: spec,
        Process: process
      }
      this.api.get_MC(data).subscribe({
        next: (response: any[]) => {
          console.log('MC', response)
          this.MachineType = response.filter((item, index, self) =>
            index === self.findIndex(obj =>
              obj.MC === item.MC && obj.Process === item.Process
            )
          );
          console.log('list', this.MachineType);
        },
        error: (e) => console.error(e),
      });
    }
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
    // ส่ง FacilityShort (F.6) ไปให้ SQL ใช้ LIKE '%F.6' กรอง
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
    // ลบ MC ออก - ไม่ต้องตรวจสอบแล้ว
    if (!DueDate_) missingFields.push("DueDate");
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
    const data = { Division, FacilityName, PartNo, Process };

    // ⭐⭐ แยกทางเดินระบบ (Logic Search) ⭐⭐
    if (this.Tooling_ === 'Setup tool') {
      // ============================================
      // 🟢 SETUP TOOL MODE (เข้าเงื่อนไขนี้เมื่อเลือก Setup tool)
      // ============================================
      this.relatedSetupItems = []; // เคลียร์ตารางล่างทิ้งถ้าเป็นโหมดนี้

      console.log('Fetching Setup Tool Data...', data);

      // เรียก API ค้นหาของ Setup Tool
      this.api.get_SetupItems(data).subscribe({
        next: (response: any[]) => {
          // Map ข้อมูลที่ได้จาก Backend ให้ตรงกับชื่อตัวแปรที่ Frontend ใช้แสดงผล
          this.items = response.map(item => ({
            ...item,
            PartNo: item.Setup_PartNo, // แปลงเป็น PartNo
            Process: item.Setup_Process, // แปลงเป็น Process
            MC: item.Setup_MC, // แปลงเป็น MC
            SPEC: item.Spec, // แปลงเป็น SPEC
            checked: true,
            QTY: item.QTY ?? 1
          }));
          this.loading = false;
        },
        error: (e) => {
          console.error('API Setup Tool Error:', e);
          this.loading = false;
          Swal.fire('Error', 'ไม่สามารถดึงข้อมูล Setup Tool ได้', 'error');
        }
      });

    } else {
      // ============================================
      // 🔵 CUTTING TOOL MODE (เข้าเงื่อนไขนี้เมื่อเลือก Cutting tool - ของเดิม)
      // ============================================
      console.log('Fetching Cutting Tool Data...', data);

      // ✅✅ Case SET: เรียก API ดึงทั้ง CuttingTool และ SetupTool พร้อมกัน ✅✅
      if (this.Case_ === 'SET') {
        // เรียก API CuttingTool และ SetupTool พร้อมกัน
        this.api.get_CaseSET_CuttingTool(data).subscribe({
          next: (cuttingResponse: any[]) => {
            // Map CuttingTool data
            this.items = cuttingResponse.map(item => ({
              ...item,
              FreshQty: item.FreshQty ?? 0,
              ReuseQty: item.ReuseQty ?? 0,
              checked: true,
              QTY: item.QTY ?? 1
            }));
          },
          error: (e) => {
            console.error('CaseSET CuttingTool API Error:', e);
          }
        });

        // เรียก SetupTool API แยก
        this.api.get_CaseSET_SetupTool(data).subscribe({
          next: (setupResponse: any[]) => {
            // Map SetupTool data สำหรับตาราง Related Setup Tools
            this.relatedSetupItems = setupResponse.map(item => ({
              ...item,
              PartNo: item.PartNo,
              ItemNo: item.ItemNo,       // จาก Holder_No
              ItemName: item.ItemName,   // จาก Holder_Name
              SPEC: item.SPEC,
              Process: item.Process,
              MC: item.MC,
              Position: item.Position,
              checked: true,
              QTY: item.QTY ?? 1
            }));
            this.loading = false;
          },
          error: (e) => {
            console.error('CaseSET SetupTool API Error:', e);
            this.loading = false;
          }
        });
      } else {
        this.relatedSetupItems = []; // ถ้าไม่ใช่เคส SET ไม่ต้องโชว์

        this.api.post_ItemNo(data).subscribe({
          next: (response: any[]) => {
            const itemMap = new Map<string, any>();

            response.forEach(item => {
              const key = `${item.PartNo}|${item.Process}|${item.MC}|${item.SPEC}|${item.ItemNo}`;

              if (!itemMap.has(key)) {
                itemMap.set(key, {
                  ...item,
                  FreshQty: 0,
                  ReuseQty: 0,
                  checked: true,
                  qty: null
                });
              }

              if (item.FacilityName === FacilityName) {
                const existing = itemMap.get(key);
                const existingSum = (existing.FreshQty ?? 0) + (existing.ReuseQty ?? 0);
                const currentSum = (item.FreshQty ?? 0) + (item.ReuseQty ?? 0);

                if (currentSum > existingSum) {
                  itemMap.set(key, {
                    ...existing,
                    FreshQty: item.FreshQty ?? 0,
                    ReuseQty: item.ReuseQty ?? 0
                  });
                }
              }
            });

            this.items = Array.from(itemMap.values()).map(item => ({
              ...item,
              QTY: item.QTY ?? 1
            }));
            this.loading = false;
          },
          error: (e) => {
            console.error('API Cutting Tool Error:', e);
            this.loading = false;
          }
        });
      }
    }
  }

  // function add to cart
  AddToCart() {
    const checkedItems = this.items.filter((item: any) => item.checked);
    const filteredItems = checkedItems.filter((item: any) => item.QTY);

    if (filteredItems.length < checkedItems.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Data',
        text: 'Please fill in all required fields for the selected item',
        confirmButtonText: 'OK'
      });
      return;
    }

    const InputDate_ = new Date().toISOString().split('T')[0];

    // ดึงชื่อพนักงานจาก session
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const employeeName = currentUser.Employee_Name || 'Unknown';
    const Employee_ID = currentUser.Employee_ID || 'Unknown';

    // แปลง Fac_
    let rawFac = '';
    if (this.Fac_) {
      if (typeof this.Fac_ === 'string') rawFac = this.Fac_;
      else if (this.Fac_.FacilityName) rawFac = this.Fac_.FacilityName;
    }
    const FactoryNumberMatch = rawFac.match(/F\.(\d+)/);
    const Factory = FactoryNumberMatch ? FactoryNumberMatch[1] : rawFac;

    const groupedByCase = filteredItems.reduce((acc: any, item: any) => {
      const caseKey = item.Case_ || this.Case_;
      if (!acc[caseKey]) acc[caseKey] = [];

      acc[caseKey].push({
        DocNo: null,
        Division: this.Div_?.Division || this.Div_,
        Fac: Factory,
        ItemNo: item.ItemNo,
        PartNo: item.PartNo,
        Process: item.Process,
        CASE: caseKey,
        MCType: item.MC,
        SPEC: item.SPEC,
        Usage_pcs: item.Usage_pcs,
        QTY: item.QTY,
        Req_QTY: item.QTY, // Map Req_QTY
        InputDate_: InputDate_,
        DueDate: this.DueDate_,
        ReuseQty: item.ReuseQty,
        FreshQty: item.FreshQty,
        Status: 'Waiting',
        Set_by: null,
        Local: 0,
        MCNo_: this.MCNo_,
        PathDwg: this.PathDwg_, // Map PathDwg (changed key from PathDwg_)
        ON_HAND: item.ON_HAND,
        Employee_Name: employeeName,
        PhoneNo: this.phone_,
        Requester: Employee_ID
      });

      return acc;
    }, {});

    if (Object.keys(groupedByCase).length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Item',
        text: 'No item selected to add to cart',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const allItemsToSend = Object.values(groupedByCase).flat();

    this.detailPurchaseService.insertRequestBulk(allItemsToSend).subscribe({
      next: (res: any) => {
        let msg = 'Items have been successfully sent to Purchase Request';
        if (res && res.successCount !== undefined) {
          msg = `Successfully request ${res.successCount} items. (Failed: ${res.failCount})`;
        }

        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: msg,
          showConfirmButton: false,
          timer: 1500
        });

        // Clear Form and Stay on Page
        this.Clearall();
      },
      error: (err) => {
        console.error('Error submitting request:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to submit request',
          confirmButtonText: 'Retry'
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