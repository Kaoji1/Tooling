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

    getAllValues(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/master-ph`);
    }

    importData(data: any[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/master-ph/import`, data);
    }
}
