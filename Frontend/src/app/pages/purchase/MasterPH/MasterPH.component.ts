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

    // Master Tooling PMC
    masterToolingPMCFileName: string = '';
    uploadingPMC: boolean = false;
    uploadProgressPMC: number = 0;
    summaryPMC: any = null;

    // Master Tooling GM
    masterToolingGMFileName: string = '';
    uploadingGM: boolean = false;
    uploadProgressGM: number = 0;
    summaryGM: any = null;

    tempData: any = {
        masterToolingPMC: null,
        masterToolingGM: null
    };

    constructor(private masterPHService: MasterPHService) { }

    // Generic file handler helper
    handleFile(evt: any, type: 'masterToolingPMC' | 'masterToolingGM') {
        const target: DataTransfer = <DataTransfer>(evt.target);
        if (target.files.length !== 1) {
            Swal.fire('Error', 'Cannot use multiple files', 'error');
            return;
        }

        const file = target.files[0];
        const fileName = file.name;

        if (type === 'masterToolingPMC') {
            this.masterToolingPMCFileName = fileName;
            this.summaryPMC = null; // reset summary on new file
        } else if (type === 'masterToolingGM') {
            this.masterToolingGMFileName = fileName;
            this.summaryGM = null;
        }

        console.log(`[MasterPH] Selected file for ${type}: ${fileName}`);
        this.tempData[type] = file;
        evt.target.value = '';
    }

    onFileChangeMasterToolingPMC(evt: any) { this.handleFile(evt, 'masterToolingPMC'); }
    onFileChangeMasterToolingGM(evt: any) { this.handleFile(evt, 'masterToolingGM'); }

    // Mock progress function for UI demonstration
    simulateProgress(type: 'PMC' | 'GM', callback: () => void) {
        if (type === 'PMC') {
            this.uploadingPMC = true;
            this.uploadProgressPMC = 0;
            this.summaryPMC = null;
        } else {
            this.uploadingGM = true;
            this.uploadProgressGM = 0;
            this.summaryGM = null;
        }

        const interval = setInterval(() => {
            if (type === 'PMC') {
                this.uploadProgressPMC += Math.floor(Math.random() * 15) + 5;
                if (this.uploadProgressPMC >= 100) {
                    this.uploadProgressPMC = 100;
                    clearInterval(interval);
                    setTimeout(() => callback(), 500); // slight delay at 100%
                }
            } else {
                this.uploadProgressGM += Math.floor(Math.random() * 15) + 5;
                if (this.uploadProgressGM >= 100) {
                    this.uploadProgressGM = 100;
                    clearInterval(interval);
                    setTimeout(() => callback(), 500);
                }
            }
        }, 300);
    }

    uploadData(type: 'masterTooling') {
        if (type === 'masterTooling') {
            const data = this.tempData.masterToolingPMC;
            if (!data) {
                Swal.fire('Warning', 'No Master Tooling PMC file selected', 'warning');
                return;
            }
            // Start mock progress -> then trigger actual upload logic
            this.simulateProgress('PMC', () => this.importMasterToolingPMC(data as any));
        }
    }

    uploadDataGM() {
        const data = this.tempData.masterToolingGM;
        if (!data) {
            Swal.fire('Warning', 'No Master Tooling GM file selected', 'warning');
            return;
        }

        // As requested by user: No backend ready for GM, so just mock the success!
        this.simulateProgress('GM', () => {
            this.uploadingGM = false;
            this.summaryGM = { total: Math.floor(Math.random() * 500) + 150 }; // Fake success data

            Swal.fire({
                title: 'UI Mock Complete',
                text: 'GM Upload UI Simulated Successfully (No backend calls made).',
                icon: 'success'
            });
            this.masterToolingGMFileName = '';
            this.tempData.masterToolingGM = null;
        });
    }

    importMasterToolingPMC(file: File) {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        this.masterPHService.importMasterToolingPMC(formData).subscribe({
            next: (res: any) => {
                this.uploadingPMC = false;

                const successCount = res.successCount ?? 0;
                const skippedRows = res.skippedRows ?? 0;
                const skippedDetail = res.skippedDetail || null;
                const totalInputRows = res.totalInputRows ?? 0;

                // Update UI Summary
                this.summaryPMC = { total: successCount };

                let html = `<div class="text-start">
                    <p class="mb-1"><strong>Records processed:</strong> ${successCount}</p>
                    <p class="mb-1"><strong>Total input rows:</strong> ${totalInputRows}</p>`;

                if (skippedRows > 0) {
                    html += `<p class="mb-1 text-warning"><strong>Skipped rows:</strong> ${skippedRows} (Part No. not found in system)</p>`;
                    if (skippedDetail) {
                        html += `<details class="mt-2"><summary style="cursor:pointer;color:#e67e22">Show skipped Part No. list</summary>
                            <pre style="font-size:0.75rem;text-align:left;max-height:200px;overflow:auto;background:#f8f9fa;padding:8px;border-radius:4px">${skippedDetail}</pre>
                            </details>`;
                    }
                }
                html += `</div>`;

                Swal.fire({
                    title: 'Import Successful!',
                    html,
                    icon: 'success'
                });

                // Reset file after upload completion
                this.masterToolingPMCFileName = '';
                this.tempData.masterToolingPMC = null;
            },
            error: (err: any) => {
                console.error('Import Master Tooling PMC Error:', err);
                this.uploadingPMC = false;
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Unknown error';
                Swal.fire('Error', `Failed to import: ${errorMsg}`, 'error');
            }
        });
    }

    // syncGMData() method removed as it was replaced by uploadDataGM()

}
