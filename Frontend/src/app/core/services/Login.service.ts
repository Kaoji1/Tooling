import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://PBGM7E:3000/api';
@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class LoginService {

  constructor(private http: HttpClient) { }

  // ฟังก์ชันสำหรับการเข้าสู่ระบบ
  login(credentials :{Username: string; Password: string}): Observable<any> {
    return this.http.post(`${baseUrl}/login`, credentials);
  }

}
