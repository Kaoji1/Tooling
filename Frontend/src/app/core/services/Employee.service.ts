import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://PBGM06:3000/api';
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  public user: any; // ตัวแปรสำหรับเก็บข้อมูลผู้ใช้

  constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  get_Employee(): Observable<any> { // ฟังก์ชันสำหรับดึงหมายเลขชิ้นส่วน
    return this.httpClient.get(`${baseUrl}/get_Employee`); // ส่ง HTTP GET Division
  }
   addEmployee(data: any): Observable<any> {
    return this.httpClient.post(`${baseUrl}/AddEmployee`, data);
  }
  deleteEmployee(empId: string) {
  return this.httpClient.delete(`${baseUrl}/delete_employee/${empId}`);
}
updateEmployee(payload: any) {
  if (!payload?.Employee_ID) throw new Error('Employee_ID is required');
  return this.httpClient.post(
    `${baseUrl}/update/${encodeURIComponent(payload.Employee_ID)}`,
    payload
  );
}

}
