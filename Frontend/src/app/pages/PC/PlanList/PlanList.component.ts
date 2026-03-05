import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs'; // Import for Styled Excel Export
import { AuthService } from '../../../core/services/auth.service'; // Start Import

import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { PCPlanService } from '../../../core/services/PCPlan.service';
import { FileUploadSerice } from '../../../core/services/FileUpload.service';
import { HistoryPrint } from '../../../core/services/HistoryPrint.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter } from '../../../core/utils/custom-date-adapter';
import { CalendarModule } from 'primeng/calendar';
import { NgSelectModule } from '@ng-select/ng-select';
import { NotificationComponent } from '../../../components/notification/notification.component';
import { PrintActionBtnComponent } from './components/print-action-btn/print-action-btn.component';

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
  selector: 'app-plan-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatButtonModule,

    CalendarModule,
    NotificationComponent,
    PrintActionBtnComponent,
    NgSelectModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './PlanList.component.html',
  styleUrls: ['./PlanList.component.scss']
})
export class PlanListComponent implements OnInit {

  // ตัวแปรสำหรับ Filter
  filterDate: Date | null = null;
  filterDivision: string = '';
  filterMachineType: string = '';
  filterStatus: string = '';
  filterFac: string = '';
  filterProcess: string = '';
  filterPartNo: string = '';
  showHistory: boolean = false; // Toggle for Global History

  // New Tab Structure
  departments: string[] = ['PC', 'PD', 'PH', 'EN', 'QC', 'Gague', 'View'];
  selectedDepartment: string = ''; // Initialize empty to prevent "Flash of PC Content" before role check

  subTabs: string[] = ['Upcoming'];
  selectedSubTab: string = 'Upcoming';

  dateRanges: string[] = ['7 DAY', '30 DAY', 'ALL'];
  selectedDateRange: string = 'ALL';

  // For storing pre-calculated counts
  subTabCounts: { [key: string]: number } = {};

  currentUser: any;

  // --- Permission Helpers ---
  get canEditPC(): boolean { return this.authService.isPC(); }
  get canAttachEng(): boolean { return this.authService.isEngineer(); }
  get canAttachQC(): boolean { return this.authService.isQC(); }
  get canRequest(): boolean { return this.authService.isPD(); }

  // รายการใน Dropdown Filter (สำหรับ Tool Bar บนตาราง)
  divisions: string[] = ['GM', 'PMC'];
  machineTypes: string[] = ['CNC', 'Lathe', 'Milling'];
  facList: string[] = [];
  processList: string[] = [];
  partNoList: string[] = [];
  partBeforeList: string[] = [];
  barTypeList: string[] = [];
  statusList: string[] = ['Ready', 'Wait Eng', 'Wait QC', 'Wait En & QC', 'Cancelled'];

  // รายการ Dropdown สำหรับหน้าต่างกดย่อย (Edit Modal) โดยเฉพาะ (ดึงจาก API)
  modalMachineTypes: string[] = [];
  modalFacList: string[] = [];
  modalProcessList: string[] = [];
  modalPartNoList: string[] = [];
  modalPartBeforeList: string[] = [];
  modalBarTypeList: string[] = [];

  // ข้อมูลตาราง
  planList: any[] = [];
  filteredPlanList: any[] = []; // เพิ่มตัวแปรสำหรับเก็บข้อมูลที่กรองแล้ว

  // Print Properties
  canPrint = false;
  isPrintModalOpen = false;
  selectedItemForPrint: any = null;
  printType: string | null = null;
  printQty: number | null = null;
  previewUrl: SafeResourceUrl | null = null;
  printTypeOptions = [
    { label: 'Layout', value: 'pathLayout' }, // matches property name in item
    { label: 'Drawing', value: 'pathDwg' }    // matches property name in item
  ];

  constructor(
    private pcPlanService: PCPlanService,
    private fileUploadService: FileUploadSerice,
    private historyPrint: HistoryPrint,
    private sanitizer: DomSanitizer,
    private router: Router,
    private authService: AuthService, // Injected
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // Machine Data Cache - REMOVED (User requested Excel-style filtering based on actual list data)

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const userSession = sessionStorage.getItem('user');
        if (userSession) {
          this.currentUser = JSON.parse(userSession);
        } else {
          // Handle no user session (e.g., redirect to login or show empty state)
          console.warn('No user session found on refresh.');
          this.currentUser = {};
        }
      } catch (e) {
        console.error('Error parsing user session:', e);
        this.currentUser = {};
      }

      this.checkPrintPermission();

      // --- RBAC: Filter Departments based on Role ---
      // Mapping: Role -> Visible Departments
      const role = this.currentUser.Role;

      // 1. Show ALL Viewtabs for everyone
      this.departments = ['PC', 'PD', 'PH', 'EN', 'QC', 'Gague', 'View'];

      // 2. Determine which tabs are ACCESSIBLE (Clickable)
      let allowed: string[] = [];

      if (role) {
        switch (role) {
          case 'admin':
            allowed = ['PC', 'PD', 'PH', 'EN', 'QC', 'Gague', 'View'];
            break;
          case 'PC':
            allowed = ['PC'];
            break;
          case 'production':
            allowed = ['PD'];
            break;
          case 'purchase':
            allowed = ['PH'];
            break;
          case 'engineer':
            allowed = ['EN'];
            break;
          case 'QC':
            allowed = ['QC'];
            break;
          case 'Gague':
            allowed = ['Gague'];
            break;
          case 'Cost':
          case 'view': // Assuming view role also sees View tab
            allowed = ['View'];
            break;
          default:
            allowed = []; // Or 'View' as safe default?
            break;
        }
      }
      this.allowedDepartments = allowed;

      // 3. Set initial selected department
      // If the previously selected dept (or default) is not allowed, switch to the first allowed one
      if (!this.allowedDepartments.includes(this.selectedDepartment)) {
        if (this.allowedDepartments.length > 0) {
          // Select the first allowed department
          this.selectDepartment(this.allowedDepartments[0]);
        } else {
          // Fallback if no specific allowed dept (shouldn't happen for valid roles)
          this.selectedDepartment = '';
        }
      } else {
        // Refresh call if needed or just keep current
        this.selectDepartment(this.selectedDepartment);
      }


      // Initialize sub-tabs for the selected dept
      this.selectDepartment(this.selectedDepartment);

