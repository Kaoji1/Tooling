import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://PBGM06:3000/api';
@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})
export class PermissionService {
    public user: any;

  constructor(
    private httpClient: HttpClient
  ) { }

get_Permission(): Observable<any> {
  return this.httpClient.get(`${baseUrl}/get_Permission`);
}
// add_Permission(data: any): Observable<any> {
//   return this.httpClient.post(`${baseUrl}/AddUserPermission`, data);
// }
update_Permission(id: string, data: any): Observable<any> {
  return this.httpClient.post(`${baseUrl}/updateEmployeePermission/${id}`, data);
}
// delete_Permission(id: string): Observable<any> {
//   return this.httpClient.delete(`${baseUrl}/DeleteEmployeePermission/${id}`);
// }
delete_Permission(Employee_ID: string): Observable<any> {
  return this.httpClient.delete(`${baseUrl}/DeleteEmployeePermission/${Employee_ID}`);
}
add_Permission(data: {Employee_ID: string, Employee_Name: string}): Observable<any> {
  return this.httpClient.post(`${baseUrl}/AddUserPermission`, data);
}
}
