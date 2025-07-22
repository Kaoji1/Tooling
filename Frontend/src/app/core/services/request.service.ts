import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:3000/api';




@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class RequestService {
  public user: any; // ตัวแปรสำหรับเก็บข้อมูลผู้ใช้

  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  get_PARTNO(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.get(`${baseUrl}/PARTNO`) // ส่ง HTTP GET request เพื่อดึงหมายเลขชิ้นส่วน
  }

  get_SPEC(value: any): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.get(`${baseUrl}/SPEC`) // ส่ง HTTP GET request เพื่อดึงหมายเลขชิ้นส่วน
  }

  post_PROCESS(data: any): Observable<any> { // ฟังก์ชันสำหรับส่งข้อมูล process
    return this.httpClient.post(`${baseUrl}/post_PROCESS`, data) // ส่ง HTTP POST request เพื่อส่งข้อมูล process
  }

  post_MACHINETYPE(data: any): Observable<any> { // ฟังก์ชันสำหรับส่งข้อมูล process
    return this.httpClient.post(`${baseUrl}/post__MACHINETYPE`, data) // ส่ง HTTP POST request เพื่อส่งข้อมูล process
  }


}














// export interface DropdownItem {
//   value: any;
//   label: string;
// }

// export interface CaseItem {
//   value: any;
//   Case: string;
// }

// export interface CaseOtherItem {
//   caseother: any;
//   viewCase: string;
// }
// export interface SPEC {
//   spec: string;
// }

// export interface RequestItem {
//   ItemId?: number;
//   partNo: string;
//   itemNo: string;
//   spec: string;
//   process: string;
//   machineType: string;
//   machineNo: string;
//   onHand: number;
//   usage: number;
//   qty: number;
//   checked?: boolean;
//   machineNoother?: string;
//   caseother?: any;
// }

// export interface FilterRequest {
//   divisionId?: number;
//   facilityId?: number;
//   caseId?: number;
//   partId?: number;
//   processId?: number;
//   machineTypeId?: number;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class RequestService {


//   constructor(private httpClient: HttpClient) { }

//   // Dropdown data methods
//   getDivisions(): Observable<any[]> {
//     return this.httpClient.get<any>(`${baseUrl}/divisions`);
//   }

//   getFacilities(divisionId: number): Observable<any[]> {
//     return this.httpClient.get<any>(`${baseUrl}/facilities/${divisionId}`);
//   }

//   getCases(): Observable<CaseItem[]> {
//     return this.httpClient.get<any>(`${baseUrl}/cases`);
//   }

//   getParts(caseId: number): Observable<DropdownItem[]> {
//     return this.httpClient.get<any>(`${baseUrl}/parts/${caseId}`);
//   }

//   getProcesses(partId: number): Observable<DropdownItem[]> {
//     return this.httpClient.get<any>(`${baseUrl}/processes/${partId}`);
//   }

//   getMachineTypes(processId: number): Observable<DropdownItem[]> {
//     return this.httpClient.get<any>(`${baseUrl}/machine-types/${processId}`);
//   }

//   getCaseOther(): Observable<CaseOtherItem[]> {
//     return this.httpClient.get<any>(`${baseUrl}/case-other`);
//   }

//   getSPEC(): Observable<SPEC[]> {
//     return this.httpClient.get<any>(`${baseUrl}/SPEC`);
//   }

// }
