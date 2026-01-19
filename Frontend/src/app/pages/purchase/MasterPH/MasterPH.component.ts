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
    currentTab: 'purchase' | 'setup' | 'cutting' | 'typeTooling' = 'purchase';

    // Form Binding Variables
    // Purchase
    pmcFileName: string = '';
    gmFileName: string = '';
    iReportFileName: string = ''; // New

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

    // Type Tooling
    typeToolingFileName: string = '';
    tempData: any = {
        pmc: [],
        gm: [],
        ireport: [],
        setup: [],
        cutting: [],
        typeTooling: [] // New
    };

    constructor(private masterPHService: MasterPHService) {
        // afterNextRender(() => {
        //     this.loadData();
        // });
    }

    setTab(tab: 'purchase' | 'setup' | 'cutting' | 'typeTooling') {
        this.currentTab = tab;
    }

    loadData() {
        this.loading = true;
        // Determine type based on currentTab? 
        // For now, if currentTab is 'purchase', we can just load PMC by default or both.
        // But since we only have one variable `masterData`, let's just default to 'pmc' for now
        // or we could add a selector in the UI later if needed to view GM.
        // If imports are separate, maybe we want to see what we just imported?
        // Since the table is hidden, this is mostly for "Data Loaded" success state.

        const type: 'pmc' | 'gm' = 'pmc'; // Default to PMC for now or allow switching if UI supports it.

        this.masterPHService.getAllValues(type).subscribe({
            next: (data) => {
                this.masterData = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading MasterPH data:', err);
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Unknown error';
                // Only show error alert if it's NOT the "Invalid column" error we just fixed, 
                // but since we fixed it, it should be fine.
                Swal.fire('Error', 'Failed to load data: ' + errorMsg, 'error');
                this.loading = false;
            }
        });
    }

    // Generic file handler helper
    handleFile(evt: any, type: 'pmc' | 'gm' | 'setup' | 'cutting' | 'ireport' | 'typeTooling') {
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
        else if (type === 'ireport') this.iReportFileName = fileName;
        else if (type === 'setup') this.setupFileName = fileName;
        else if (type === 'cutting') this.cuttingFileName = fileName;
        else if (type === 'typeTooling') this.typeToolingFileName = fileName;

        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];

            // 1. Convert to array of arrays to find the header row
            const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

            let headerRowIndex = 0;
            // Search based on type? Or generic?
            // For PMC/GM uses 'Item No'. For IReport it might be 'ITEM_NO' or similar.
            // Define keywords based on type to prevent false positives (like "Division" in title string)
            let keywords = ['item no', 'itemno', 'division', 'department']; // Default for PMC/GM

            if (type === 'typeTooling') {
                keywords = ['a/c code', 'ac code', 'ac_code', 'ac type']; // Specific for Type Tooling
            } else if (type === 'ireport') {
                keywords = ['item_no', 'item no', 'vendor'];
            }

            // Search for the row containing keywords
            for (let i = 0; i < Math.min(aoa.length, 20); i++) { // Search first 20 rows
                const row = aoa[i];
                if (row && row.some((cell: any) => {
                    if (typeof cell !== 'string') return false;
                    const val = cell.toLowerCase();
                    return keywords.some(k => val.includes(k));
                })) {
                    headerRowIndex = i;
                    console.log(`Found header at row ${i} for ${type}`);
                    break;
                }
            }

            // 2. Parse again with the correct range
            // range: headerRowIndex tells it to skip rows before the header
            const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex });

            if (data.length > 0) {
                this.tempData[type] = data; // Need to define tempData
                console.log(`Parsed ${data.length} rows from ${type} file. First row keys:`, Object.keys(data[0] as any));
            } else {
                Swal.fire('Info', 'File is empty', 'info');
            }

            // Reset input value to allow re-selecting same file
            evt.target.value = '';
        };
        reader.readAsBinaryString(file);
    }

    // tempData definition removed from here as it was moved up to be cleaner


    onFileChangePMC(evt: any) { this.handleFile(evt, 'pmc'); }
    onFileChangeGM(evt: any) { this.handleFile(evt, 'gm'); }
    onFileChangeIReport(evt: any) { this.handleFile(evt, 'ireport'); }
    onFileChangeSetup(evt: any) { this.handleFile(evt, 'setup'); }
    onFileChangeCutting(evt: any) { this.handleFile(evt, 'cutting'); }
    onFileChangeTypeTooling(evt: any) { this.handleFile(evt, 'typeTooling'); }

    uploadData(type: 'pmc' | 'gm' | 'setup' | 'cutting' | 'purchase' | 'typeTooling') {
        if (type === 'purchase') {
            const hasPMC = this.tempData.pmc && this.tempData.pmc.length > 0;
            const hasGM = this.tempData.gm && this.tempData.gm.length > 0;
            const hasIReport = this.tempData.ireport && this.tempData.ireport.length > 0; // New

            if (!hasPMC && !hasGM && !hasIReport) {
                Swal.fire('Warning', 'No file selected for Purchase', 'warning');
                return;
            }

            // Upload sequence
            if (hasPMC) {
                this.importData(this.tempData.pmc, 'pmc');
            }
            if (hasGM) {
                setTimeout(() => {
                    this.importData(this.tempData.gm, 'gm');
                }, 500);
            }
            if (hasIReport) { // New IReport Upload
                setTimeout(() => {
                    this.importIReportData(this.tempData.ireport);
                }, 1000); // Trigger after others
            }
        } else {
            const data = this.tempData[type];
            if (!data || data.length === 0) {
                Swal.fire('Warning', 'No file selected or file is empty', 'warning');
                return;
            }
            if (type === 'typeTooling') {
                this.importTypeToolingData(data);
            } else {
                this.importData(data);
            }
        }
    }

    exportTemplate(type: 'pmc' | 'gm' | 'setup' | 'cutting' | 'purchase') {
        // Placeholder for export logic
        Swal.fire('Info', `Export template for ${type} (Not implemented yet)`, 'info');
    }

    importData(data: any[], type: 'pmc' | 'gm' = 'pmc') {
        this.loading = true;
        Swal.fire({
            title: 'Importing...',
            text: `Uploading ${data.length} records (${type.toUpperCase()}). Please wait.`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importData(data, type).subscribe({
            next: (res) => {
                Swal.fire('Success', `Imported ${type.toUpperCase()} ${res.count} records successfully!`, 'success');
                this.loadData(); // Refresh table
            },
            error: (err) => {
                console.error('Import Error:', err);
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Unknown error';
                Swal.fire('Error', `Failed to import ${type.toUpperCase()} data: ${errorMsg}`, 'error');
                this.loading = false;
            }
        });
    }

    // Special import for IReport
    importIReportData(data: any[]) {
        this.loading = true;
        Swal.fire({
            title: 'Importing IReport...',
            text: `Uploading ${data.length} records. Please wait.`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importIReport(data).subscribe({
            next: (res) => {
                if (res.errors && res.errors.length > 0) {
                    let msg = `Imported ${res.count} records. Failed ${res.errors.length} records.`;
                    if (res.count === 0) msg = `Failed to import all ${res.errors.length} records.`;
                    console.warn('Import Warnings:', res.errors);
                    const errorDetails = res.errors.slice(0, 5).join('<br>');
                    Swal.fire({
                        title: res.count === 0 ? 'Import Failed' : 'Completed with Errors',
                        html: `${msg}<br><div class="text-danger text-start small mt-2">${errorDetails}${res.errors.length > 5 ? '<br>...' : ''}</div>`,
                        icon: res.count === 0 ? 'error' : 'warning'
                    });
                } else {
                    Swal.fire('Success', `Imported IReport ${res.count} records successfully!`, 'success');
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Import IReport Error:', err);
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Unknown error';
                Swal.fire('Error', `Failed to import IReport data: ${errorMsg}`, 'error');
                this.loading = false;
            }
        });
    }

    importTypeToolingData(data: any[]) {
        this.loading = true;
        Swal.fire({
            title: 'Importing Type Tooling...',
            text: `Uploading ${data.length} records. Please wait.`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importTypeTooling(data).subscribe({
            next: (res) => {
                if (res.errors && res.errors.length > 0) {
                    let msg = `Imported ${res.count} records. Failed ${res.errors.length} records.`;
                    if (res.count === 0) msg = `Failed to import all ${res.errors.length} records.`;

                    console.warn('Import Warnings:', res.errors);
                    const errorDetails = res.errors.slice(0, 5).join('<br>');
                    Swal.fire({
                        title: res.count === 0 ? 'Import Failed' : 'Completed with Errors',
                        html: `${msg}<br><div class="text-danger text-start small mt-2">${errorDetails}${res.errors.length > 5 ? '<br>...' : ''}</div>`,
                        icon: res.count === 0 ? 'error' : 'warning'
                    });
                } else {
                    Swal.fire('Success', `Imported Type Tooling ${res.count} records successfully!`, 'success');
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Import Type Tooling Error:', err);
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Unknown error';
                Swal.fire('Error', `Failed to import Type Tooling data: ${errorMsg}`, 'error');
                this.loading = false;
            }
        });
    }

}
