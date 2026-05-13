import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { infratrackPostAllowed, infratrackPutDeleteAllowed } from '../../shared/infratrack-http-policy';
import { INFRATRACK_API } from '../../shared/infratrack-api.urls';
import { MachineryApiDto } from '../../shared/infratrack-api.dto';
import { Machine } from '../domain/model/machine.entity';
import { CreateMachineryBody, machineryDtoToMachine } from '../infrastructure/machinery.mapper';
import {
  coerceMachineryId,
  emptyMachineryOverlay,
  MachineryLocalOverlay,
  mergeMachineryFleet,
  pruneOverlayWithApi,
  readMachineryOverlay,
  writeMachineryOverlay,
} from '../infrastructure/machinery-local-overlay';

@Injectable({ providedIn: 'root' })
export class AssetManagementStore {
  private readonly http = inject(HttpClient);

  private readonly apiRowsSignal = signal<MachineryApiDto[]>([]);
  private readonly overlaySignal = signal<MachineryLocalOverlay>(readMachineryOverlay());

  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(10);
  private readonly loadingSignal = signal(false);
  private readonly loadErrorSignal = signal<string | null>(null);
  private readonly statusFilterSignal = signal<'all' | string>('all');
  private readonly plateQuerySignal = signal('');

  readonly loading = computed(() => this.loadingSignal());
  readonly loadError = computed(() => this.loadErrorSignal());
  readonly statusFilter = computed(() => this.statusFilterSignal());
  readonly plateQuery = computed(() => this.plateQuerySignal());

  readonly mergedFleet = computed(() => mergeMachineryFleet(this.apiRowsSignal(), this.overlaySignal()));

