import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { arrayBuffer } from 'node:stream/consumers';

const baseUrl = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root' // ระบุว่า service นี้จะถูกให้บริการใน root module
})

export class FileUploadSerice {
   
    public user: any;

    constructor( // คอนสตรัคเตอร์ของ service
    private httpClient: HttpClient // เก็บ HttpClient สำหรับทำ HTTP requests
  ) { }

    FileUpload(file: File, caseKey: string): Observable<HttpEvent<any>> {
      const formData = new FormData();
      formData.append('file',file);
      formData.append('caseKey',caseKey);
      const req = new HttpRequest('POST',`${baseUrl}/FileUpload`,formData,{
        reportProgress:true,
        responseType:'json'
      });
      return this.httpClient.request(req);
    }

  GetImage(caseKey: string): Observable<{ fileName: string, imageData: string }> {
    return this.httpClient.get<{ fileName: string, imageData: string }>(
      `${baseUrl}/GetImage/${caseKey}`
    );
  }
  loadPdfFromPath(filePath: string): Observable<{ fileName: string, imageData: string }> {
  return this.httpClient.post<{ fileName: string, imageData: string }>(
   ` ${baseUrl}/loadPdfFromPath`,
    { filePath }, // ← ส่ง path ที่มาจาก database
  );
}
 }
 