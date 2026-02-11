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
    currentTab: 'purchase' | 'setup' | 'cutting' | 'typeTooling' | 'masterAll' | 'masterTooling' = 'purchase';

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

    // Master All
    masterAllPMCFileName: string = '';
    masterAllGMFileName: string = '';

    // Master Tooling
    masterToolingPMCFileName: string = '';
    masterToolingGMFileName: string = '';

    tempData: any = {
        pmc: [],
        gm: [],
        ireport: [],
        setup: [],
        cutting: [],
        typeTooling: [],
        masterAllPMC: [],
        masterAllGM: [],
        masterToolingPMC: [],
        masterToolingGM: []
    };

    constructor(private masterPHService: MasterPHService) {
        // afterNextRender(() => {
        //     this.loadData();
        // });
    }

    setTab(tab: 'purchase' | 'setup' | 'cutting' | 'typeTooling' | 'masterAll' | 'masterTooling') {
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
    handleFile(evt: any, type: 'pmc' | 'gm' | 'setup' | 'cutting' | 'ireport' | 'typeTooling' | 'masterAllPMC' | 'masterAllGM' | 'masterToolingPMC' | 'masterToolingGM') {
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
        else if (type === 'masterAllPMC') this.masterAllPMCFileName = fileName;
        else if (type === 'masterAllGM') this.masterAllGMFileName = fileName;
        else if (type === 'masterToolingPMC') this.masterToolingPMCFileName = fileName;
        else if (type === 'masterToolingGM') this.masterToolingGMFileName = fileName;

        // Store file directly to tempData
        console.log(`[MasterPH] Selected file for ${type}: ${fileName}`);
        this.tempData[type] = file;

        // Reset input value to allow re-selecting same file
        evt.target.value = '';
    }

    // tempData definition removed from here as it was moved up to be cleaner


    onFileChangePMC(evt: any) { this.handleFile(evt, 'pmc'); }
    onFileChangeGM(evt: any) { this.handleFile(evt, 'gm'); }
    onFileChangeIReport(evt: any) { this.handleFile(evt, 'ireport'); }
    onFileChangeSetup(evt: any) { this.handleFile(evt, 'setup'); }
    onFileChangeCutting(evt: any) { this.handleFile(evt, 'cutting'); }
    onFileChangeTypeTooling(evt: any) { this.handleFile(evt, 'typeTooling'); }
    onFileChangeMasterAllPMC(evt: any) { this.handleFile(evt, 'masterAllPMC'); }
    onFileChangeMasterAllGM(evt: any) { this.handleFile(evt, 'masterAllGM'); }
    onFileChangeMasterToolingPMC(evt: any) { this.handleFile(evt, 'masterToolingPMC'); }
    onFileChangeMasterToolingGM(evt: any) { this.handleFile(evt, 'masterToolingGM'); }

    uploadData(type: 'pmc' | 'gm' | 'setup' | 'cutting' | 'purchase' | 'typeTooling' | 'masterAll' | 'masterTooling' | 'masterToolingGM') {
        if (type === 'purchase') {
            const hasPMC = !!this.tempData.pmc;
            const hasGM = !!this.tempData.gm;
            const hasIReport = !!this.tempData.ireport; // New

            if (!hasPMC && !hasGM && !hasIReport) {
                Swal.fire('Warning', 'No file selected for Purchase', 'warning');
                return;
            }

            // Upload sequence
            if (hasPMC) {
                // pmc logic
                // Since tempData.pmc is now a File, we need to handle it.
                // Wait, importData expects File now? Yes, I updated it below.
                // let's confirm the signature of importData.
                // importData(file: File, type: 'pmc' | 'gm')
                this.importData(this.tempData.pmc as any, 'pmc');
            }
            if (hasGM) {
                setTimeout(() => {
                    this.importData(this.tempData.gm as any, 'gm');
                }, 500);
            }
            setTimeout(() => {
                this.importIReportData(this.tempData.ireport as any);
            }, 1000); // Trigger after others
        } else if (type === 'masterAll') {
            // Master All PMC upload logic (already implemented)
            const data = this.tempData.masterAllPMC;
            if (!data) {
                Swal.fire('Warning', 'No Master All PMC file selected', 'warning');
                return;
            }
            this.importMasterAllPMC(data as any);
        } else if (type === 'masterTooling') {
            // Master Tooling PMC upload logic
            const data = this.tempData.masterToolingPMC;
            // Check if file exists (since now tempData stores File object, check truthiness)
            if (!data) {
                Swal.fire('Warning', 'No Master Tooling PMC file selected', 'warning');
                return;
            }
            this.importMasterToolingPMC(data as any);
        } else if (type === 'masterToolingGM') {
            // Master Tooling GM upload logic
            const data = this.tempData.masterToolingGM;
            if (!data) {
                Swal.fire('Warning', 'No Master Tooling GM file selected', 'warning');
                return;
            }
            this.importMasterToolingGM(data as any);
        } else {
            const data = this.tempData[type];
            if (!data) {
                Swal.fire('Warning', 'No file selected', 'warning');
                return;
            }
            if (type === 'typeTooling') {
                this.importTypeToolingData(data as any);
            } else {
                // For now, only 'pmc', 'gm' (generic generic importData) are left here.
                this.importData(data as any, type as 'pmc' | 'gm');
            }
        }
    }

    exportTemplate(type: 'pmc' | 'gm' | 'setup' | 'cutting' | 'purchase') {
        // Placeholder for export logic
        Swal.fire('Info', `Export template for ${type} (Not implemented yet)`, 'info');
    }

    importData(file: File, type: 'pmc' | 'gm' = 'pmc') {
        this.loading = true;
        const formData = new FormData();
        formData.append('file', file);

        Swal.fire({
            title: 'Importing...',
            text: `Uploading ${type.toUpperCase()} file. Please wait.`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importData(formData).subscribe({
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

    // Special import for IReport (Refactored to FormData)
    importIReportData(file: File) {
        if (!file) {
            Swal.fire('Error', 'No file to import', 'error');
            return;
        }

        this.loading = true;

        const formData = new FormData();
        formData.append('file', file);

        Swal.fire({
            title: 'Importing IReport...',
            text: `Uploading IReport file. Please wait.`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importIReport(formData).subscribe({
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

    importTypeToolingData(file: File) {
        if (!file) {
            Swal.fire('Error', 'No file to import', 'error');
            return;
        }

        this.loading = true;

        const formData = new FormData();
        formData.append('file', file);

        Swal.fire({
            title: 'Importing Type Tooling...',
            text: `Uploading Type Tooling file. Please wait.`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importTypeTooling(formData).subscribe({
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

    importMasterAllPMC(file: File) {
        if (!file) {
            Swal.fire('Error', 'No file to import', 'error');
            this.loading = false;
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        Swal.fire({
            title: 'Uploading...',
            text: `Uploading Master All PMC file. Please wait.`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importMasterAllPMC(formData).subscribe({
            next: (res: any) => {
                Swal.fire('Success', `Imported Master All PMC ${res.count} records successfully!`, 'success');
            },
            error: (err: any) => {
                console.error('Import Error:', err);
                const errorMsg = err.error?.error || err.error?.message || err.message || 'Unknown error';
                Swal.fire('Error', `Failed to import: ${errorMsg}`, 'error');
            }
        });
    }

    importMasterToolingPMC(file: File) {
        if (!file) {
            Swal.fire('Error', 'No file to import', 'error');
            return;
        }

        this.loading = true;

        // Prepare FormData
        const formData = new FormData();
        formData.append('file', file);

        Swal.fire({
            title: 'Uploading...',
            text: 'Processing file on server. Please wait.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importMasterToolingPMC(formData).subscribe({
            next: (res: any) => {
                this.loading = false;

                const stats = res.stats || {};
                const msg = res.message || 'Import Successful!';

                if (res.isAlreadyUpToDate) {
                    Swal.fire({
                        title: 'Already Up to Date',
                        text: 'Your data is already up to date. No changes were made.',
                        icon: 'info'
                    });
                } else {
                    Swal.fire({
                        title: 'Import Successful!',
                        html: `
                            <div class="text-start">
                                <p class="mb-1"><strong>Cutting Tool:</strong></p>
                                <ul class="mb-2">
                                    <li>Updated: ${stats.CuttingUpdated || 0} records</li>
                                    <li>Inserted: ${stats.CuttingInserted || 0} records</li>
                                </ul>
                                <p class="mb-1"><strong>Setup Tool:</strong></p>
                                <ul class="mb-0">
                                    <li>Updated: ${stats.SetupUpdated || 0} records</li>
                                    <li>Inserted: ${stats.SetupInserted || 0} records</li>
                                </ul>
                            </div>
                        `,
                        icon: 'success'
                    });
                }
            },
            error: (err: any) => {
                console.error('Import Master Tooling PMC Error:', err);
                this.loading = false;
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Unknown error';
                Swal.fire('Error', `Failed to import: ${errorMsg}`, 'error');
            }
        });
    }

    importMasterToolingGM(file: File) {
        if (!file) {
            Swal.fire('Error', 'No file to import', 'error');
            return;
        }

        this.loading = true;

        const formData = new FormData();
        formData.append('file', file);

        Swal.fire({
            title: 'Uploading...',
            text: 'Processing file on server. Please wait.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.importMasterToolingGM(formData).subscribe({
            next: (res: any) => {
                this.loading = false;
                Swal.fire('Success', `Imported ${res.count} records successfully!`, 'success');
            },
            error: (err: any) => {
                console.error('Import Master Tooling GM Error:', err);
                this.loading = false;
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Unknown error';
                Swal.fire('Error', `Failed to import: ${errorMsg}`, 'error');
            }
        });
    }

}
