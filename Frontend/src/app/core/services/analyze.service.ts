import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://PBGM06:3000/api';
@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})
export class AnalyzeService {
    public user: any;

  constructor(
    private httpClient: HttpClient
  ) { }

getdataall(): Observable<any> {
    return this.httpClient.get(`${baseUrl}/getdataall`);
    }
}
