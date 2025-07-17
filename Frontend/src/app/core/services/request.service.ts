import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:3000/api';

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


  constructor(private httpClient: HttpClient) { }

  // Dropdown data methods
  getDivisions(): Observable<any[]> {
    return this.httpClient.get<any>(`${baseUrl}/divisions`);
  }

  getFacilities(divisionId: number): Observable<any[]> {
    return this.httpClient.get<any>(`${baseUrl}/facilities/${divisionId}`);
  }

  getCases(): Observable<CaseItem[]> {
    return this.httpClient.get<any>(`${baseUrl}/cases`);
  }

  getParts(caseId: number): Observable<DropdownItem[]> {
    return this.httpClient.get<any>(`${baseUrl}/parts/${caseId}`);
  }

  getProcesses(partId: number): Observable<DropdownItem[]> {
    return this.httpClient.get<any>(`${baseUrl}/processes/${partId}`);
  }

  getMachineTypes(processId: number): Observable<DropdownItem[]> {
    return this.httpClient.get<any>(`${baseUrl}/machine-types/${processId}`);
  }

  getCaseOther(): Observable<CaseOtherItem[]> {
    return this.httpClient.get<any>(`${baseUrl}/case-other`);
  }

  Get filtered items
  getItems(filter: FilterRequest): Observable<any[]> {
    return this.httpClient.get<any>(`${baseUrl}/items`, filter);
  }
}
