import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateWorksiteApiDto,
  CreateWorksiteStaffApiDto,
  WorksiteApiDto,
  WorksiteStaffApiDto,
  WorksiteTransportApiDto,
} from './worksites.mapper';

const BASE = `${environment.apiBaseUrl}/worksites`;
const STAFF_BASE = `${environment.apiBaseUrl}${environment.staffEndpointPath}`;

@Injectable({ providedIn: 'root' })
export class WorksitesHttp {
  private readonly http = inject(HttpClient);

  listWorksites(): Observable<WorksiteApiDto[]> {
    return this.http.get<WorksiteApiDto[]>(BASE);
  }

  getWorksite(id: number): Observable<WorksiteApiDto> {
    return this.http.get<WorksiteApiDto>(`${BASE}/${id}`);
  }

  createWorksite(body: CreateWorksiteApiDto): Observable<WorksiteApiDto> {
    return this.http.post<WorksiteApiDto>(BASE, body);
  }

  listStaff(): Observable<WorksiteStaffApiDto[]> {
    return this.http.get<WorksiteStaffApiDto[]>(STAFF_BASE);
  }

  createStaff(body: CreateWorksiteStaffApiDto): Observable<WorksiteStaffApiDto> {
    return this.http.post<WorksiteStaffApiDto>(STAFF_BASE, body);
  }

  listTransportsForWorksite(worksiteId: number): Observable<WorksiteTransportApiDto[]> {
    return this.http.get<WorksiteTransportApiDto[]>(`${BASE}/${worksiteId}/transports`);
  }

  assignStaff(worksiteId: number, staffId: number): Observable<unknown> {
    return this.http.put(`${BASE}/${worksiteId}/staff/${staffId}`, null);
  }
}
