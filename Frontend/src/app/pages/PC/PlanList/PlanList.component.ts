import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { PCPlanService } from '../../../core/services/PCPlan.service';
import { FileUploadSerice } from '../../../core/services/FileUpload.service';
import { HistoryPrint } from '../../../core/services/HistoryPrint.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './PlanList.component.html',
  styleUrls: ['./PlanList.component.scss']
})
export class PlanListComponent implements OnInit {

  // ตัวแปรสำหรับ Filter
  filterDate: string = '';
  filterDivision: string = '';
  filterMachineType: string = '';
  showHistory: boolean = false; // Toggle for Global History
  currentUser: any;

  // รายการใน Dropdown Filter
  divisions: string[] = ['GM', 'PMC'];
  machineTypes: string[] = ['CNC', 'Lathe', 'Milling'];

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      this.checkPrintPermission();
    }
    this.loadPlanList();
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

  loadPlanList() {
    this.pcPlanService.getPlanList(this.showHistory).subscribe({
      next: (res) => {
        // Map ข้อมูลจาก Backend (PascalCase) -> Frontend (camelCase)
        this.planList = res.map((item: any) => ({
          id: item.Plan_ID,
          date: item.PlanDate ? new Date(item.PlanDate).toLocaleDateString('en-US') : '', // mm/dd/yyyy
          // empId: item.Employee_ID,
          division: this.mapDivisionName(item.Division), // Map Code to Name
          mcType: item.MC_Type, // HTML ใช้ mcType
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
        this.updatePrintCounts(); // Fetch latest print counts
      },
      error: (err: any) => {
        console.error('Error loading plan list:', err);
      }
    });
  }

  // ฟังก์ชันสำหรับกรองข้อมูล
  applyFilter() {
    this.filteredPlanList = this.planList.filter(item => {
      // 1. Filter Date (ต้องแปลง format ให้ตรงกันก่อน)
      const matchDate = this.filterDate ? this.isDateMatch(item.date, this.filterDate) : true;
      // 2. Filter Division
      const matchDivision = this.filterDivision ? item.division === this.filterDivision : true;
      // 3. Filter Machine Type
      const matchMachine = this.filterMachineType ? item.mcType === this.filterMachineType : true;

      return matchDate && matchDivision && matchMachine;
    });

    // เรียงลำดับ: วันที่ล่าสุด -> Revision ล่าสุด
    this.filteredPlanList.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;

      // GroupId Check (Group items together just in case date is same) - Optional but good practice
      if (a.groupId && b.groupId && a.groupId !== b.groupId) {
        return a.groupId.localeCompare(b.groupId);
      }

      return (b.revision || 0) - (a.revision || 0);
    });

    // --- Post-Processing for Display ---
    // Mark 'isLatest' and 'isGroupStart' for UI Styling
    const seenGroups = new Set<string>();
    let lastGroupId = '';

    this.filteredPlanList.forEach((item, index) => {
      // 1. Check isLatest (First time seeing this GroupId in the sorted list = Latest)
      // Since we sort by Revision DESC within Group, the first one is the latest.
      if (!seenGroups.has(item.groupId)) {
        item.isLatest = true;
        seenGroups.add(item.groupId);
      } else {
        item.isLatest = false;
      }

      // 2. Check isGroupStart (Separator)
      if (item.groupId !== lastGroupId) {
        item.isGroupStart = true;
        lastGroupId = item.groupId;
      } else {
        item.isGroupStart = false;
      }
    });
  }

  // Helper สำหรับเช็ควันที่
  isDateMatch(itemDateStr: string, filterDateStr: string): boolean {
    // itemDateStr format: mm/dd/yyyy (from toLocaleDateString en-US)
    // filterDateStr format: yyyy-mm-dd (from input type="date")
    if (!itemDateStr || !filterDateStr) return false;

    const [month, day, year] = itemDateStr.split('/');
    // padStart to ensure 2 digits
    const formattedItemDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    return formattedItemDate === filterDateStr;
  }

  // --- Edit Logic ---
  isEditModalOpen: boolean = false;
  editData: any = {};

  onEdit(item: any) {
    this.editData = { ...item }; // Clone data
    this.editData.originalItem = { ...item }; // Keep original for comparison

    // Format Date for <input type="date"> (yyyy-MM-dd)
    if (this.editData.date) {
      const parts = this.editData.date.split('/');
      if (parts.length === 3) {
        // parts: [mm, dd, yyyy]
        this.editData.dateObj = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }

    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  saveEdit() {
    // Check if ONLY Paths have changed (and nothing else)
    const original = this.editData.originalItem || {};

    // Compare Plan Fields
    // Note: We need to match the type (string/number) for accurate comparison
    const isPlanChanged =
      this.editData.date !== original.date ||
      this.editData.mcType !== original.mcType ||
      this.editData.fac !== original.fac ||
      this.editData.process !== original.process ||
      this.editData.partBefore !== original.partBefore ||
      this.editData.mcNo !== original.mcNo ||
      this.editData.partNo !== original.partNo ||
      this.editData.qty != original.qty || // Use != for loose comparison (string vs number)
      this.editData.time != original.time ||
      this.editData.comment !== original.comment; // User said Comment cancel changes status, so it's a Plan change

    // Compare Path Fields
    const isPathChanged =
      this.editData.pathDwg !== original.pathDwg ||
      this.editData.pathLayout !== original.pathLayout ||
      this.editData.iiqc !== original.iiqc;

    console.log('Plan Changed:', isPlanChanged, 'Path Changed:', isPathChanged);

    Swal.fire({
      title: 'Saving...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    if (isPathChanged && !isPlanChanged) {
      // --- CASE 1: ONLY Path Update (No Rev Change) ---
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
          Swal.fire('Error', 'Failed to update attachments.', 'error');
        }
      });

    } else {
      // --- CASE 2: Plan Changed (New Revision) OR Nothing Changed ---
      // 1. Prepare Payload
      // Note: We send an array because backend insertPCPlan expects an array
      const payload = [{
        date: this.editData.dateObj, // yyyy-MM-dd
        employeeId: this.editData.empId,
        division: this.editData.division,
        mcType: this.editData.mcType,
        fac: this.editData.fac,
        partBefore: this.editData.partBefore,
        process: this.editData.process,
        mcNo: this.editData.mcNo,
        partNo: this.editData.partNo,
        qty: this.editData.qty,
        time: this.editData.time,
        comment: this.editData.comment,
        pathDwg: this.editData.pathDwg,
        pathLayout: this.editData.pathLayout,
        iiqc: this.editData.iiqc,
        groupId: this.editData.groupId // Use existing GroupId
      }];

      this.pcPlanService.savePlan(payload).subscribe({
        next: (res) => {
          Swal.fire('Success', 'Plan updated successfully!', 'success');
          this.isEditModalOpen = false;
          this.loadPlanList(); // Reload to see new Revision
        },
        error: (err) => {
          console.error('Save Edit Error:', err);
          Swal.fire('Error', 'Failed to update plan.', 'error');
        }
      });
    }
  }


  // ฟังก์ชันเมื่อกดปุ่ม Delete
  onDelete(item: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pcPlanService.deletePlan(item.id).subscribe({
          next: () => {
            Swal.fire(
              'Deleted!',
              'Your file has been deleted.',
              'success'
            );
            // Reload ตารางใหม่
            this.loadPlanList();
          },
          error: (err: any) => {
            console.error('Delete error:', err);
            Swal.fire(
              'Error!',
              'Failed to delete. Please try again.',
              'error'
            );
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
        }));
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
    if (code === '7122') return 'GM';
    if (code === '71DZ') return 'PMC';
    return code; // Return original if no match
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

  copyToClipboard(path: string) {
    if (!path) return;

    // Attempt to copy using Clipboard API
    navigator.clipboard.writeText(path).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Path copied to clipboard. Paste it in File Explorer.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }).catch(err => {
      console.error('Clipboard failed:', err);
      // Fallback or Error message
      Swal.fire('Error', 'Could not copy path. Please copy manually.', 'error');
    });
  }

  // --- Print Functionality ---

  openPrintModal(item: any) {
    this.selectedItemForPrint = item;
    // User requested "don't input myself" and "count when printing".
    // Defaulting to 1 copy ensures it's valid (even if plan qty is 0) and increments count by 1.
    this.printQty = 1;
    this.printType = null;
    this.previewUrl = null;
    this.isPrintModalOpen = true;
  }

  closePrintModal() {
    this.isPrintModalOpen = false;
    this.selectedItemForPrint = null;
    this.printQty = null;
    this.printType = null;
    this.previewUrl = null;
  }

  onPrintTypeChange() {
    if (!this.selectedItemForPrint || !this.printType) {
      this.previewUrl = null;
      return;
    }

    const path = this.selectedItemForPrint[this.printType]?.replace(/^"|"$/g, '');
    if (!path || path === '-') {
      Swal.fire('Error', 'File not Found', 'error');
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
        const blobUrl = URL.createObjectURL(blob) + '#toolbar=0&navpanes=0&scrollbar=0';
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      },
      error: err => {
        console.error('Error loading PDF:', err);
        Swal.fire('Error', 'Unable to load PDF preview.', 'error');
        this.previewUrl = null;
      }
    });
  }

  printPdf() {
    if (!this.selectedItemForPrint || !this.printType) {
      Swal.fire('Warning', 'Please select a Type.', 'warning');
      return;
    }

    const qty = Number(this.printQty);
    if (!qty || qty <= 0) {
      Swal.fire('Warning', 'Please enter a valid quantity.', 'warning');
      return;
    }

    const path = this.selectedItemForPrint[this.printType]?.replace(/^"|"$/g, '');
    if (!path || path === '-') {
      Swal.fire('Error', 'File not Found', 'error');
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

        // Map printType back to backend expected 'TypePrint' values if needed
        // HistoryComponent sends 'PathLayout' or 'PathDwg'.
        // My options are 'pathLayout' or 'pathDwg'.
        // Let's capitalize to match history service expectations if they exist, 
        // but looking at HistoryComponent.ts: { label: 'Layout', value: 'PathLayout' }
        // My values are 'pathLayout' (camelCase from item props). 
        // I should probably send 'PathLayout' or 'PathDwg' to be consistent with database if strictly required?
        // HistoryComponent checks: c.TypePrint === 'PathLayout'
        // So I should convert my 'pathLayout' -> 'PathLayout'.

        let typePrintToSend = '';
        if (this.printType === 'pathLayout') typePrintToSend = 'PathLayout';
        else if (this.printType === 'pathDwg') typePrintToSend = 'PathDwg';

        this.historyPrint.SaveHistoryPrint({
          EmployeeID: employeeId,
          Division: this.selectedItemForPrint.division || '', // Division name
          DocNo: docNoToSave,
          PratNo: this.selectedItemForPrint.partNo,
          DueDate: this.selectedItemForPrint.date, // Plan Date
          TypePrint: typePrintToSend,
          Total: qty
        }).subscribe({
          next: () => {
            // Update counts locally
            this.updatePrintCounts();

            this.closePrintModal();

            // Create hidden iframe for print
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = blobUrl;
            document.body.appendChild(iframe);

            iframe.onload = () => {
              // Just print once. History records the 'qty' entered by user.
              // User must manually set copies in browser dialog if > 1.
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();

              // Remove iframe after printing dialog closes (or short delay) to keep DOM clean
              setTimeout(() => {
                document.body.removeChild(iframe);
              }, 1000);
            };
          },
          error: err => {
            console.error("Save history error:", err);
            // Still print? Or block? HistoryComponent blocks on error implicitly if it crashes, but logic is inside success.
            Swal.fire('Error', 'Failed to save print history.', 'error');
          }
        });
      },
      error: err => {
        console.error('Error print PDF:', err);
        Swal.fire('Error', 'Unable to load PDF for printing.', 'error');
      }
    });
  }

  updatePrintCounts() {
    this.historyPrint.get_Total().subscribe({
      next: (counts: any[]) => {
        this.planList.forEach(item => {
          // Filter by DocNo (which we decided is GroupId) and PartNo
          // But wait, PlanList item doesn't have DocNo. We used GroupId.
          // BE CAREFUL: Old history records use actual DocNo from Request.
          // My new records use GroupId as DocNo.
          // So I should match c.DocNo == item.groupId

          // However, if I want to show counts for THIS plan item, I need to match what I saved.
          const docNoKey = item.groupId;

          const layoutTotal = counts
            .filter(c =>
              String(c.DocNo).trim() === String(docNoKey).trim() &&
              String(c.PratNo).trim() === String(item.partNo).trim() &&
              c.TypePrint === 'PathLayout'
            )
            .reduce((sum, c) => sum + Number(c.Total), 0);

          const dwgTotal = counts
            .filter(c =>
              String(c.DocNo).trim() === String(docNoKey).trim() &&
              String(c.PratNo).trim() === String(item.partNo).trim() &&
              c.TypePrint === 'PathDwg'
            )
            .reduce((sum, c) => sum + Number(c.Total), 0);

          item.printLayoutCount = layoutTotal;
          item.printDwgCount = dwgTotal;
        });
      },
      error: e => console.error("Error fetching print counts:", e)
    });
  }
}
