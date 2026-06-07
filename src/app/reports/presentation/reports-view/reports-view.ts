import { DatePipe } from '@angular/common';
import { afterNextRender, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
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
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';
import { debounceTime, fromEvent } from 'rxjs';
import { map, switchMap, take } from 'rxjs';

import { AlertApiDto } from '../../../shared/infratrack-api.dto';
import { AlertsCenterStore } from '../../application/alerts-center.store';
import { ReportsStore } from '../../application/reports.store';
import { AddAlertDialog } from '../add-alert-dialog/add-alert-dialog';

Chart.register(...registerables);

@Component({
  selector: 'app-reports-view',
  imports: [
    DatePipe,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
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
    MatSlideToggle,
    MatProgressSpinner,
    TranslatePipe,
  ],
  templateUrl: './reports-view.html',
  styleUrl: './reports-view.css',
})
export class ReportsView {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  protected readonly store = inject(ReportsStore);
  protected readonly alertsStore = inject(AlertsCenterStore);

  private readonly pageWrap = viewChild<ElementRef<HTMLElement>>('pageWrap');
  private readonly fleetCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartFleet');
  private readonly statusCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartStatus');
  private readonly weeklyCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartWeekly');
  private readonly trendCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartTrend');

  private readonly charts: unknown[] = [];
  private resizeObserver?: ResizeObserver;

  protected readonly alertColumns = ['id', 'time', 'machine', 'type', 'severity', 'description', 'ack'] as const;

  protected readonly dateOptions = [
    { value: 'last7', labelKey: 'reports.filters.optLast7' },
    { value: 'last30', labelKey: 'reports.filters.optLast30' },
    { value: 'last90', labelKey: 'reports.filters.optLast90' },
  ] as const;

  protected readonly projectOptions = [
    { value: 'all', labelKey: 'reports.filters.optAllProjects' },
    { value: 'p1', labelKey: 'reports.filters.optProjectA' },
    { value: 'p2', labelKey: 'reports.filters.optProjectB' },
  ] as const;

  protected readonly machineOptions = [
    { value: 'all', labelKey: 'reports.filters.optAllMachines' },
    { value: 'ex', labelKey: 'reports.filters.optExcavators' },
    { value: 'ld', labelKey: 'reports.filters.optLoaders' },
  ] as const;

  constructor() {
    this.alertsStore.load().subscribe();

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      for (const c of this.charts) {
        (c as Chart).destroy();
      }
      this.charts.length = 0;
    });

    afterNextRender(() => {
      this.initCharts();
      this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.applyTranslations();
      });

      fromEvent(window, 'resize')
        .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.resizeCharts());

      const wrap = this.pageWrap()?.nativeElement;
      if (wrap && typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.resizeCharts());
        this.resizeObserver.observe(wrap);
      }
    });
  }

  protected typeKey(t: string): string {
    const k = String(t).toLowerCase();
    return ['fuel_theft', 'idle_excess', 'maintenance', 'geofence'].includes(k) ? k : 'other';
  }

  protected sevKey(sev: string): string {
    const s = String(sev).toLowerCase();
    return s === 'critical' || s === 'warning' ? s : 'other';
  }

  protected severityClass(sev: string): string {
    const s = String(sev).toLowerCase();
    if (s === 'critical') {
      return 'sev-pill sev-pill--critical';
    }
    if (s === 'warning') {
      return 'sev-pill sev-pill--warning';
    }
    return 'sev-pill sev-pill--neutral';
  }

  protected onAckChange(row: AlertApiDto, next: boolean): void {
    if (row.isAcknowledged === next) {
      return;
    }
    this.alertsStore
      .acknowledge(row, next)
      .pipe(
        switchMap((r) => this.alertsStore.load().pipe(map(() => r))),
        take(1),
      )
      .subscribe({
        next: (r) => {
          if (r.localOnly) {
            this.snack.open(this.translate.instant('reports.alertsCenter.ackLocalOnly'), undefined, { duration: 5200 });
          }
        },
        error: () => {
          this.snack.open(this.translate.instant('reports.alertsCenter.ackError'), undefined, { duration: 4000 });
        },
      });
  }

  protected openCreateAlert(): void {
    this.dialog.open(AddAlertDialog, {
      width: 'min(480px, 94vw)',
      autoFocus: 'dialog',
    });
  }

  exportReport(kind: 'pdf' | 'excel'): void {
    const key = kind === 'pdf' ? 'reports.export.demoPdf' : 'reports.export.demoExcel';
    this.snack.open(this.translate.instant(key), undefined, { duration: 2800 });
  }

  private resizeCharts(): void {
    for (const c of this.charts) {
      (c as Chart).resize();
    }
  }

  private initCharts(): void {
    if (this.charts.length) {
      return;
    }
    this.initFleetBar();
    this.initStatusDonut();
    this.initWeeklyLine();
    this.initTrendArea();
    queueMicrotask(() => this.resizeCharts());
  }

  private commonOptions(): Chart['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } },
        tooltip: { intersect: false },
      },
    };
  }

  private initFleetBar(): void {
    const canvas = this.fleetCanvas()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) {
      return;
    }
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.monthLabels(),
        datasets: [
          {
            label: this.translate.instant('reports.charts.excavators'),
            data: [4200, 4500, 4800, 5100],
            backgroundColor: '#ca8a04',
            borderRadius: 4,
          },
          {
            label: this.translate.instant('reports.charts.loaders'),
            data: [3100, 3300, 3000, 3400],
            backgroundColor: '#2563eb',
            borderRadius: 4,
          },
          {
            label: this.translate.instant('reports.charts.cranes'),
            data: [2100, 2200, 2400, 2300],
            backgroundColor: '#ea580c',
            borderRadius: 4,
          },
        ],
      },
      options: {
        ...this.commonOptions(),
        scales: {
          x: { stacked: false, grid: { display: false } },
          y: { beginAtZero: true, max: 6000, grid: { color: 'rgba(148, 163, 184, 0.25)' } },
        },
      },
    });
    this.charts.push(chart);
  }

  private initStatusDonut(): void {
    const canvas = this.statusCanvas()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) {
      return;
    }
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          this.translate.instant('reports.charts.statusActive'),
          this.translate.instant('reports.charts.statusIdle'),
          this.translate.instant('reports.charts.statusMaintenance'),
          this.translate.instant('reports.charts.statusOffline'),
        ],
        datasets: [
          {
            data: [65, 20, 10, 5],
            backgroundColor: ['#ca8a04', '#facc15', '#3b82f6', '#94a3b8'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
          legend: { position: 'right', labels: { usePointStyle: true, padding: 10, font: { size: 11 } } },
          tooltip: { intersect: false },
        },
      },
    });
    this.charts.push(chart);
  }

  private initWeeklyLine(): void {
    const canvas = this.weeklyCanvas()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) {
      return;
    }
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
        datasets: [
          {
            label: this.translate.instant('reports.charts.efficiencySeries'),
            data: [78, 80, 82, 85, 88, 90],
            borderColor: '#ca8a04',
            backgroundColor: 'rgba(202, 138, 4, 0.12)',
            tension: 0.35,
            fill: true,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        ...this.commonOptions(),
        scales: {
          x: { grid: { display: false } },
          y: { min: 70, max: 100, grid: { color: 'rgba(148, 163, 184, 0.25)' } },
        },
      },
    });
    this.charts.push(chart);
  }

  private initTrendArea(): void {
    const canvas = this.trendCanvas()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) {
      return;
    }
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [
          this.translate.instant('reports.charts.severityCritical'),
          this.translate.instant('reports.charts.severityWarning'),
          this.translate.instant('reports.charts.severityInfo'),
        ],
        datasets: [
          {
            label: this.translate.instant('reports.charts.alertVolume'),
            data: [12, 28, 48],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        ...this.commonOptions(),
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, max: 60, grid: { color: 'rgba(148, 163, 184, 0.25)' } },
        },
      },
    });
    this.charts.push(chart);
  }

  private monthLabels(): string[] {
    return [
      this.translate.instant('reports.charts.monthJan'),
      this.translate.instant('reports.charts.monthFeb'),
      this.translate.instant('reports.charts.monthMar'),
      this.translate.instant('reports.charts.monthApr'),
    ];
  }

  private applyTranslations(): void {
    const fleet = this.charts[0] as Chart | undefined;
    const donut = this.charts[1] as Chart | undefined;
    const weekly = this.charts[2] as Chart | undefined;
    const trend = this.charts[3] as Chart | undefined;

    if (fleet?.data.datasets?.[2]) {
      fleet.data.labels = this.monthLabels();
      fleet.data.datasets[0].label = this.translate.instant('reports.charts.excavators');
      fleet.data.datasets[1].label = this.translate.instant('reports.charts.loaders');
      fleet.data.datasets[2].label = this.translate.instant('reports.charts.cranes');
      fleet.update();
    }
    if (donut?.data.labels?.length === 4) {
      donut.data.labels = [
        this.translate.instant('reports.charts.statusActive'),
        this.translate.instant('reports.charts.statusIdle'),
        this.translate.instant('reports.charts.statusMaintenance'),
        this.translate.instant('reports.charts.statusOffline'),
      ];
      donut.update();
    }
    if (weekly?.data.datasets?.[0]) {
      weekly.data.datasets[0].label = this.translate.instant('reports.charts.efficiencySeries');
      weekly.update();
    }
    if (trend?.data.labels?.length === 3 && trend.data.datasets?.[0]) {
      trend.data.labels = [
        this.translate.instant('reports.charts.severityCritical'),
        this.translate.instant('reports.charts.severityWarning'),
        this.translate.instant('reports.charts.severityInfo'),
      ];
      trend.data.datasets[0].label = this.translate.instant('reports.charts.alertVolume');
      trend.update();
    }
  }
}
