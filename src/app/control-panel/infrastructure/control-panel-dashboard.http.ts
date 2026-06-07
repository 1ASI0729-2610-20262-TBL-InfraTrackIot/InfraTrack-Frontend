import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { INFRATRACK_API } from '../../shared/infratrack-api.urls';
import {
  AlertApiDto,
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
  TelemetryDataApiDto,
} from '../../shared/infratrack-api.dto';

export interface ControlPanelDashboardPayload {
  alerts: AlertApiDto[];
  machinery: MachineryApiDto[];
  telemetryData: TelemetryDataApiDto[];
  maintenanceRecords: MaintenanceRecordApiDto[];
  iotNodes: IotNodeApiDto[];
}

@Injectable({ providedIn: 'root' })
export class ControlPanelDashboardHttp {
  private readonly http = inject(HttpClient);

  loadDashboard$(): Observable<ControlPanelDashboardPayload> {
    return forkJoin({
      alerts: this.http.get<AlertApiDto[]>(INFRATRACK_API.alerts).pipe(catchError(() => of([]))),
      machinery: this.http.get<MachineryApiDto[]>(INFRATRACK_API.machinery).pipe(catchError(() => of([]))),
      telemetryData: this.http.get<TelemetryDataApiDto[]>(INFRATRACK_API.telemetryData).pipe(catchError(() => of([]))),
      maintenanceRecords: this.http
        .get<MaintenanceRecordApiDto[]>(INFRATRACK_API.maintenanceRecords)
        .pipe(catchError(() => of([]))),
      iotNodes: this.http.get<IotNodeApiDto[]>(INFRATRACK_API.iotNodes).pipe(catchError(() => of([]))),
    });
  }

  /** PUT MockAPI: envía el recurso completo con `isAcknowledged: true` (más compatible que PATCH). */
  acknowledgeAlert$(alert: AlertApiDto): Observable<AlertApiDto> {
    const url = `${INFRATRACK_API.alerts}/${alert.id}`;
    return this.http.put<AlertApiDto>(url, { ...alert, isAcknowledged: true });
  }
}
