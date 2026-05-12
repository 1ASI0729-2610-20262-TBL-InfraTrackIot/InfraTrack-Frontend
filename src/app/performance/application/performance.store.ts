import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

import { INFRATRACK_API } from '../../shared/infratrack-api.urls';
import {
  AlertApiDto,
  MachineryApiDto,
  OperatorApiDto,
  TelemetryDataApiDto,
} from '../../shared/infratrack-api.dto';
import { EfficiencySnapshot } from '../domain/model/efficiency-snapshot.model';
import {
  buildOperatorRows,
  buildPerformanceAlertRows,
  buildSnapshot,
  PerformanceAlertVm,
  PerformanceOperatorVm,
} from '../infrastructure/performance.mapper';

@Injectable({ providedIn: 'root' })
export class PerformanceStore {
  private readonly http = inject(HttpClient);

  readonly snapshot = signal<EfficiencySnapshot>({
    excessiveIdleSharePercent: 0,
    topOperatorEfficiencyPercent: 0,
    fuelVarianceVersusPlanPercent: 0,
  });

  readonly alertRows = signal<PerformanceAlertVm[]>([]);
  readonly operatorRows = signal<PerformanceOperatorVm[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.fetchDashboard$().subscribe({
      next: ({ alerts, telemetry, machinery, operators }) => {
        const allEmpty =
          !alerts.length && !telemetry.length && !machinery.length && !operators.length;
        if (allEmpty) {
          this.loadError.set('EMPTY');
        } else {
          this.loadError.set(null);
        }
        this.applyDashboard(alerts, telemetry, machinery, operators);
        this.loading.set(false);
      },
    });
  }

  /** Recarga solo operadores y KPIs que dependen de ellos (tras editar / borrar). */
  reloadOperators(): void {
    forkJoin({
      alerts: this.http.get<AlertApiDto[]>(INFRATRACK_API.alerts).pipe(catchError(() => of([]))),
      telemetry: this.http.get<TelemetryDataApiDto[]>(INFRATRACK_API.telemetryData).pipe(catchError(() => of([]))),
      machinery: this.http.get<MachineryApiDto[]>(INFRATRACK_API.machinery).pipe(catchError(() => of([]))),
      operators: this.http.get<OperatorApiDto[]>(INFRATRACK_API.operators).pipe(catchError(() => of([]))),
    })
      .pipe(take(1))
      .subscribe(({ alerts, telemetry, machinery, operators }) => {
        this.applyDashboard(alerts, telemetry, machinery, operators);
      });
  }

  updateOperator(body: OperatorApiDto): Observable<OperatorApiDto> {
    return this.http.put<OperatorApiDto>(`${INFRATRACK_API.operators}/${body.id}`, body);
  }

  deleteOperator(id: number): Observable<void> {
    return this.http.delete<void>(`${INFRATRACK_API.operators}/${id}`);
  }

  private fetchDashboard$() {
    return forkJoin({
      alerts: this.http.get<AlertApiDto[]>(INFRATRACK_API.alerts).pipe(catchError(() => of([]))),
      telemetry: this.http.get<TelemetryDataApiDto[]>(INFRATRACK_API.telemetryData).pipe(catchError(() => of([]))),
      machinery: this.http.get<MachineryApiDto[]>(INFRATRACK_API.machinery).pipe(catchError(() => of([]))),
      operators: this.http.get<OperatorApiDto[]>(INFRATRACK_API.operators).pipe(catchError(() => of([]))),
    });
  }

  private applyDashboard(
    alerts: AlertApiDto[],
    telemetry: TelemetryDataApiDto[],
    machinery: MachineryApiDto[],
    operators: OperatorApiDto[],
  ): void {
    this.snapshot.set(buildSnapshot(alerts, telemetry, machinery, operators));
    this.alertRows.set(buildPerformanceAlertRows(alerts, machinery));
    this.operatorRows.set(buildOperatorRows(operators));
  }
}
