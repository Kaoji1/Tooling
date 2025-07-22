import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timeout, retry } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interfaces for type safety
export interface ToolData {
  id?: number;
  PartNo: string;
  SPECS: string;
  Process: string;
  MC: string;
  Usage?: number;
  Local?: number;
  [key: string]: any; // Allow for additional properties
}

export interface PartNoOption {
  PartNo: string;
  Description?: string;
  [key: string]: any;
}

export interface SubmitRequest {
  items: any[];
  requestInfo: {
    division: string | null;
    factory: string | null;
    dueDate: string;
    phoneNumber: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private readonly timeout = 30000; // 30 seconds
  private readonly retryAttempts = 2;

  constructor(private httpClient: HttpClient) {}

  /**
   * Get unique PartNo list for the first dropdown
   */
  getPartNoList(): Observable<PartNoOption[]> {
    return this.httpClient.get<PartNoOption[]>(`${this.baseUrl}/PartNo`)
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        map(response => this.validatePartNoResponse(response)),
        catchError(error => this.handleError('Failed to load PartNo list', error))
      );
  }

  /**
   * Get filtered tool data based on selected parameters
   * @param partNo - Part number (required for first call)
   * @param spec - Specification (optional)
   * @param process - Process type (optional)
   * @param mc - Machine type (optional)
   */
  getToolData(partNo?: string, spec?: string, process?: string, mc?: string): Observable<ToolData[]> {
    if (!partNo) {
      return throwError(() => new Error('PartNo is required for tool data retrieval'));
    }

    let params = new HttpParams();
    params = params.set('PartNo', partNo);

    if (spec) params = params.set('SPEC', spec);
    if (process) params = params.set('Process', process);
    if (mc) params = params.set('MC', mc);

    return this.httpClient.get<ToolData[]>(`${this.baseUrl}/tool`, { params })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        map(response => this.validateToolDataResponse(response)),
        catchError(error => this.handleError('Failed to load tool data', error))
      );
  }

  /**
   * Submit cart data to the server
   * @param data - The cart data to submit
   */
  submitCartData(data: SubmitRequest): Observable<ApiResponse<any>> {
    if (!data || !data.items || data.items.length === 0) {
      return throwError(() => new Error('No items to submit'));
    }

    // Validate data before sending
    const validatedData = this.validateSubmitData(data);

    return this.httpClient.post<ApiResponse<any>>(`${this.baseUrl}/submit`, validatedData)
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(error => this.handleError('Failed to submit cart data', error))
      );
  }

  /**
   * Get specification options for a specific part number
   * @param partNo - The part number to get specifications for
   */
  getSpecificationOptions(partNo: string): Observable<string[]> {
    return this.getToolData(partNo)
      .pipe(
        map(toolData => [...new Set(toolData.map(item => item.SPECS))].filter(spec => spec)),
        catchError(error => this.handleError('Failed to load specifications', error))
      );
  }

  /**
   * Get process options for a specific part number and specification
   * @param partNo - The part number
   * @param spec - The specification
   */
  getProcessOptions(partNo: string, spec: string): Observable<string[]> {
    return this.getToolData(partNo, spec)
      .pipe(
        map(toolData => [...new Set(toolData.map(item => item.Process))].filter(process => process)),
        catchError(error => this.handleError('Failed to load processes', error))
      );
  }

  /**
   * Get machine type options for specific parameters
   * @param partNo - The part number
   * @param spec - The specification
   * @param process - The process
   */
  getMachineTypeOptions(partNo: string, spec: string, process: string): Observable<string[]> {
    return this.getToolData(partNo, spec, process)
      .pipe(
        map(toolData => [...new Set(toolData.map(item => item.MC))].filter(mc => mc)),
        catchError(error => this.handleError('Failed to load machine types', error))
      );
  }

  /**
   * Check server health/connectivity
   */
  checkServerHealth(): Observable<boolean> {
    return this.httpClient.get(`${this.baseUrl}/health`)
      .pipe(
        timeout(5000),
        map(() => true),
        catchError(() => throwError(() => new Error('Server is not available')))
      );
  }

  /**
   * Validate PartNo response data
   * @private
   */
  private validatePartNoResponse(response: any): PartNoOption[] {
    if (!Array.isArray(response)) {
      throw new Error('Invalid response format for PartNo list');
    }

    return response.filter(item => item && typeof item.PartNo === 'string');
  }

  /**
   * Validate tool data response
   * @private
   */
  private validateToolDataResponse(response: any): ToolData[] {
    if (!Array.isArray(response)) {
      throw new Error('Invalid response format for tool data');
    }

    return response.filter(item =>
      item &&
      typeof item.PartNo === 'string' &&
      typeof item.SPECS === 'string' &&
      typeof item.Process === 'string' &&
      typeof item.MC === 'string'
    );
  }

  /**
   * Validate submit data before sending to server
   * @private
   */
  private validateSubmitData(data: SubmitRequest): SubmitRequest {
    const validatedItems = data.items.filter(item =>
      item &&
      item.Part_no &&
      item.Process &&
      item.MC_type &&
      item.Spec
    );

    if (validatedItems.length === 0) {
      throw new Error('No valid items to submit');
    }

    return {
      ...data,
      items: validatedItems
    };
  }

  /**
   * Centralized error handling
   * @private
   */
  private handleError(message: string, error: any): Observable<never> {
    let errorMessage = message;

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
          break;
        case 400:
          errorMessage = `Bad Request: ${error.error?.message || message}`;
          break;
        case 401:
          errorMessage = 'Unauthorized access. Please log in again.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          errorMessage = `Server error (${error.status}): ${error.error?.message || message}`;
      }
    } else if (error.name === 'TimeoutError') {
      errorMessage = 'Request timeout. Please check your connection and try again.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('RequestService Error:', {
      originalMessage: message,
      error: error,
      finalMessage: errorMessage,
      timestamp: new Date().toISOString()
    });

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get cached data (if implementing caching in the future)
   * @private
   */
  private getCachedData<T>(key: string): T | null {
    // Implement caching logic here if needed
    // For now, return null to indicate no cached data
    return null;
  }

  /**
   * Set cached data (if implementing caching in the future)
   * @private
   */
  private setCachedData<T>(key: string, data: T): void {
    // Implement caching logic here if needed
    // localStorage is not available in this environment
  }
}
