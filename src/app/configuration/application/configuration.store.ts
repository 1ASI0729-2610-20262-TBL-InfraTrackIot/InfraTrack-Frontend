import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { INFRATRACK_API } from '../../shared/infratrack-api.urls';
import { infratrackPostAllowed, infratrackPutDeleteAllowed } from '../../shared/infratrack-http-policy';
import {
  IotNodeApiDto,
  MachineryApiDto,
  MaintenanceRecordApiDto,
} from '../../shared/infratrack-api.dto';
import { buildConfigurationDashboard, ConfigurationDashboardVm } from '../infrastructure/configuration.mapper';

@Injectable({ providedIn: 'root' })
export class ConfigurationStore {
  private readonly http = inject(HttpClient);

  readonly dashboard = signal<ConfigurationDashboardVm | null>(null);
  /** Copia en vivo para la tabla de nodos IoT (GET /iotNodes + GET /machinery). */
  readonly machinery = signal<MachineryApiDto[]>([]);
  readonly iotNodes = signal<IotNodeApiDto[]>([]);
  readonly apiLoading = signal(false);
  readonly apiEmpty = signal(false);

  httpPostEnabled(): boolean {
    return infratrackPostAllowed();
  }

  httpPutDeleteEnabled(): boolean {
    return infratrackPutDeleteAllowed();
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
      this.machinery.set(machinery);
      this.iotNodes.set(iotNodes);
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
    if (!infratrackPostAllowed()) {
      return throwError(() => new Error('INFRATRACK_POST_DISABLED'));
    }
    return this.http.post<IotNodeApiDto>(INFRATRACK_API.iotNodes, body);
  }

  /**
   * Vincular nodo a máquina (MockAPI: PUT /iotNodes/:id con cuerpo completo).
   * Desactivado cuando `infratrack-http-policy` no permite PUT (demo solo GET).
   */
  linkIotNodeToMachinery(nodeId: number, machineryId: number): Observable<IotNodeApiDto> {
    if (!infratrackPutDeleteAllowed()) {
      return throwError(() => new Error('INFRATRACK_PUT_DELETE_DISABLED'));
    }
    const current = this.iotNodes().find((n) => n.id === nodeId);
    if (!current) {
      return throwError(() => new Error('IOT_NODE_NOT_FOUND'));
    }
    const body: IotNodeApiDto = { ...current, machineryId };
    return this.http.put<IotNodeApiDto>(`${INFRATRACK_API.iotNodes}/${nodeId}`, body);
  }

  addMaintenanceRecord(body: Omit<MaintenanceRecordApiDto, 'id'>): Observable<MaintenanceRecordApiDto> {
    if (!infratrackPostAllowed()) {
      return throwError(() => new Error('INFRATRACK_POST_DISABLED'));
    }
    return this.http.post<MaintenanceRecordApiDto>(INFRATRACK_API.maintenanceRecords, body);
  }
}
