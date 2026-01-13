import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { MasterPHService } from '../../../core/services/MasterPH.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-master-ph',
    standalone: true,
    imports: [CommonModule, SidebarComponent],
    templateUrl: './MasterPH.component.html',
    styleUrls: ['./MasterPH.component.scss']
})
export class MasterPHComponent implements OnInit {

    masterData: any[] = [];
    loading: boolean = false;

    constructor(private masterPHService: MasterPHService) { }

    ngOnInit(): void {
        this.loadData();
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

    onFileChange(evt: any) {
        const target: DataTransfer = <DataTransfer>(evt.target);
        if (target.files.length !== 1) {
            Swal.fire('Error', 'Cannot use multiple files', 'error');
            return;
        }

        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            if (data.length > 0) {
                this.importData(data);
            } else {
                Swal.fire('Info', 'File is empty', 'info');
            }

            // Reset input
            evt.target.value = '';
        };
        reader.readAsBinaryString(target.files[0]);
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
                Swal.fire('Error', 'Failed to import data. Check console for details.', 'error');
                this.loading = false;
            }
        });
    }

}
