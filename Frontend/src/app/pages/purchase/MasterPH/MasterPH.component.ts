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

    // Master Tooling
    masterToolingPMCFileName: string = '';

    tempData: any = {
        masterToolingPMC: null
    };

    constructor(private masterPHService: MasterPHService) { }

    // Generic file handler helper
    handleFile(evt: any, type: 'masterToolingPMC') {
        const target: DataTransfer = <DataTransfer>(evt.target);
        if (target.files.length !== 1) {
            Swal.fire('Error', 'Cannot use multiple files', 'error');
            return;
        }

        const file = target.files[0];
        const fileName = file.name;

        // Update file name display based on type
        if (type === 'masterToolingPMC') this.masterToolingPMCFileName = fileName;

        // Store file directly to tempData
        console.log(`[MasterPH] Selected file for ${type}: ${fileName}`);
        this.tempData[type] = file;

        // Reset input value to allow re-selecting same file
        evt.target.value = '';
    }

    onFileChangeMasterToolingPMC(evt: any) { this.handleFile(evt, 'masterToolingPMC'); }

    uploadData(type: 'masterTooling') {
        if (type === 'masterTooling') {
            // Master Tooling PMC upload logic
            const data = this.tempData.masterToolingPMC;
            if (!data) {
                Swal.fire('Warning', 'No Master Tooling PMC file selected', 'warning');
                return;
            }
            this.importMasterToolingPMC(data as any);
        }
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

    syncGMData() {
        Swal.fire({
            title: 'Syncing...',
            text: 'Executing mapped setup procedure on server. Please wait.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        this.masterPHService.syncMasterToolingGM().subscribe({
            next: (res: any) => {
                Swal.fire('Success', 'GM Data Synced successfully!', 'success');
            },
            error: (err: any) => {
                console.error('Sync Master Tooling GM Error:', err);
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Unknown error';
                Swal.fire('Error', `Failed to sync: ${errorMsg}`, 'error');
            }
        });
    }

}
