import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DropdownItem {
  value: any;
  label: string;
}

export interface CaseItem {
  value: any;
  Case: string;
}

export interface CaseOtherItem {
  caseother: any;
  viewCase: string;
}

export interface RequestItem {
  ItemId?: number;
  partNo: string;
  itemNo: string;
  spec: string;
  process: string;
  machineType: string;
  machineNo: string;
  onHand: number;
  usage: number;
  qty: number;
  checked?: boolean;
  machineNoother?: string;
  caseother?: any;
}

export interface FilterRequest {
  divisionId?: number;
  facilityId?: number;
  caseId?: number;
  partId?: number;
  processId?: number;
  machineTypeId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Dropdown data methods
  getDivisions(): Observable<DropdownItem[]> {
    return this.http.get<DropdownItem[]>(`${this.baseUrl}/divisions`);
  }

  getFacilities(divisionId: number): Observable<DropdownItem[]> {
    return this.http.get<DropdownItem[]>(`${this.baseUrl}/facilities/${divisionId}`);
  }

  getCases(): Observable<CaseItem[]> {
    return this.http.get<CaseItem[]>(`${this.baseUrl}/cases`);
  }

  getParts(caseId: number): Observable<DropdownItem[]> {
    return this.http.get<DropdownItem[]>(`${this.baseUrl}/parts/${caseId}`);
  }

  getProcesses(partId: number): Observable<DropdownItem[]> {
    return this.http.get<DropdownItem[]>(`${this.baseUrl}/processes/${partId}`);
  }

  getMachineTypes(processId: number): Observable<DropdownItem[]> {
    return this.http.get<DropdownItem[]>(`${this.baseUrl}/machine-types/${processId}`);
  }

  getCaseOther(): Observable<CaseOtherItem[]> {
    return this.http.get<CaseOtherItem[]>(`${this.baseUrl}/case-other`);
  }

  // Get filtered items
  getItems(filter: FilterRequest): Observable<RequestItem[]> {
    return this.http.post<RequestItem[]>(`${this.baseUrl}/items`, filter);
  }
}
