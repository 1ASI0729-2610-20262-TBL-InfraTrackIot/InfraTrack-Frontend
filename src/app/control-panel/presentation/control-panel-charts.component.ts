import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  effect,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ArcElement, Chart, DoughnutController, Legend, Tooltip } from 'chart.js';

import { IotNodeApiDto, MachineryApiDto } from '../../shared/infratrack-api.dto';

Chart.register(DoughnutController, ArcElement, Legend, Tooltip);

@Component({
  selector: 'app-control-panel-charts',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="charts-grid">
      <div class="chart-card">
        <h3 class="chart-title">{{ 'controlPanel.charts.machineryStatus' | translate }}</h3>
        <div class="chart-canvas-wrap">
          <canvas #machCanvas height="220" aria-label="Machinery status chart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h3 class="chart-title">{{ 'controlPanel.charts.nodesOnline' | translate }}</h3>
        <div class="chart-canvas-wrap">
          <canvas #nodesCanvas height="220" aria-label="IoT nodes chart"></canvas>
        </div>
      </div>
    </div>
  `,
  styles: `
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .chart-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1rem 1rem 0.5rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
    }
    .chart-title {
      margin: 0 0 0.75rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #334155;
    }
    .chart-canvas-wrap {
      position: relative;
      height: 220px;
      width: 100%;
    }
  `,
})
export class ControlPanelCharts {
  readonly machinery = input<MachineryApiDto[]>([]);
  readonly iotNodes = input<IotNodeApiDto[]>([]);

  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly machCanvas = viewChild<ElementRef<HTMLCanvasElement>>('machCanvas');
  private readonly nodesCanvas = viewChild<ElementRef<HTMLCanvasElement>>('nodesCanvas');

  private machineryChart: Chart | null = null;
  private nodesChart: Chart | null = null;

  constructor() {
    afterNextRender(() => {
      effect(() => {
        const m = this.machinery();
        const n = this.iotNodes();
        const c1 = this.machCanvas()?.nativeElement;
        const c2 = this.nodesCanvas()?.nativeElement;
        if (!c1 || !c2) {
          return;
        }
        this.drawMachineryChart(c1, m);
        this.drawNodesChart(c2, n);
      });
    });

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const m = this.machinery();
      const n = this.iotNodes();
      const c1 = this.machCanvas()?.nativeElement;
      const c2 = this.nodesCanvas()?.nativeElement;
      if (c1) {
        this.drawMachineryChart(c1, m);
      }
      if (c2) {
        this.drawNodesChart(c2, n);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.machineryChart?.destroy();
      this.nodesChart?.destroy();
    });
  }

  private drawMachineryChart(canvas: HTMLCanvasElement, machinery: MachineryApiDto[]): void {
    this.machineryChart?.destroy();
    this.machineryChart = null;

    let active = 0;
    let maintenance = 0;
    let inactive = 0;
    let other = 0;
    for (const x of machinery) {
      if (x.currentStatus === 'active') {
        active++;
      } else if (x.currentStatus === 'maintenance') {
        maintenance++;
      } else if (x.currentStatus === 'inactive') {
        inactive++;
      } else {
        other++;
      }
    }

    const labelActive = this.translate.instant('controlPanel.charts.legendActive');
    const labelMaint = this.translate.instant('controlPanel.charts.legendMaintenance');
    const labelInactive = this.translate.instant('controlPanel.charts.legendInactive');
    const labelOther = this.translate.instant('controlPanel.charts.legendOther');

    const pairs: { label: string; value: number; color: string }[] = [];
    if (active) {
      pairs.push({ label: labelActive, value: active, color: '#22c55e' });
    }
    if (maintenance) {
      pairs.push({ label: labelMaint, value: maintenance, color: '#f59e0b' });
    }
    if (inactive) {
      pairs.push({ label: labelInactive, value: inactive, color: '#94a3b8' });
    }
    if (other) {
      pairs.push({ label: labelOther, value: other, color: '#cbd5e1' });
    }

    if (!pairs.length) {
      this.machineryChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: [this.translate.instant('controlPanel.charts.noData')],
          datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: '#475569' } },
          },
        },
      });
      return;
    }

    this.machineryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: pairs.map((p) => p.label),
        datasets: [
          {
            data: pairs.map((p) => p.value),
            backgroundColor: pairs.map((p) => p.color),
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              font: { size: 11 },
              color: '#475569',
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.raw);
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((v / total) * 100);
                return `${ctx.label}: ${v} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  private drawNodesChart(canvas: HTMLCanvasElement, nodes: IotNodeApiDto[]): void {
    this.nodesChart?.destroy();
    this.nodesChart = null;

    let online = 0;
    let offline = 0;
    let other = 0;
    for (const x of nodes) {
      if (x.connectionStatus === 'online') {
        online++;
      } else if (x.connectionStatus === 'offline') {
        offline++;
      } else {
        other++;
      }
    }

    const labelOn = this.translate.instant('controlPanel.charts.legendOnline');
    const labelOff = this.translate.instant('controlPanel.charts.legendOffline');
    const labelOth = this.translate.instant('controlPanel.charts.legendNodesOther');

    const pairs: { label: string; value: number; color: string }[] = [];
    if (online) {
      pairs.push({ label: labelOn, value: online, color: '#3b82f6' });
    }
    if (offline) {
      pairs.push({ label: labelOff, value: offline, color: '#cbd5e1' });
    }
    if (other) {
      pairs.push({ label: labelOth, value: other, color: '#e2e8f0' });
    }

    if (!pairs.length) {
      this.nodesChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: [this.translate.instant('controlPanel.charts.noData')],
          datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: '#475569' } },
          },
        },
      });
      return;
    }

    this.nodesChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: pairs.map((p) => p.label),
        datasets: [
          {
            data: pairs.map((p) => p.value),
            backgroundColor: pairs.map((p) => p.color),
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              font: { size: 11 },
              color: '#475569',
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.raw);
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((v / total) * 100);
                return `${ctx.label}: ${v} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }
}