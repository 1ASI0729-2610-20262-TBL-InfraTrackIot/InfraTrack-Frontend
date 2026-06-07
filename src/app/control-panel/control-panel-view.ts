import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ControlPanelStore } from './application/control-panel.store';
import { FleetKpiId } from './domain/model/fleet-kpi.model';
import { ControlPanelCharts } from './presentation/control-panel-charts.component';

@Component({
  selector: 'app-control-panel-view',
  standalone: true,
  imports: [TranslatePipe, ControlPanelCharts, DecimalPipe],
  templateUrl: './control-panel-view.html',
  styleUrl: './control-panel-view.css',
})
export class ControlPanelView {
  protected readonly store = inject(ControlPanelStore);

  markerDotClass(status: string): string {
    if (status === 'active') {
      return 'map-dot map-dot--active';
    }
    if (status === 'maintenance') {
      return 'map-dot map-dot--maint';
    }
    return 'map-dot map-dot--idle';
  }

  isKpiSelected(id: FleetKpiId): boolean {
    return this.store.selectedKpiId() === id;
  }
}
