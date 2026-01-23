import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReturnService {

    private baseUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) { }

    getItemDetails(itemNo: string, divisionId: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/return/item/${itemNo}?divisionId=${divisionId}`);
    }

    getDivisions(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/return/divisions`);
    }

    getFacilities(divisionId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/return/facilities/${divisionId}`);
    }

    getProcesses(divisionId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/return/processes/${divisionId}`);
    }
}