  readonly filteredFleet = computed(() => {
    const rows = this.mergedFleet();
    const st = this.statusFilterSignal();
    const q = this.plateQuerySignal().trim().toLowerCase();
    return rows.filter((m) => {
      if (st !== 'all' && String(m.currentStatus) !== st) {
        return false;
      }
      if (q && !String(m.plateNumber).toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  });

  readonly totalCount = computed(() => this.filteredFleet().length);
  readonly pageIndexValue = computed(() => this.pageIndex());
  readonly pageSizeValue = computed(() => this.pageSize());

  readonly page = computed((): Machine[] => {
    const all = this.filteredFleet();
    const start = this.pageIndex() * this.pageSize();
    const slice = all.slice(start, start + this.pageSize());
    return slice.map((d) => machineryDtoToMachine(d));
  });

  readonly range = computed(() => {
    const total = this.filteredFleet().length;
    const from = total === 0 ? 0 : this.pageIndex() * this.pageSize() + 1;
    const to = Math.min((this.pageIndex() + 1) * this.pageSize(), total);
    return { from, to, total };
  });

  /** Hay datos en flota pero el filtro / búsqueda no devuelve filas. */
  readonly emptyBecauseFilter = computed(
    () => this.mergedFleet().length > 0 && this.filteredFleet().length === 0,
  );

  /** UI: permitir PUT/DELETE (ver `infratrack-http-policy.ts`). */
  httpPutDeleteEnabled(): boolean {
    return infratrackPutDeleteAllowed();
  }

  /** UI: permitir POST de alta. */
  httpPostEnabled(): boolean {
    return infratrackPostAllowed();
  }

  setStatusFilter(v: 'all' | string): void {
    this.statusFilterSignal.set(v);
    this.pageIndex.set(0);
  }

  setPlateQuery(v: string): void {
    this.plateQuerySignal.set(v);
    this.pageIndex.set(0);
  }

  load(): Observable<MachineryApiDto[]> {
    this.loadingSignal.set(true);
    this.loadErrorSignal.set(null);
    return this.http.get<MachineryApiDto[]>(INFRATRACK_API.machinery).pipe(
      map((arr) => (Array.isArray(arr) ? arr : [])),
      tap((rows) => {
        let overlay = this.overlaySignal();
        if (!infratrackPutDeleteAllowed()) {
          overlay = emptyMachineryOverlay();
          this.overlaySignal.set(overlay);
          writeMachineryOverlay(overlay);
        }
        const pruned = pruneOverlayWithApi(rows, overlay);
        this.overlaySignal.set(pruned);
        writeMachineryOverlay(pruned);
        this.apiRowsSignal.set(rows);
        this.clampPageIndex();
      }),
      catchError(() => {
        this.loadErrorSignal.set('assetManagement.loadError');
        this.apiRowsSignal.set([]);
        return of<MachineryApiDto[]>([]);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  getMachineryById(id: number): MachineryApiDto | null {
    return this.mergedFleet().find((m) => coerceMachineryId(m.id) === id) ?? null;
  }

  addMachine(body: CreateMachineryBody): Observable<MachineryApiDto> {
    if (!infratrackPostAllowed()) {
      return throwError(() => new Error('INFRATRACK_POST_DISABLED'));
    }
    return this.http.post<MachineryApiDto>(INFRATRACK_API.machinery, body);
  }

  /**
   * PUT /machinery/:id — si MockAPI devuelve 404/405, persiste solo en overlay (localStorage).
   */
  updateMachinery(dto: MachineryApiDto): Observable<{ dto: MachineryApiDto; persistedLocally: boolean }> {
    if (!infratrackPutDeleteAllowed()) {
      return throwError(() => new Error('INFRATRACK_PUT_DELETE_DISABLED'));
    }
    const id = coerceMachineryId(dto.id);
    const url = `${INFRATRACK_API.machinery}/${id}`;
    return this.http.put<MachineryApiDto>(url, dto).pipe(
      tap(() => this.clearOverlayByIdEntry(id)),
      map((res) => ({ dto: res ?? dto, persistedLocally: false })),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404 || err.status === 405) {
          this.patchOverlayById(id, dto);
          return of({ dto, persistedLocally: true });
        }
        throw err;
      }),
    );
  }

  /**
   * DELETE /machinery/:id — si 404/405, marca borrado solo en overlay (oculta la fila).
   */
  deleteMachinery(id: number): Observable<{ persistedLocally: boolean }> {
    if (!infratrackPutDeleteAllowed()) {
      return throwError(() => new Error('INFRATRACK_PUT_DELETE_DISABLED'));
    }
    const url = `${INFRATRACK_API.machinery}/${id}`;
    return this.http.delete<void>(url).pipe(
      map(() => {
        this.purgeLocalAfterServerDelete(id);
        return { persistedLocally: false };
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404 || err.status === 405) {
          this.patchOverlayDelete(id);
          return of({ persistedLocally: true });
        }
        throw err;
      }),
    );
  }

  private clearOverlayByIdEntry(id: number): void {
    this.overlaySignal.update((o) => {
      const byId = { ...o.byId };
      delete byId[String(id)];
      const next: MachineryLocalOverlay = { ...o, byId };
      writeMachineryOverlay(next);
      return next;
    });
  }

  private patchOverlayById(id: number, dto: MachineryApiDto): void {
    this.overlaySignal.update((o) => {
      const next: MachineryLocalOverlay = {
        ...o,
        byId: { ...o.byId, [String(id)]: { ...dto, id } },
      };
      writeMachineryOverlay(next);
      return next;
    });
  }

  private patchOverlayDelete(id: number): void {
    this.overlaySignal.update((o) => {
      const byId = { ...o.byId };
      delete byId[String(id)];
      const next: MachineryLocalOverlay = {
        deletedIds: o.deletedIds.includes(id) ? o.deletedIds : [...o.deletedIds, id],
        byId,
      };
      writeMachineryOverlay(next);
      return next;
    });
  }

  /** Tras DELETE exitoso en servidor: limpia restos en overlay. */
  purgeLocalAfterServerDelete(id: number): void {
    this.overlaySignal.update((o) => {
      const byId = { ...o.byId };
      delete byId[String(id)];
      const next: MachineryLocalOverlay = {
        deletedIds: o.deletedIds.filter((x) => x !== id),
        byId,
      };
      writeMachineryOverlay(next);
      return next;
    });
  }

  goToLastPage(): void {
    const total = this.filteredFleet().length;
    if (total === 0) {
      this.pageIndex.set(0);
      return;
    }
    const last = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    this.pageIndex.set(last);
  }

  setPage(index: number, size: number): void {
    this.pageIndex.set(index);
    this.pageSize.set(size);
    this.clampPageIndex();
  }

  private clampPageIndex(): void {
    const total = this.filteredFleet().length;
    if (total === 0) {
      this.pageIndex.set(0);
      return;
    }
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) {
      this.pageIndex.set(maxPage);
    }
  }
}