      this.loadPlanList();
    }
  }

  // Load Machine Types dynamically from the loaded Plan List (Excel-style)
  updateMachineTypeOptions() {
    let currentData = this.planList;

    // If Division is selected, show only MCs in that Division
    if (this.filterDivision && this.filterDivision !== 'All') {
      currentData = currentData.filter(item => item.division === this.filterDivision);
    }

    // 3. Extract Unique Options (Sort alphabetically)
    const uniqueMCs = new Set(currentData.map(item => item.mcType).filter(mc => mc));
    this.machineTypes = Array.from(uniqueMCs).sort();

    const uniqueFacs = new Set(currentData.map(item => item.fac).filter(fac => fac));
    this.facList = Array.from(uniqueFacs).sort();

    const uniqueProcesses = new Set(currentData.map(item => item.process).filter(process => process));
    this.processList = Array.from(uniqueProcesses).sort();

    const uniquePartNos = new Set(currentData.map(item => item.partNo).filter(partNo => partNo));
    this.partNoList = Array.from(uniquePartNos).sort();
  }

  checkPrintPermission() {
    const myId = this.currentUser?.Employee_ID;
    if (!myId) return;

    this.historyPrint.checkPrintPermission(myId).subscribe({
      next: (res: any) => {
        this.canPrint = res.allowed;
      },
      error: (err) => console.error("Error checking print permission:", err)
    });
  }

  // --- Datepicker Actions ---
  setToday(picker: MatDatepicker<any> | null) {
    this.filterDate = new Date();
    this.applyFilter();
    if (picker) picker.close();
  }

  clearDate(picker: MatDatepicker<any> | null) {
    this.filterDate = null;
    this.applyFilter();
    if (picker) picker.close();
  }

  loadPlanList() {
    // Add cache-buster to ensure we get fresh data after edits
    this.pcPlanService.getPlanList(this.showHistory).subscribe({
      next: (res) => {
        // Map ข้อมูลจาก Backend (PascalCase) -> Frontend (camelCase)
        this.planList = res.map((item: any) => ({
          id: item.Plan_ID,
          // Change to dd/mm/yyyy (en-GB)
          date: item.PlanDate ? new Date(item.PlanDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '',
          // empId: item.Employee_ID,
          division: this.mapDivisionName(item.Division), // Map Code to Name for UI
          divisionCode: item.Division, // Keep Code for DB updates
          mcType: item.MC_Type, // HTML ใช้ mcType
          barType: item.Bar_Type || null, // Map Bar Type
          fac: item.Facility,
          process: item.Process,
          partBefore: item.Before_Part,
          mcNo: item.MC_No,
          partNo: item.PartNo,
          qty: item.QTY,
          time: item.Time,
          comment: item.Comment,
          pathDwg: item.Path_Dwg || '-',
          pathLayout: item.Path_Layout || '-',
          iiqc: item.Path_IIQC || '-',
          revision: item.Revision,
          planStatus: item.PlanStatus || 'Active',
          groupId: item.GroupId, // Critical for History
          // Print Counts (Initialize)
          printLayoutCount: 0,
          printDwgCount: 0
        }));

        this.applyFilter(); // เรียก Filter ครั้งแรกหลังจากโหลดข้อมูลเสร็จ

      },
      error: (err: any) => {
        console.error('Error loading plan list:', err);
      }
    });
  }

  // ฟังก์ชันสำหรับกรองข้อมูล
  applyFilter() {
    this.updateMachineTypeOptions(); // Update Dropdown Options based on Division

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Bridged Identity Mapping
    // This links legacy items (groupId: '-') to their new revisions (UUID) by matching metadata
    // during the transition. Once linked, future revisions are tracked by UUID.
    const itemIdentities = new Map<number, string>();
    const hKeyToUuid = new Map<string, string>();
    const latestMap = new Map<string, number>();
    const groupMaxIdMap = new Map<string, number>();
    const groupDateMap = new Map<string, string>();

    // Pass 1: Collect UUIDs for all known metadata patterns
    this.planList.forEach(item => {
      if (item.groupId && item.groupId !== '-') {
        const hKey = `${(item.date || '').trim()}|${(item.partNo || '').trim()}|${(item.mcNo || '').trim()}|${(item.process || '').trim()}`;
        hKeyToUuid.set(hKey, item.groupId);
      }
    });

    // Pass 2: Assign identities
    this.planList.forEach(item => {
      if (item.groupId && item.groupId !== '-') {
        itemIdentities.set(item.id, item.groupId);
      } else {
        const hKey = `${(item.date || '').trim()}|${(item.partNo || '').trim()}|${(item.mcNo || '').trim()}|${(item.process || '').trim()}`;
        const uuidPartner = hKeyToUuid.get(hKey);
        itemIdentities.set(item.id, uuidPartner ? uuidPartner : `legacy_${hKey}`);
      }
    });

    this.planList.forEach(item => {
      const key = itemIdentities.get(item.id)!;

      // 2. Find Max Revision and its Date in this group
      const currentMaxRev = latestMap.get(key) || -1;
      if (item.revision > currentMaxRev) {
        latestMap.set(key, item.revision);
        groupDateMap.set(key, item.date);
      }

      // 3. Find Max ID in group (for Recency sorting)
      const currentMaxId = groupMaxIdMap.get(key) || -1;
      if (item.id > currentMaxId) groupMaxIdMap.set(key, item.id);
    });

    // Reset counts for the current department
    this.subTabCounts = { 'Upcoming': 0, 'Required': 0, 'Completed': 0 };
    const isActionRequiredTab = (this.selectedSubTab === 'Required');
    const isCompletedTab = (this.selectedSubTab === 'Completed');

    this.filteredPlanList = this.planList.filter(item => {
      // Parse Item Date (Robustly)
      const parts = item.date.split('/');
      if (parts.length !== 3) return false;
      const [day, month, year] = parts.map(Number);

      // Safety check: If for some reason the database still sends BE years (2500+),
      // treat them as AD (2000+) for UI date comparison consistency.
      const normalizedYear = year > 2400 ? year - 543 : year;
      const itemDate = new Date(normalizedYear, month - 1, day);

      const key = itemIdentities.get(item.id)!;

      const isLatest = item.revision === latestMap.get(key);
      item.isLatest = isLatest; // Store for UI

      // Add group properties for sorting
      item.groupMaxId = groupMaxIdMap.get(key);
      item.groupDate = groupDateMap.get(key) || item.date;
      item.groupKey = key; // Keep key for post-processing

      // --- Filter Logic ---
      let matchDivision = this.filterDivision ? item.division === this.filterDivision : true;
      let matchMachine = this.filterMachineType ? item.mcType === this.filterMachineType : true;
      let matchFac = this.filterFac ? item.fac === this.filterFac : true;
      let matchProcess = this.filterProcess ? item.process === this.filterProcess : true;
      let matchPartNo = this.filterPartNo ? item.partNo === this.filterPartNo : true;

      let matchStatus = true;
      if (this.filterStatus) {
        if (this.filterStatus === 'Cancelled') {
          matchStatus = item.planStatus === 'Cancelled';
        } else {
          const calculatedStatus = this.getProcessStatus(item).label;
          matchStatus = item.planStatus !== 'Cancelled' && calculatedStatus === this.filterStatus;
        }
      }

      const isBaseMatch = matchDivision && matchMachine && matchFac && matchProcess && matchPartNo && matchStatus;
      const isActiveLatest = (item.planStatus === 'Active' || item.planStatus === 'Incomplete') && isLatest;

      // --- 1. Calculate Counts (Always respect basic filters) ---
      if (isBaseMatch && isActiveLatest) {
        // Count for 'Upcoming' (Global logic: Today + 2 Months)
        const twoMonthsLater = new Date(today);
        twoMonthsLater.setMonth(today.getMonth() + 2);
        if (itemDate >= today && itemDate <= twoMonthsLater) {
          this.subTabCounts['Upcoming'] = (this.subTabCounts['Upcoming'] || 0) + 1;
        }

        // Count for 'Action Required' (Department-specific logic)
        // User requested: Don't show Cancelled items in Action Required for En/QC
        if (item.planStatus !== 'Cancelled') {
          if (this.selectedDepartment === 'EN') {
            const hasDwg = item.pathDwg && item.pathDwg !== '-' && item.pathDwg.trim() !== '';
            const hasLayout = item.pathLayout && item.pathLayout !== '-' && item.pathLayout.trim() !== '';
            if (!hasDwg || !hasLayout) {
              this.subTabCounts['Required'] = (this.subTabCounts['Required'] || 0) + 1;
            } else {
              // If has both, it's Completed
              this.subTabCounts['Completed'] = (this.subTabCounts['Completed'] || 0) + 1;
            }
          } else if (this.selectedDepartment === 'QC') {
            const hasIIQC = item.iiqc && item.iiqc !== '-' && item.iiqc.trim() !== '';
            if (!hasIIQC) this.subTabCounts['Required'] = (this.subTabCounts['Required'] || 0) + 1;
          }
        }
      }

      // --- 2. Actual Filtering for the List ---
      if (!isBaseMatch) return false;

      let matchSubTab = true;

      // Calculate Date Range match (Common for both Upcoming and Action Required)
      const todayCopy = new Date(today);
      let endDate = new Date(todayCopy);
      if (this.selectedDateRange === '7 DAY') endDate.setDate(todayCopy.getDate() + 7);
      else if (this.selectedDateRange === '30 DAY') endDate.setDate(todayCopy.getDate() + 30);
      // 'ALL' = no date limit at all

      const isInRange = (this.selectedDateRange === 'ALL') ? true : (itemDate >= today && itemDate <= endDate);

      if (this.selectedSubTab === 'Upcoming') {
        // 'ALL' shows everything from today onwards (no upper limit)
        // User requested: Cancelled shows up in Upcoming
        if (this.selectedDateRange === 'ALL') {
          matchSubTab = itemDate >= today;
        } else {
          matchSubTab = itemDate >= today && itemDate <= endDate;
        }
      } else if (isActionRequiredTab) {
        let actionNeeded = false;
        // User requested: No Cancelled in Action Required
        if (item.planStatus !== 'Cancelled') {
          if (this.selectedDepartment === 'EN') {
            const hasDwg = item.pathDwg && item.pathDwg !== '-' && item.pathDwg.trim() !== '';
            const hasLayout = item.pathLayout && item.pathLayout !== '-' && item.pathLayout.trim() !== '';
            actionNeeded = !hasDwg || !hasLayout;
          } else if (this.selectedDepartment === 'QC') {
            const hasIIQC = item.iiqc && item.iiqc !== '-' && item.iiqc.trim() !== '';
            actionNeeded = !hasIIQC;
          }
        }
        matchSubTab = actionNeeded && isInRange;
      } else if (isCompletedTab) {
        let isCompleted = false;
        if (this.selectedDepartment === 'EN') {
          const hasDwg = item.pathDwg && item.pathDwg !== '-' && item.pathDwg.trim() !== '';
          const hasLayout = item.pathLayout && item.pathLayout !== '-' && item.pathLayout.trim() !== '';
          isCompleted = hasDwg && hasLayout;
        } else if (this.selectedDepartment === 'QC') {
          const hasIIQC = item.iiqc && item.iiqc !== '-' && item.iiqc.trim() !== '';
          isCompleted = hasIIQC;
        }
        matchSubTab = isCompleted && isInRange;
      }


      // 2. Filter Date (Always respect calendar filter)
      const matchDate = this.filterDate ? this.isDateMatch(item.date, this.filterDate) : true;

      if (!matchSubTab || !matchDate) return false;

      // 3. Revision Visibility Logic
      // If Show History is ON, show all versions that passed the date/sub-tab filters
      if (this.showHistory) return true;

      // Normal Mode: Show the Latest version.
      // If the latest version is 'Cancelled', we still show it (as per user request: "เพื่อเปรียบเทียบหรือให้คนอื่นรู้")
      return isLatest;
    });

    // เรียงลำดับ: วันที่รวมของกลุ่ม -> Recency (ID ล่าสุดของกลุ่ม) -> Revision ล่าสุด
    this.filteredPlanList.sort((a, b) => {
      // 1. Sort by Group Date (ASC) - Ensures all revisions of the same group stick together
      const [dayA, monthA, yearA] = a.groupDate.split('/').map(Number);
      const [dayB, monthB, yearB] = b.groupDate.split('/').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA).getTime();
      const dateB = new Date(yearB, monthB - 1, dayB).getTime();
      if (dateA !== dateB) return dateA - dateB;

      // 2. Recency Factor: Sort by the maximum ID found in the group
      // This ensures edited/cancelled items (which have a higher max group ID) jump to the top of the date section.
      const groupMaxA = a.groupMaxId || 0;
      const groupMaxB = b.groupMaxId || 0;
      if (groupMaxA !== groupMaxB) return groupMaxB - groupMaxA; // DESC

      // 3. Within same group, show Latest Revision first
      return (b.revision || 0) - (a.revision || 0);
    });

    // --- Post-Processing for Display ---
    // Mark 'isLatest' and 'isGroupStart' for UI Styling
    const seenGroups = new Set<string>();
    let lastGroupIdSection = '';

    this.filteredPlanList.forEach((item, index) => {
      const key = item.groupKey;

      // 1. Check isLatest (First time seeing this GroupId key in the sorted list = Latest)
      if (!seenGroups.has(key)) {
        item.isLatest = true;
        seenGroups.add(key);
      } else {
        item.isLatest = false;
      }

      // 2. Check isGroupStart (For UI separators)
      // Use GroupId for separator if possible, otherwise use the identity key
      const sepKey = (item.groupId && item.groupId !== '-') ? item.groupId : key;

      if (sepKey !== lastGroupIdSection) {
        item.isGroupStart = true;
        lastGroupIdSection = sepKey;
      } else {
        item.isGroupStart = false;
      }
    });

    // --- Dynamic Filter Logic: Update MC Type Dropdown based on Visible Data (Before MC Filter) ---
    // User Request: "MC Type list should show only items available in current view"
    // At this point, filteredPlanList is already filtered by Date, Tab, Division, etc.
    // BUT we need to know what MC Types are available *ignoring* the current MC Type selection itself
    // to populate the dropdown correctly.

    // Re-run filter logic *without* MC Type filter to get base list for dropdown
    const baseListForDropdown = this.planList.filter(item => {
      // Logic copied from above (simplified) - Must match all conditions EXCEPT mcType
      // Note: This is computationally expensive but necessary for the requested feature.
      // Optimization: We can do it in one pass if we refactor, but for now duplicate logic is safer to avoid breaking existing flow.

      const parts = item.date.split('/');
      if (parts.length !== 3) return false;
      const [day, month, year] = parts.map(Number);
      const normalizedYear = year > 2400 ? year - 543 : year;
      const itemDate = new Date(normalizedYear, month - 1, day);
      const key = item.groupKey; // Already calculated
      const isLatest = item.isLatest; // Already calculated
      const isActiveLatest = (item.planStatus === 'Active' || item.planStatus === 'Incomplete') && isLatest;

      let matchDivision = this.filterDivision ? item.division === this.filterDivision : true;
      let matchFac = this.filterFac ? item.fac === this.filterFac : true;
      let matchProcess = this.filterProcess ? item.process === this.filterProcess : true;
      let matchPartNo = this.filterPartNo ? item.partNo === this.filterPartNo : true;

      let matchStatus = true;
      if (this.filterStatus) {
        if (this.filterStatus === 'Cancelled') {
          matchStatus = item.planStatus === 'Cancelled';
        } else {
          const calculatedStatus = this.getProcessStatus(item).label;
          matchStatus = item.planStatus !== 'Cancelled' && calculatedStatus === this.filterStatus;
        }
      }
      // SKIP matchMachine

      if (!matchDivision || !matchFac || !matchProcess || !matchPartNo || !matchStatus) return false;

      let matchSubTab = true;
      // ... (Re-use subtab logic logic is complex due to dependence on item properties)
      // To strictly follow "current view", we must replicate the exact subtab logic.

      // Date Range Logic
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCopy = new Date(today);
      let endDate = new Date(todayCopy);
      if (this.selectedDateRange === '7 DAY') endDate.setDate(todayCopy.getDate() + 7);
      else if (this.selectedDateRange === '30 DAY') endDate.setDate(todayCopy.getDate() + 30);
      const isInRange = (this.selectedDateRange === 'ALL') ? true : (itemDate >= today && itemDate <= endDate);

      const isActionRequiredTab = (this.selectedSubTab === 'Required');
      const isCompletedTab = (this.selectedSubTab === 'Completed');

      // SubTab Logic
      if (this.selectedSubTab === 'Upcoming') {
        if (this.selectedDateRange === 'ALL') matchSubTab = itemDate >= today;
        else matchSubTab = itemDate >= today && itemDate <= endDate;
      } else if (isActionRequiredTab) {
        let actionNeeded = false;
        if (item.planStatus !== 'Cancelled') {
          if (this.selectedDepartment === 'EN') {
            const hasDwg = item.pathDwg && item.pathDwg !== '-' && item.pathDwg.trim() !== '';
            const hasLayout = item.pathLayout && item.pathLayout !== '-' && item.pathLayout.trim() !== '';
            actionNeeded = !hasDwg || !hasLayout;
          } else if (this.selectedDepartment === 'QC') {
            const hasIIQC = item.iiqc && item.iiqc !== '-' && item.iiqc.trim() !== '';
            actionNeeded = !hasIIQC;
          }
        }
        matchSubTab = actionNeeded && isInRange;
      } else if (isCompletedTab) {
        let isCompleted = false;
        if (this.selectedDepartment === 'EN') {
          const hasDwg = item.pathDwg && item.pathDwg !== '-' && item.pathDwg.trim() !== '';
          const hasLayout = item.pathLayout && item.pathLayout !== '-' && item.pathLayout.trim() !== '';
          isCompleted = hasDwg && hasLayout;
        } else if (this.selectedDepartment === 'QC') {
          const hasIIQC = item.iiqc && item.iiqc !== '-' && item.iiqc.trim() !== '';
          isCompleted = hasIIQC;
        }
        matchSubTab = isCompleted && isInRange;
      }

      // Date Filter
      const matchDate = this.filterDate ? this.isDateMatch(item.date, this.filterDate) : true;

      if (!matchSubTab || !matchDate) return false;

      // History Logic
      if (this.showHistory) return true;
      return isLatest;
    });

    // Update Dropdown Options
    const seenMCs = new Set(baseListForDropdown.map(i => i.mcType).filter(m => m));
    this.machineTypes = Array.from(seenMCs).sort();

    const seenFacs = new Set(baseListForDropdown.map(i => i.fac).filter(f => f));
    this.facList = Array.from(seenFacs).sort();

    const seenProcesses = new Set(baseListForDropdown.map(i => i.process).filter(p => p));
    this.processList = Array.from(seenProcesses).sort();

    const seenPartNos = new Set(baseListForDropdown.map(i => i.partNo).filter(p => p));
    this.partNoList = Array.from(seenPartNos).sort();

    const seenPartBefores = new Set(this.planList.map(i => i.partBefore).filter(p => p));
    this.partBeforeList = Array.from(seenPartBefores).sort();

    const seenBarTypes = new Set(this.planList.map(i => i.barType).filter(b => b));
    this.barTypeList = Array.from(seenBarTypes).sort();

    // Fix: If the currently selected items are no longer available in the new lists, reset them
    let shouldReFilter = false;

    if (this.filterMachineType && !seenMCs.has(this.filterMachineType)) {
      this.filterMachineType = '';
      shouldReFilter = true;
    }
    if (this.filterFac && !seenFacs.has(this.filterFac)) {
      this.filterFac = '';
      shouldReFilter = true;
    }
    if (this.filterProcess && !seenProcesses.has(this.filterProcess)) {
      this.filterProcess = '';
      shouldReFilter = true;
    }
    if (this.filterPartNo && !seenPartNos.has(this.filterPartNo)) {
      this.filterPartNo = '';
      shouldReFilter = true;
    }

    if (shouldReFilter) {
      this.applyFilter();
      return; // Exit current run
    }
  }

  // Helper สำหรับเช็ควันที่
  isDateMatch(itemDateStr: string, filterDateObj: Date | null): boolean {
    if (!itemDateStr || !filterDateObj) return false;

    // itemDateStr: dd/mm/yyyy
    // filterDateObj: Date Object from p-calendar

    const parts = itemDateStr.split('/');
    if (parts.length !== 3) return false;

    const [day, month, year] = parts.map(Number);
    // Create Date from item string (Local time assumed for date parts)
    // Note: Creating date with (year, monthIndex, day)

    // Compare logic:
    // filterDateObj is a Date object.

    // Simplest way: Compare d/m/y parts
    return day === filterDateObj.getDate() &&
      (month - 1) === filterDateObj.getMonth() &&
      year === filterDateObj.getFullYear();
  }

  // --- Process Status Logic ---
  getProcessStatus(item: any): { status: string, color: string, label: string } {
    const hasDwg = item.pathDwg && item.pathDwg !== '-' && item.pathDwg.trim() !== '';
    const hasLayout = item.pathLayout && item.pathLayout !== '-' && item.pathLayout.trim() !== '';
    const hasIIQC = item.iiqc && item.iiqc !== '-' && item.iiqc.trim() !== '';

    const hasEn = hasDwg && hasLayout;
    const hasQC = hasIIQC;

    if (!hasEn && !hasQC) {
      return { status: 'WAIT_BOTH', color: 'badge-wait-both', label: 'Wait En & QC' };
    } else if (!hasEn) {
      return { status: 'WAIT_ENG', color: 'badge-wait-eng', label: 'Wait Eng' };
    } else if (!hasQC) {
      return { status: 'WAIT_QC', color: 'badge-wait-qc', label: 'Wait QC' };
    } else {
      return { status: 'READY', color: 'badge-ready', label: 'Ready' };
    }
  }

  // --- Request Navigation ---
  onRequest(item: any) {
    console.log('Navigating to Request with item:', item);

    // Prepare Query Params
    const queryParams = {
      case: 'SET', // Force SET case
      division: item.division,
      fac: item.fac,
      partNo: item.partNo,
      process: item.process,
      mc: item.mcType,
      mcNo: item.mcNo,
      qty: item.qty,
      fromPlan: 'true',
      date: item.date // Pass date to Request
    };

    this.router.navigate(['/production/request'], { queryParams: queryParams });
  }

  onAdd() {
    this.editData = {
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      dateObj: new Date(),
      division: 'PMC', // Default to PMC
      divisionCode: '7122',
      mcType: '',
      barType: '',
      fac: '',
      partBefore: '',
      mcNo: '',
      partNo: '',
      qty: 0,
      time: '',
      comment: '',
      pathDwg: '',
      pathLayout: '',
      iiqc: '',
      revision: 0,
      planStatus: 'Active',
      groupId: '-', // Special marker for new plan
      isNew: true
    };

    // Call API to populate dropdowns default for PMC
    const divisionId = this.getDivisionIdForApi(this.editData);
    this.populateModalDropdowns(divisionId);

    this.isEditModalOpen = true;
  }

  isEditModalOpen: boolean = false;
  editData: any = {};

  onEdit(item: any) {
    this.editData = { ...item }; // Clone data
    this.editData.originalItem = { ...item }; // Keep original for comparison

    // Strip hyphens from paths for easier editing
    this.editData.pathDwg = this.editData.pathDwg === '-' ? '' : this.editData.pathDwg;
    this.editData.pathLayout = this.editData.pathLayout === '-' ? '' : this.editData.pathLayout;
    this.editData.iiqc = this.editData.iiqc === '-' ? '' : this.editData.iiqc;

    // Determine context based on selectedDepartment
    this.editData.context = this.selectedDepartment;

    // Format Date for p-calendar (Date object)
    if (this.editData.date) {
      const parts = this.editData.date.split('/');
      if (parts.length === 3) {
        // parts: [dd, mm, yyyy] -> new Date(yyyy, mm-1, dd)
        this.editData.dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }

    // Call API to populate dropdowns specific to this item's division
    const divisionId = this.getDivisionIdForApi(this.editData);
    this.populateModalDropdowns(divisionId);

    this.isEditModalOpen = true;
  }

  // --- API Dropdown Mapping Helpers ---
  getDivisionIdForApi(item: any): string {
    const div = item.divisionCode || item.division || '';
    if (div === '2' || div.toUpperCase() === 'PMC' || div === '71DZ') return '2';
    if (div === '3' || div.toUpperCase() === 'GM' || div === '71D1') return '3';
    return '2'; // Default to PMC
  }

  populateModalDropdowns(divisionId: string) {
    this.pcPlanService.getMasterData(divisionId).subscribe({
      next: (res) => {
        // Map Result Set 1 (MC Type & Bar Type)
        if (res.machines && res.machines.length > 0) {
          const uniqueMcs = new Set<string>(res.machines.map((m: any) => m.MC || m.MC_Type).filter((v: any) => v));
          this.modalMachineTypes = Array.from(uniqueMcs).sort();
          this.modalBarTypeList = Array.from(uniqueMcs).sort(); // Sharing the same list per requirement
        } else {
          this.modalMachineTypes = [];
          this.modalBarTypeList = [];
        }

        // Map Result Set 2 (Facility)
        if (res.facilities && res.facilities.length > 0) {
          const uniqueFacs = new Set<string>(res.facilities.map((f: any) => f.FacilityShort).filter((v: any) => v));
          this.modalFacList = Array.from(uniqueFacs).sort();
        } else {
          this.modalFacList = [];
        }

        // Map Result Set 3 (Process)
        if (res.processes && res.processes.length > 0) {
          const uniqueProcs = new Set<string>(res.processes.map((p: any) => p.Process).filter((v: any) => v));
          this.modalProcessList = Array.from(uniqueProcs).sort();
        } else {
          this.modalProcessList = [];
        }

        // Map Result Set 4 (PartNo & PartBefore)
        if (res.partNos && res.partNos.length > 0) {
          const uniqueParts = new Set<string>(res.partNos.map((p: any) => p.PartNo).filter((v: any) => v));
          this.modalPartNoList = Array.from(uniqueParts).sort();
          this.modalPartBeforeList = Array.from(uniqueParts).sort();
        } else {
          this.modalPartNoList = [];
          this.modalPartBeforeList = [];
        }
      },
      error: (err) => {
        console.error('Failed to load modal dropdown master data:', err);
      }
    });
  }

  onCancel(item: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to cancel this plan?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Create a new revision with status 'Cancelled'
        // We reuse insertPCPlan logic but set status

        // Need dateObj for payload
        let dateObj = '';
        if (item.date) {
          const parts = item.date.split('/');
          if (parts.length === 3) {
            dateObj = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }

        const payload = [{
          date: dateObj,
          employeeId: item.empId || this.currentUser.Employee_ID,
          division: item.divisionCode || item.division,

          mcType: item.mcType,
          fac: item.fac,
          partBefore: item.partBefore,
          mcNo: item.mcNo,
          partNo: item.partNo,
          process: item.process,
          qty: item.qty,
          time: item.time,
          comment: item.comment,
          pathDwg: item.pathDwg === '-' ? '' : item.pathDwg,
          pathLayout: item.pathLayout === '-' ? '' : item.pathLayout,
          iiqc: item.iiqc === '-' ? '' : item.iiqc,

          groupId: item.groupId,
          revision: (item.revision || 0) + 1,
          planStatus: 'Cancelled'
        }];

        this.pcPlanService.savePlan(payload).subscribe({
          next: (res) => {
            Swal.fire('Cancelled!', 'The plan has been cancelled.', 'success');
            this.loadPlanList();
          },
          error: (err) => {
            console.error('Cancel Error:', err);
            Swal.fire('Error', 'Failed to cancel plan.', 'error');
          }
        });
      }
    });
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  allowedDepartments: string[] = []; // Stores departments the user can actually access

  isDeptAllowed(dept: string): boolean {
    return this.allowedDepartments.includes(dept);
  }

  // --- Tab Selection ---
  selectDepartment(dept: string) {
    // Prevent selection if not allowed
    if (!this.isDeptAllowed(dept)) {
      return;
    }

    this.selectedDepartment = dept;

    // Dynamically update sub-tabs based on department
    if (dept === 'EN' || dept === 'QC') {
      // Reorder: Required first, then Completed, then Upcoming (Requested Order)
      if (dept === 'EN') {
        this.subTabs = ['Required', 'Completed', 'Upcoming'];
      } else if (dept === 'QC') {
        this.subTabs = ['Required', 'Completed', 'Upcoming'];
      } else {
        this.subTabs = ['Required', 'Upcoming'];
      }
      this.selectedSubTab = 'Required'; // Auto-select Required
    } else {
      this.subTabs = ['Upcoming'];
      this.selectedSubTab = 'Upcoming';
    }

    // --- Division Filter Modal Logic ---
    const targetTabs = ['PC', 'PD', 'EN', 'QC'];
    if (targetTabs.includes(dept)) {
      const storedDivision = sessionStorage.getItem('planlist_preferred_division');
      if (storedDivision) {
        // อัปเดตตัวแปรที่เป็น Model ของ Dropdown
        this.filterDivision = storedDivision;
        this.applyFilter();
      } else {
        // Show forced-choice modal if no preference exists
        this.promptDivisionSelection();
      }
    } else {
      this.applyFilter();
    }
  }

  // Helper method for Division Selection Modal
  promptDivisionSelection() {
    Swal.fire({
      iconHtml: '<i class="bi bi-person-badge"></i>',
      title: '<span style="font-family: Inter, Kanit; font-weight: 800; color: #1e293b; font-size: 1.65rem;">Select Division</span>',
      html: `
        <div style="font-family: Inter, Kanit; color: #475569; font-size: 0.95rem; margin-top: 5px; line-height: 1.5;">
          กรุณาเลือก Division เพื่อเข้าดูข้อมูลแผนงาน<br>
          ระบบจะ<strong style="color: #0f172a;">จดจำตัวเลือกของคุณ</strong>สำหรับการเข้าใช้งานครั้งนี้
        </div>
        
      `,
      showCancelButton: true,
      confirmButtonText: 'PMC',
      cancelButtonText: 'GM',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      buttonsStyling: false,
      customClass: {
        popup: 'swal-premium-popup-minimal',
        confirmButton: 'swal-btn-pmc',
        cancelButton: 'swal-btn-gm',
        icon: 'swal-custom-icon-borderless',
        actions: 'swal-actions-split'
      }
    }).then((result) => {
      let selectedDiv = '';
      if (result.isConfirmed) {
        selectedDiv = 'PMC';
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        selectedDiv = 'GM';
      }

      if (selectedDiv) {
        sessionStorage.setItem('planlist_preferred_division', selectedDiv);
        this.filterDivision = selectedDiv;
        this.applyFilter();
      }
    });
  }

  getActionRequiredCount(dept: string): number {
    return this.subTabCounts['Required'] || 0;
  }

  selectSubTab(tab: string) {
    this.selectedSubTab = tab;
    // Reset date range when switching sub-tabs if needed
    if (tab === 'Upcoming') {
      this.selectedDateRange = 'ALL';
    }
    this.applyFilter();
  }

  selectDateRange(range: string) {
    this.selectedDateRange = range;
    this.applyFilter();
  }

  saveEdit() {
    // 1. Check if ANY changes occurred
    const original = this.editData.originalItem || {};

    // First convert dateObj back to DD/MM/YYYY string to compare with original date
    let newDateStr = this.editData.date;
    if (this.editData.dateObj instanceof Date && !isNaN(this.editData.dateObj.getTime())) {
      const d = this.editData.dateObj;
      newDateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }

    // Compare Plan Fields
    const isPlanChanged =
      newDateStr !== original.date ||
      this.editData.mcType !== original.mcType ||
      this.editData.barType !== original.barType ||
      this.editData.fac !== original.fac ||
      this.editData.process !== original.process ||
      this.editData.partBefore !== original.partBefore ||
      this.editData.mcNo !== original.mcNo ||
      this.editData.partNo !== original.partNo ||
      this.editData.qty != original.qty ||
      this.editData.time != original.time ||
      this.editData.comment !== original.comment;

    // Compare Path Fields
    const isPathChanged =
      this.editData.pathDwg !== original.pathDwg ||
      this.editData.pathLayout !== original.pathLayout ||
      this.editData.iiqc !== original.iiqc;

    console.log('Changes Detected -> Plan:', isPlanChanged, 'Path:', isPathChanged);

    if (!isPlanChanged && !isPathChanged) {
      Swal.fire({
        title: 'No Changes',
        text: 'You haven\'t modified anything.',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
      });
      this.isEditModalOpen = false;
      return;
    }

    // 2. Show Confirmation Dialog
    Swal.fire({
      title: 'Confirm Save',
      text: "Do you want to save these changes?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, save changes!',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        confirmButton: 'swal-premium-confirm',
        cancelButton: 'swal-premium-cancel'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeSave(isPlanChanged, isPathChanged);
      }
    });
  }

  private executeSave(isPlanChanged: boolean, isPathChanged: boolean) {
    Swal.fire({
      title: 'Saving...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // 0. PC Logic: Prefer updatePaths if ONLY paths changed, otherwise savePlan (New Revision)
    if (this.selectedDepartment === 'EN' || this.selectedDepartment === 'QC') {
      if (isPathChanged) {
        const pathPayload = {
          groupId: this.editData.groupId,
          pathDwg: this.editData.pathDwg,
          pathLayout: this.editData.pathLayout,
          iiqc: this.editData.iiqc
        };

        this.pcPlanService.updatePaths(pathPayload).subscribe({
          next: (res) => {
            Swal.fire('Success', 'Attachments updated!', 'success');
            this.isEditModalOpen = false;
            this.loadPlanList();
          },
          error: (err) => {
            console.error('Update Path Error:', err);
            Swal.fire('Error', err.error?.message || 'Failed to update attachments.', 'error');
          }
        });
      } else {
        this.isEditModalOpen = false;
      }
      return;
    }

    if (this.selectedDepartment === 'PC') {
      if (isPathChanged && !isPlanChanged) {
        const pathPayload = {
          groupId: this.editData.groupId,
          pathDwg: this.editData.pathDwg,
          pathLayout: this.editData.pathLayout,
          iiqc: this.editData.iiqc
        };

        this.pcPlanService.updatePaths(pathPayload).subscribe({
          next: (res) => {
            Swal.fire('Success', 'Paths updated!', 'success');
            this.isEditModalOpen = false;
            this.loadPlanList();
          },
          error: (err) => {
            console.error('Update Path Error:', err);
            Swal.fire('Error', 'Failed to update paths.', 'error');
          }
        });
      } else if (isPlanChanged) {
        // Build payload using newDateStr formatted as YYYY-MM-DD for the DB
        let finalDate = '';
        if (this.editData.dateObj instanceof Date && !isNaN(this.editData.dateObj.getTime())) {
          const d = this.editData.dateObj;
          finalDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        } else if (typeof this.editData.dateObj === 'string') {
          finalDate = this.editData.dateObj;
        } else {
          // fallback if dateObj is missing but original text date exists
          const parts = (this.editData.date || '').split('/');
          if (parts.length === 3) finalDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        const payload = [{
          date: finalDate,
          employeeId: this.editData.empId,
          division: this.editData.divisionCode || this.editData.division,
          mcType: this.editData.mcType,
          barType: this.editData.barType,
          fac: this.editData.fac,
          partBefore: this.editData.partBefore,
          mcNo: this.editData.mcNo,
          partNo: this.editData.partNo,
          process: this.editData.process,
          qty: this.editData.qty,
          time: this.editData.time,
          comment: this.editData.comment,
          pathDwg: this.editData.pathDwg,
          pathLayout: this.editData.pathLayout,
          iiqc: this.editData.iiqc,
          groupId: this.editData.groupId,
          revision: (this.editData.revision || 0) + 1,
          planStatus: 'Active'
        }];

        this.pcPlanService.savePlan(payload).subscribe({
          next: (res) => {
            Swal.fire('Success', 'Plan updated (New Revision)!', 'success');
            this.isEditModalOpen = false;
            this.loadPlanList();
          },
          error: (err) => {
            console.error('Insert Plan Error:', err);
            Swal.fire('Error', 'Failed to update plan.', 'error');
          }
        });
      }
    }
  }


  // ฟังก์ชันเมื่อกดปุ่ม Delete
  onDelete(item: any) {
    if (!item.groupId) {
      Swal.fire('Error', 'No GroupId found for this item.', 'error');
      return;
    }

    Swal.fire({
      title: '<span style="color:#1e293b; font-weight:800;">Are you sure?</span>',
      html: `<div style="color:#64748b; font-size:1rem;">This will delete <b>ALL revisions</b> of this plan!<br><span style="color:#ef4444; font-weight:600;">You won't be able to revert this!</span></div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete all',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        confirmButton: 'swal-premium-confirm',
        cancelButton: 'swal-premium-cancel'
      },
      backdrop: `rgba(15, 23, 42, 0.6)`
    }).then((result) => {
      if (result.isConfirmed) {
        this.pcPlanService.deletePlanGroup(item.groupId).subscribe({
          next: () => {
            Swal.fire({
              title: '<span style="color:#059669; font-weight:800;">Deleted!</span>',
              text: 'All revisions have been deleted.',
              icon: 'success',
              customClass: {
                popup: 'swal-premium-popup',
                title: 'swal-premium-title',
                confirmButton: 'swal-premium-confirm swal-premium-confirm-success'
              }
            });
            // Reload ตารางใหม่
            this.loadPlanList();
          },
          error: (err: any) => {
            console.error('Delete error:', err);
            Swal.fire({
              title: '<span style="color:#ef4444; font-weight:800;">Error!</span>',
              text: 'Failed to delete. Please try again.',
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
    });
  }

  // --- History Logic ---
  isHistoryModalOpen: boolean = false;
  historyList: any[] = [];
  selectedHistoryItem: any = {};

  onViewHistory(item: any) {
    if (!item.groupId) {
      Swal.fire('Error', 'No GroupId found for this item.', 'error');
      return;
    }

    this.selectedHistoryItem = item;
    this.isHistoryModalOpen = true;
    this.historyList = []; // Clear old data

    // Fetch History
    this.pcPlanService.getPlanHistory(item.groupId).subscribe({
      next: (res) => {
        this.historyList = res.map((h: any) => ({
          ...h,
          date: h.PlanDate ? new Date(h.PlanDate).toLocaleDateString('en-US') : '',
        })).sort((a: any, b: any) => b.Revision - a.Revision);
      },
      error: (err) => {
        console.error('Error fetching history:', err);
        Swal.fire('Error', 'Failed to load history.', 'error');
      }
    });
  }

  closeHistoryModal() {
    this.isHistoryModalOpen = false;
  }

  mapDivisionName(code: string): string {
    if (!code) return 'Unknown';
    const c = code.toString().trim().toUpperCase();
    if (c === '7122' || c === '3' || c === 'GM') return 'GM';
    if (c === '71DZ' || c === '2' || c === 'PMC') return 'PMC';
    return code;
  }

  openFile(filePath: string) {
    if (!filePath) {
      Swal.fire('Error', 'File path not found', 'error');
      return;
    }

    // Clean path (remove quotes if any)
    const cleanPath = filePath.replace(/^"|"$/g, '');

    this.fileUploadService.loadPdfFromPath(cleanPath).subscribe({
      next: (res) => {
        const base64 = res.imageData.split(',')[1];
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // Default to PDF for now as per Cart example. 
        // Improvement: Detect mime type from extension if needed.
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        window.open(blobUrl, '_blank');
      },
      error: (err) => {
        console.error('File load error:', err);
        Swal.fire('Error', 'Unable to load file. It might be missing or inaccessible.', 'error');
      }
    });
  }

  copyToClipboard(path: string, label: string = 'Path') {
    if (!path) return;

    // Attempt to copy using Clipboard API
    navigator.clipboard.writeText(path).then(() => {
      Swal.fire({
        icon: 'success',
        title: `<span style="font-weight:700;">${label} Copied!</span>`,
        text: `${label} copied to clipboard.`,
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }).catch(err => {
      console.error('Clipboard failed:', err);
      // Fallback or Error message
      Swal.fire('Error', 'Could not copy path. Please copy manually.', 'error');
    });
  }

  // --- Print Functionality ---

  // --- Print Handling ---
  // --- Print Handling ---
  selectPrintType(type: string) {
    this.printType = type;
    this.onPrintTypeChange();
  }

  openPrintModal(item: any) {
    this.selectedItemForPrint = item;
    // User requested "don't input myself" and "count when printing".
    // Defaulting to 1 copy ensures it's valid (even if plan qty is 0) and increments count by 1.
    this.printQty = 1;
    this.printType = null;
    this.previewUrl = null;
    this.isPrintModalOpen = true;
  }

  previewZoom: number = 1;
  previewBlobUrl: string | null = null;

  closePrintModal() {
    this.isPrintModalOpen = false;
    this.selectedItemForPrint = null;
    this.printQty = null;
    this.printType = null;
    this.previewUrl = null;
    this.previewBlobUrl = null;
    this.previewZoom = 1;
  }

  // --- Zoom Controls ---
  zoomIn() {
    this.previewZoom += 0.25;
  }

  zoomOut() {
    if (this.previewZoom > 0.5) {
      this.previewZoom -= 0.25;
    }
  }

  resetZoom() {
    this.previewZoom = 1;
  }

  onPrintTypeChange() {
    this.previewZoom = 1;
    if (!this.selectedItemForPrint || !this.printType) {
      this.previewUrl = null;
      return;
    }

    const path = this.selectedItemForPrint[this.printType]?.replace(/^"|"$/g, '');
    if (!path || path === '-') {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่พบไฟล์', 'error');
      this.previewUrl = null;
      this.printType = null; // Reset selection
      return;
    }

    this.fileUploadService.loadPdfFromPath(path).subscribe({
      next: res => {
        const base64 = res.imageData.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        this.previewBlobUrl = blobUrl; // Store raw URL for new tab opening
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl + '#toolbar=0&navpanes=0&scrollbar=0');
      },
      error: err => {
        console.error('Error loading PDF:', err);
        Swal.fire('Error', 'Unable to load PDF preview.', 'error');
        this.previewUrl = null;
        this.previewBlobUrl = null;
      }
    });
  }

  openInNewTab() {
    if (this.previewBlobUrl) {
      window.open(this.previewBlobUrl, '_blank');
    }
  }

  printPdf() {
    if (!this.selectedItemForPrint || !this.printType) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือกประเภทที่ต้องการพิมพ์', 'warning');
      return;
    }

    const qty = 1; // Default to 1 for history tracking without user input

    const path = this.selectedItemForPrint[this.printType]?.replace(/^"|"$/g, '');
    if (!path || path === '-') {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่พบไฟล์', 'error');
      return;
    }

    // Load PDF again for printing (consistent with History logic)
    this.fileUploadService.loadPdfFromPath(path).subscribe({
      next: res => {
        const base64 = res.imageData.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        const employeeId = this.currentUser?.Employee_ID || 'Unknown';

        // NOTE: Using GroupId as DocNo because PlanList items don't have a formal DocNo
        // This links the print history to the plan group.
        const docNoToSave = this.selectedItemForPrint.groupId;

        let typePrintToSend = '';
        if (this.printType === 'pathLayout') typePrintToSend = 'PathLayout';
        else if (this.printType === 'pathDwg') typePrintToSend = 'PathDwg';
        else if (this.printType === 'iiqc') typePrintToSend = 'IIQC';

        // Parse DueDate to ensure it's a valid Date object for SQL
        let dueDateVal = this.selectedItemForPrint.date;
        if (typeof dueDateVal === 'string') {
          // Attempt to parse 'dd/mm/yyyy' or 'yyyy-mm-dd'
          const parts = dueDateVal.split('/');
          if (parts.length === 3) {
            dueDateVal = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          } else {
            dueDateVal = new Date(dueDateVal);
          }
        }
        // Fallback to today if invalid
        if (!dueDateVal || isNaN(dueDateVal.getTime())) {
          dueDateVal = new Date();
        }

        // Create hidden iframe for print
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
          const contentWindow = iframe.contentWindow;
          if (contentWindow) {

            // 1. Save Print History Immediately
            this.savePrintHistory(qty, docNoToSave, typePrintToSend, employeeId, dueDateVal);

            // 2. Focus and Print (Wrapped in setTimeout to allow HTTP request to dispatch before blocking thread)
            setTimeout(() => {
              contentWindow.focus();
              contentWindow.print();
            }, 100);

            // 3. Clean up iframe when print dialog closes
            const onPrintClose = () => {
              setTimeout(() => {
                try {
                  document.body.removeChild(iframe);
                  URL.revokeObjectURL(blobUrl);
                } catch (e) { }
              }, 1000);
            };

            contentWindow.onafterprint = onPrintClose;
          }
        };

      },
      error: err => {
        console.error('Error print PDF:', err);
        Swal.fire('Error', 'Unable to load PDF for printing.', 'error');
      }
    });
  }

  savePrintHistory(qty: number, docNoToSave: string, typePrintToSend: string, employeeId: string, dueDateVal: any) {
    this.historyPrint.SaveHistoryPrint({
      EmployeeID: employeeId,
      Division: this.selectedItemForPrint.division || 'Unknown',
      DocNo: docNoToSave || '-',
      PratNo: this.selectedItemForPrint.partNo || '-',
      DueDate: dueDateVal,
      TypePrint: typePrintToSend,
      Total: qty
    }).subscribe({
      next: () => {

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Print history saved.',
          showConfirmButton: false,
          timer: 2000
        });
      },
      error: err => {
        console.error("Save history error:", err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to save print history.',
          showConfirmButton: false,
          timer: 3000
        });
      }
    });
  }

  // --- Export to Excel (Styled with ExcelJS) ---
  onExport() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PlanList');

    // 1. Define Columns & Widths
    worksheet.columns = [
      { header: 'Date', key: 'Date', width: 15 },
      { header: 'Div', key: 'Div', width: 10 },
      { header: 'Machine Type', key: 'MachineType', width: 15 },
      { header: 'Fac', key: 'Fac', width: 15 },
      { header: 'MC No', key: 'MCNo', width: 10 },
      { header: 'Process', key: 'Process', width: 15 },
      { header: 'Part Before', key: 'PartBefore', width: 25 },
      { header: 'Part No.', key: 'PartNo', width: 25 },
      { header: 'QTY', key: 'QTY', width: 15 },
      { header: 'Time', key: 'Time', width: 10 },
      { header: 'Comment', key: 'Comment', width: 20 },
    ];

    // 2. Add Data (with Custom Mapping)
    this.filteredPlanList.forEach(item => {
      // Map Division: GM -> 7122, PMC -> 71DZ
      let displayDiv = item.division;
      if (item.division === 'GM') displayDiv = '7122';
      else if (item.division === 'PMC') displayDiv = '71DZ';

      worksheet.addRow({
        Date: item.date,
        Div: displayDiv,
        MachineType: item.mcType,
        Fac: item.fac,
        MCNo: item.mcNo,
        Process: item.process,
        PartBefore: item.partBefore,
        PartNo: item.partNo,
        QTY: item.qty,
        Time: item.time,
        Comment: item.comment
      });
    });

    // 3. Style Header (Row 1) - Green Background, White Text
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1B5E20' } // Green 900
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' }, // White
        bold: true,
        size: 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    // 4. Style Data Rows (Borders & Alignment)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip Header
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      }
    });

    // 5. AutoFilter
    worksheet.autoFilter = { from: 'A1', to: 'K1' };

    // 6. Generate Filename & Export
    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const fileName = `PlanList_Export_${datePart}.xlsx`;

    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}

