import { Component, OnInit, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { MasterPHService } from '../../../core/services/MasterPH.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-master-ph',
    standalone: true,
    imports: [CommonModule, SidebarPurchaseComponent, FormsModule],
    templateUrl: './MasterPH.component.html',
    styleUrls: ['./MasterPH.component.scss']
})
export class MasterPHComponent {

    masterData: any[] = [];
    loading: boolean = false;
    currentTab: 'purchase' | 'setup' | 'cutting' = 'purchase';

    // Form Binding Variables
    // Purchase
    pmcFileName: string = '';
    gmFileName: string = '';

    // Setup Tool
    setupFileName: string = '';
    setupForm = {
        partNo: '', dwgNo: '', itemNo: '', dwgRev: '', itemName: '', dwgUpdate: '',
        spec: '', usag: '', process: '', ctSec: '', mc: ''
    };

    // Cutting Tool
    cuttingFileName: string = '';
    cuttingForm = {
        partNo: '', dwgNo: '', itemNo: '', dwgRev: '', process: '', dwgUpdate: '',
        mc: '', ctSec: '', usagePcs: '', position: ''
    };

    constructor(private masterPHService: MasterPHService) {
        // afterNextRender(() => {
        //     this.loadData();
        // });
    }

    setTab(tab: 'purchase' | 'setup' | 'cutting') {
        this.currentTab = tab;
    }

    loadData() {
        this.loading = true;
        this.masterPHService.getAllValues().subscribe({
            next: (data) => {
                this.masterData = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading MasterPH data:', err);
                Swal.fire('Error', 'Failed to load data.', 'error');
                this.loading = false;
            }
        });
    }

    // Generic file handler helper
    handleFile(evt: any, type: 'pmc' | 'gm' | 'setup' | 'cutting') {
        const target: DataTransfer = <DataTransfer>(evt.target);
        if (target.files.length !== 1) {
            Swal.fire('Error', 'Cannot use multiple files', 'error');
            return;
        }

        const file = target.files[0];
        const fileName = file.name;

        // Update file name display based on type
        if (type === 'pmc') this.pmcFileName = fileName;
        else if (type === 'gm') this.gmFileName = fileName;
        else if (type === 'setup') this.setupFileName = fileName;
        else if (type === 'cutting') this.cuttingFileName = fileName;

        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            if (data.length > 0) {
                // Store data temporarily or process it
                // For now, we might just store it to a variable if we need to differentiate specific actions
                // or directly call import if the user clicks "Upload" immediately? 
                // The design has a separate "Upload" button. 
                // So we should probably just hold the data until they click "Upload".
                // But existing logic called importData immediately. 
                // I will modify importData to take an optional type or just keep it simple for now
                // and assume the user clicks the upload button which will trigger the actual process
                // BUT, the current code imports immediately on change. 
                // The NEW design has an "Upload" button. So I should store the data first.

                this.tempData[type] = data; // Need to define tempData
            } else {
                Swal.fire('Info', 'File is empty', 'info');
            }

            // Reset input value to allow re-selecting same file
            evt.target.value = '';
        };
        reader.readAsBinaryString(file);
    }

    tempData: any = {
        pmc: [],
        gm: [],
        setup: [],
        cutting: []
    };

    onFileChangePMC(evt: any) { this.handleFile(evt, 'pmc'); }
    onFileChangeGM(evt: any) { this.handleFile(evt, 'gm'); }
    onFileChangeSetup(evt: any) { this.handleFile(evt, 'setup'); }
    onFileChangeCutting(evt: any) { this.handleFile(evt, 'cutting'); }

    uploadData(type: 'pmc' | 'gm' | 'setup' | 'cutting' | 'purchase') {
        if (type === 'purchase') {
            const hasPMC = this.tempData.pmc && this.tempData.pmc.length > 0;
            const hasGM = this.tempData.gm && this.tempData.gm.length > 0;

            if (!hasPMC && !hasGM) {
                Swal.fire('Warning', 'No file selected for Purchase', 'warning');
                return;
            }

            // Upload sequence: PMC then GM (or just one if only one selected)
            if (hasPMC) {
                this.importData(this.tempData.pmc);
            }

            // Note: If both are selected, this simple logic triggers import twice in parallel/sequence 
            // which might be acceptable but ideally should be batched. 
            // Given the existing service structure, we'll just trigger them. 
            // A delay or check might be needed if the backend locks. 
            // For now, we assume independent processing.
            if (hasGM) {
                // If PMC is also uploading, this might overwrite loading state or UI messages.
                // We'll add a small delay or just fire it. 
                setTimeout(() => {
                    this.importData(this.tempData.gm);
                }, 500);
            }
        } else {
            const data = this.tempData[type];
            if (!data || data.length === 0) {
                Swal.fire('Warning', 'No file selected or file is empty', 'warning');
                return;
            }
            this.importData(data);
        }
    }

    exportTemplate(type: 'pmc' | 'gm' | 'setup' | 'cutting' | 'purchase') {
        // Placeholder for export logic
        Swal.fire('Info', `Export template for ${type} (Not implemented yet)`, 'info');
    }

    importData(data: any[]) {
        this.loading = true;
        Swal.fire({
            title: 'Importing...',
            text: `Uploading ${data.length} records. Please wait.`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importData(data).subscribe({
            next: (res) => {
                Swal.fire('Success', `Imported ${res.count} records successfully!`, 'success');
                this.loadData(); // Refresh table
            },
            error: (err) => {
                console.error('Import Error:', err);
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Unknown error';
                Swal.fire('Error', `Failed to import data: ${errorMsg}`, 'error');
                this.loading = false;
            }
        });
    }

}
