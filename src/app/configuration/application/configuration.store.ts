import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { INFRATRACK_API } from '../../shared/infratrack-api.urls';
import {
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
} from '../../shared/infratrack-api.dto';
import { buildConfigurationDashboard, ConfigurationDashboardVm } from '../infrastructure/configuration.mapper';

@Injectable({ providedIn: 'root' })
export class ConfigurationStore {
  private readonly http = inject(HttpClient);

  readonly theftDropAlertsEnabled = signal(true);
  readonly dailyEmailDigestEnabled = signal(false);

  readonly dashboard = signal<ConfigurationDashboardVm | null>(null);
  readonly apiLoading = signal(false);
  readonly apiEmpty = signal(false);

  setTheftDropAlertsEnabled(value: boolean): void {
    this.theftDropAlertsEnabled.set(value);
  }

  setDailyEmailDigestEnabled(value: boolean): void {
    this.dailyEmailDigestEnabled.set(value);
  }

  loadApiSnapshot(): void {
    this.apiLoading.set(true);
    this.apiEmpty.set(false);
    forkJoin({
      machinery: this.http.get<MachineryApiDto[]>(INFRATRACK_API.machinery).pipe(catchError(() => of([]))),
      iotNodes: this.http.get<IotNodeApiDto[]>(INFRATRACK_API.iotNodes).pipe(catchError(() => of([]))),
      maintenanceRecords: this.http
        .get<MaintenanceRecordApiDto[]>(INFRATRACK_API.maintenanceRecords)
        .pipe(catchError(() => of([]))),
      subscriptions: this.http.get<unknown[]>(INFRATRACK_API.subscriptions).pipe(catchError(() => of([]))),
    }).subscribe(({ machinery, iotNodes, maintenanceRecords, subscriptions }) => {
      const vm = buildConfigurationDashboard(machinery, iotNodes, maintenanceRecords, subscriptions);
      this.dashboard.set(vm);
      const empty =
        !machinery.length &&
        !iotNodes.length &&
        !maintenanceRecords.length &&
        (!Array.isArray(subscriptions) || subscriptions.length === 0);
      this.apiEmpty.set(empty);
      this.apiLoading.set(false);
    });
  }

  addIotNode(body: Omit<IotNodeApiDto, 'id'>): Observable<IotNodeApiDto> {
    return this.http.post<IotNodeApiDto>(INFRATRACK_API.iotNodes, body);
  }

  addMaintenanceRecord(body: Omit<MaintenanceRecordApiDto, 'id'>): Observable<MaintenanceRecordApiDto> {
    return this.http.post<MaintenanceRecordApiDto>(INFRATRACK_API.maintenanceRecords, body);
  }
}
