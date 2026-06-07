import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { IamService } from '../../iam/application/iam.service';
import { infratrackPostAllowed, infratrackPutDeleteAllowed } from '../../shared/infratrack-http-policy';
import { INFRATRACK_API } from '../../shared/infratrack-api.urls';
import { AlertApiDto } from '../../shared/infratrack-api.dto';
import {
  AlertsLocalOverlay,
  emptyAlertsOverlay,
  mergeAlertsWithOverlay,
  pruneAlertsOverlay,
  readAlertsOverlay,
  writeAlertsOverlay,
} from '../infrastructure/alerts-local-overlay';

export type AlertSeverityFilter = 'all' | 'critical' | 'warning';
export type AlertTypeFilter = 'all' | 'fuel_theft' | 'idle_excess' | 'maintenance' | 'geofence';
export type AlertAckFilter = 'all' | 'ack' | 'pending';

@Injectable({ providedIn: 'root' })
export class AlertsCenterStore {
  private readonly http = inject(HttpClient);
  private readonly iam = inject(IamService);

  private readonly apiRows = signal<AlertApiDto[]>([]);
  private readonly overlay = signal<AlertsLocalOverlay>(readAlertsOverlay());
  private readonly loadingSig = signal(false);
  private readonly loadErrorSig = signal<string | null>(null);

  private readonly severityFilter = signal<AlertSeverityFilter>('all');
  private readonly typeFilter = signal<AlertTypeFilter>('all');
  private readonly ackFilter = signal<AlertAckFilter>('all');

  readonly loading = computed(() => this.loadingSig());
  readonly loadError = computed(() => this.loadErrorSig());
  readonly severityFilterValue = computed(() => this.severityFilter());
  readonly typeFilterValue = computed(() => this.typeFilter());
  readonly ackFilterValue = computed(() => this.ackFilter());

  readonly isOwner = computed(() => this.iam.role() === 'owner');
  readonly isAdmin = computed(() => this.iam.role() === 'admin');
  readonly canAcknowledge = computed(() => this.iam.isAuthenticated() && infratrackPutDeleteAllowed());

  httpPutDeleteEnabled(): boolean {
    return infratrackPutDeleteAllowed();
  }

  httpPostEnabled(): boolean {
    return infratrackPostAllowed();
  }

  readonly merged = computed(() => mergeAlertsWithOverlay(this.apiRows(), this.overlay()));

  /** Propietario: solo alertas críticas (enunciado). */
  private readonly roleScoped = computed((): AlertApiDto[] => {
    const rows = this.merged();
    if (this.isOwner()) {
      return rows.filter((a) => String(a.severity).toLowerCase() === 'critical');
    }
    return rows;
  });

  readonly filteredRows = computed((): AlertApiDto[] => {
    let rows = this.roleScoped();
    const sev = this.severityFilter();
    const typ = this.typeFilter();
    const ack = this.ackFilter();

    if (!this.isOwner() && sev !== 'all') {
      rows = rows.filter((a) => String(a.severity).toLowerCase() === sev);
    }
    if (typ !== 'all') {
      rows = rows.filter((a) => String(a.type).toLowerCase() === typ);
    }
    if (ack === 'ack') {
      rows = rows.filter((a) => a.isAcknowledged);
    } else if (ack === 'pending') {
      rows = rows.filter((a) => !a.isAcknowledged);
    }

    return [...rows].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  });

  setSeverityFilter(v: AlertSeverityFilter): void {
    this.severityFilter.set(v);
  }

  setTypeFilter(v: AlertTypeFilter): void {
    this.typeFilter.set(v);
  }

  setAckFilter(v: AlertAckFilter): void {
    this.ackFilter.set(v);
  }

  load(): Observable<AlertApiDto[]> {
    this.loadingSig.set(true);
    this.loadErrorSig.set(null);
    return this.http.get<AlertApiDto[]>(INFRATRACK_API.alerts).pipe(
      map((arr) => (Array.isArray(arr) ? arr : [])),
      tap((rows) => {
        let overlay = this.overlay();
        if (!infratrackPutDeleteAllowed()) {
          overlay = emptyAlertsOverlay();
          this.overlay.set(overlay);
          writeAlertsOverlay(overlay);
        }
        const pruned = pruneAlertsOverlay(rows, overlay);
        this.overlay.set(pruned);
        writeAlertsOverlay(pruned);
        this.apiRows.set(rows);
      }),
      catchError(() => {
        this.loadErrorSig.set('reports.alertsCenter.loadError');
        this.apiRows.set([]);
        return of<AlertApiDto[]>([]);
      }),
      finalize(() => this.loadingSig.set(false)),
    );
  }

  acknowledge(alert: AlertApiDto, isAcknowledged: boolean): Observable<{ localOnly: boolean }> {
    if (!infratrackPutDeleteAllowed()) {
      return throwError(() => new Error('INFRATRACK_PUT_DELETE_DISABLED'));
    }
    const id = alert.id;
    const url = `${INFRATRACK_API.alerts}/${id}`;
    const body: AlertApiDto = { ...alert, isAcknowledged };
    return this.http.put<AlertApiDto>(url, body).pipe(
      tap(() => this.clearOverlayId(id)),
      map(() => ({ localOnly: false })),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404 || err.status === 405) {
          this.patchOverlayId(id, { ...alert, isAcknowledged });
          return of({ localOnly: true });
        }
        throw err;
      }),
    );
  }

  createAlert(payload: Omit<AlertApiDto, 'id'>): Observable<AlertApiDto> {
    if (!infratrackPostAllowed()) {
      return throwError(() => new Error('INFRATRACK_POST_DISABLED'));
    }
    return this.http.post<AlertApiDto>(INFRATRACK_API.alerts, payload as AlertApiDto);
  }

  private clearOverlayId(id: number): void {
    this.overlay.update((o) => {
      const byId = { ...o.byId };
      delete byId[String(id)];
      const next: AlertsLocalOverlay = { byId };
      writeAlertsOverlay(next);
      return next;
    });
  }

  private patchOverlayId(id: number, dto: AlertApiDto): void {
    this.overlay.update((o) => {
      const next: AlertsLocalOverlay = {
        ...o,
        byId: { ...o.byId, [String(id)]: { ...dto, id } },
      };
      writeAlertsOverlay(next);
      return next;
    });
  }
}
