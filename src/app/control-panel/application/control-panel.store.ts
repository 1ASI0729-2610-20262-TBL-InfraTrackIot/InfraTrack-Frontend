import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

import { ControlPanelDashboardHttp, ControlPanelDashboardPayload } from '../infrastructure/control-panel-dashboard.http';
import {
  buildDashboardAlerts,
  buildKpis,
  buildMaintenanceRows,
  buildMapMarkers,
  MaintenanceRowVm,
  MapMarkerView,
} from '../infrastructure/control-panel.mapper';
import { DashboardAlert } from '../domain/model/dashboard-alert.model';
import { FleetKpi, FleetKpiId } from '../domain/model/fleet-kpi.model';

@Injectable({ providedIn: 'root' })
export class ControlPanelStore {
  private readonly http = inject(ControlPanelDashboardHttp);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly kpisSignal = signal<FleetKpi[]>([]);
  private readonly alertsSignal = signal<DashboardAlert[]>([]);
  private readonly mapMarkersSignal = signal<MapMarkerView[]>([]);
  private readonly maintenanceSignal = signal<MaintenanceRowVm[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly cachedPayload = signal<ControlPanelDashboardPayload | null>(null);

  private readonly selectedKpiSignal = signal<FleetKpiId | null>('activeMachines');

  readonly kpis = computed(() => this.kpisSignal());
  readonly alerts = computed(() => this.alertsSignal());
  readonly mapMarkers = computed(() => this.mapMarkersSignal());
  readonly maintenanceRows = computed(() => this.maintenanceSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly loadError = computed(() => this.errorSignal());
  readonly selectedKpiId = computed(() => this.selectedKpiSignal());

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.rebuildFromCache());
    this.refresh();
  }

  refresh(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.http.loadDashboard$().subscribe({
      next: (payload) => {
        this.cachedPayload.set(payload);
        this.applyPayload(payload);
        this.loadingSignal.set(false);
        const hasAny =
          payload.alerts.length > 0 ||
          payload.machinery.length > 0 ||
          payload.telemetryData.length > 0 ||
          payload.maintenanceRecords.length > 0;
        if (!hasAny) {
          this.errorSignal.set(this.translate.instant('controlPanel.load.empty'));
        }
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set(this.translate.instant('controlPanel.load.error'));
      },
    });
  }

  private rebuildFromCache(): void {
    const payload = this.cachedPayload();
    if (payload) {
      this.applyPayload(payload);
    }
  }

  private applyPayload(payload: ControlPanelDashboardPayload): void {
    const locale = this.translate.currentLang || 'en';
    this.kpisSignal.set(buildKpis(payload.alerts, payload.machinery));
    this.alertsSignal.set(buildDashboardAlerts(payload.alerts, payload.machinery, locale));
    this.mapMarkersSignal.set(
      buildMapMarkers(payload.alerts, payload.machinery, payload.telemetryData, payload.iotNodes),
    );
    this.maintenanceSignal.set(buildMaintenanceRows(payload.maintenanceRecords, payload.machinery));
  }

  selectKpi(id: FleetKpiId): void {
    this.selectedKpiSignal.set(id);
  }
}
