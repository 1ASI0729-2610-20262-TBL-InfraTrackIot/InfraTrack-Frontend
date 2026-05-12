import { afterNextRender, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { TelemetryStore } from '../../application/telemetry.store';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

@Component({
  selector: 'app-telemetry-view',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatIcon,
    MatProgressBar,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    TranslatePipe,
  ],
  templateUrl: './telemetry-view.html',
  styleUrl: './telemetry-view.css',
})
export class TelemetryView {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly store = inject(TelemetryStore);

  protected readonly timelineColumns = ['description', 'timeLabel', 'status', 'severity'] as const;

  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  private chart?: Chart<'line', number[], string>;
  private resizeObserver?: ResizeObserver;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.chart?.destroy();
      this.chart = undefined;
    });

    afterNextRender(() => {
      this.initChart();
      this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.applyChartTranslations();
      });
    });
  }

  private initChart(): void {
    const canvas = this.chartCanvas()?.nativeElement;
    if (!canvas || this.chart) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    this.chart = new Chart<'line', number[], string>(ctx, {
      type: 'line',
      data: {
        labels: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'],
        datasets: [
          {
            label: this.translate.instant('telemetry.chart.fuelSeries'),
            data: [88, 86, 84, 83, 82, 81, 82],
            borderColor: '#ca8a04',
            backgroundColor: 'rgba(202, 138, 4, 0.12)',
            tension: 0.35,
            fill: true,
            yAxisID: 'y',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointHoverBorderWidth: 2,
          },
          {
            label: this.translate.instant('telemetry.chart.tempSeries'),
            data: [72, 72.5, 73, 74, 73.5, 73, 73],
            borderColor: '#ea580c',
            backgroundColor: 'rgba(234, 88, 12, 0.08)',
            tension: 0.35,
            fill: true,
            yAxisID: 'y1',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointHoverBorderWidth: 2,
          },
          {
            label: this.translate.instant('telemetry.chart.batterySeries'),
            data: [91, 90, 89, 88, 87, 87, 87],
            borderColor: '#ca8a04',
            backgroundColor: 'rgba(202, 138, 4, 0.12)',
            tension: 0.35,
            fill: true,
            yAxisID: 'y',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 18,
              font: { size: 12, weight: 500 },
            },
          },
          tooltip: {
            intersect: false,
            callbacks: {
              label: (ctx: any) => {
                const raw = ctx.parsed.y;
                if (raw === null || raw === undefined) {
                  return '';
                }
                const base = `${ctx.dataset.label ?? ''}`;
                if (ctx.dataset.yAxisID === 'y1') {
                  return `${base}: ${raw} °C`;
                }
                return `${base}: ${raw} %`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 0, autoSkip: true },
          },
          y: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            grid: { color: 'rgba(148, 163, 184, 0.25)' },
            title: {
              display: true,
              text: this.translate.instant('telemetry.chart.axisPercent'),
            },
            ticks: { callback: (v: any) => `${v}` },
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 65,
            max: 80,
            grid: { drawOnChartArea: false },
            title: {
              display: true,
              text: this.translate.instant('telemetry.chart.axisTemp'),
            },
          },
        },
      },
    });

    const wrap = canvas.parentElement;
    if (wrap && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.chart?.resize();
      });
      this.resizeObserver.observe(wrap);
    }
  }

  private applyChartTranslations(): void {
    const chart = this.chart;
    if (!chart?.data.datasets?.length) {
      return;
    }
    const [fuel, temp, battery] = chart.data.datasets;
    fuel.label = this.translate.instant('telemetry.chart.fuelSeries');
    temp.label = this.translate.instant('telemetry.chart.tempSeries');
    battery.label = this.translate.instant('telemetry.chart.batterySeries');

    const scales = chart.options.scales as Record<string, { title?: { text?: string } }> | undefined;
    const yScale = scales?.['y'];
    const y1Scale = scales?.['y1'];
    if (yScale?.title) {
      yScale.title.text = this.translate.instant('telemetry.chart.axisPercent');
    }
    if (y1Scale?.title) {
      y1Scale.title.text = this.translate.instant('telemetry.chart.axisTemp');
    }
    chart.update();
  }
}
