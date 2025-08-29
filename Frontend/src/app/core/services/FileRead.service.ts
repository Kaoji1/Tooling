import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { arrayBuffer } from 'node:stream/consumers';

const baseUrl = 'http://PBGM06:3000/api';
@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class FileReadService {
   
    public user: any;

    constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

  loadPdfFromPath(filePath: string): Observable<{ fileName: string, imageData: string }> {
  return this.httpClient.post<{ fileName: string, imageData: string }>(
   ` ${baseUrl}/loadPdfFromPath`,
    { filePath }, // ← ส่ง path ที่มาจาก database
  );
}


 }
 