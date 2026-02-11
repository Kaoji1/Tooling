import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MasterPHService {

    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getAllValues(type: 'pmc' | 'gm' = 'pmc'): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/master-ph?type=${type}`);
    }

    importData(data: FormData, type: 'pmc' | 'gm' = 'pmc'): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/master-ph/import?type=${type}`, data);
    }

    importIReport(data: FormData): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/master-ph/import-ireport`, data);
    }

    importMasterAllPMC(data: FormData): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/master-ph/import-master-all-pmc`, data);
    }

    importMasterToolingPMC(data: FormData): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/master-ph/import-master-tooling-pmc`, data);
    }

    importTypeTooling(data: FormData): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/master-ph/import-type-tooling`, data);
    }

    importMasterToolingGM(data: FormData): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/master-ph/import-master-tooling-gm`, data);
    }
}
