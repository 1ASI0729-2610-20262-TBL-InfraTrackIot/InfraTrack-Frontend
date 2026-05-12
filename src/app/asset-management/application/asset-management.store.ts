import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { INFRATRACK_API } from '../../shared/infratrack-api.urls';
import { MachineryApiDto } from '../../shared/infratrack-api.dto';
import { Machine } from '../domain/model/machine.entity';
import { CreateMachineryBody, machineryDtoToMachine } from '../infrastructure/machinery.mapper';

@Injectable({ providedIn: 'root' })
export class AssetManagementStore {
  private readonly http = inject(HttpClient);

  private readonly machinesSignal = signal<Machine[]>([]);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(10);
  private readonly loadingSignal = signal(false);
  private readonly loadErrorSignal = signal<string | null>(null);

  readonly loading = computed(() => this.loadingSignal());
  readonly loadError = computed(() => this.loadErrorSignal());
  readonly totalCount = computed(() => this.machinesSignal().length);
  readonly pageIndexValue = computed(() => this.pageIndex());
  readonly pageSizeValue = computed(() => this.pageSize());

  readonly page = computed(() => {
    const all = this.machinesSignal();
    const start = this.pageIndex() * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  readonly range = computed(() => {
    const total = this.machinesSignal().length;
    const from = total === 0 ? 0 : this.pageIndex() * this.pageSize() + 1;
    const to = Math.min((this.pageIndex() + 1) * this.pageSize(), total);
    return { from, to, total };
  });

  load(): Observable<Machine[]> {
    this.loadingSignal.set(true);
    this.loadErrorSignal.set(null);
    return this.http.get<MachineryApiDto[]>(INFRATRACK_API.machinery).pipe(
      map((arr) => (Array.isArray(arr) ? arr.map((d) => machineryDtoToMachine(d)) : [])),
      tap((rows) => {
        this.machinesSignal.set(rows);
        this.clampPageIndex();
      }),
      catchError(() => {
        this.loadErrorSignal.set('HTTP');
        this.machinesSignal.set([]);
        return of<Machine[]>([]);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  addMachine(body: CreateMachineryBody): Observable<MachineryApiDto> {
    return this.http.post<MachineryApiDto>(INFRATRACK_API.machinery, body);
  }

  goToLastPage(): void {
    const total = this.machinesSignal().length;
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
    const total = this.machinesSignal().length;
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
