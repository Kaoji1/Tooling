import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const baseUrl = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root'
})
export class ExportToExcelService {

    public user: any;

constructor(private ExportToExcelService: ExportToExcelService) {}

  /**
   * เรียก API เพื่อดาวน์โหลด Excel
   */
//   downloadExcel(): Observable<Blob> {
//     return this.httpClient.get(this.apiUrl, {
//       responseType: 'blob'  // กำหนดว่า response เป็นไฟล์ binary
//     });
//   }
}
