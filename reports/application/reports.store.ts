import { Injectable, signal } from '@angular/core';

export interface PeriodMetric {
  metricId: string;
  valueDisplay: string;
  labelKey: string;
  icon: string;
  accent: 'amber' | 'yellow' | 'blue';
}

@Injectable({ providedIn: 'root' })
export class ReportsStore {
  readonly dateRange = signal<string>('last30');
  readonly project = signal<string>('all');
  readonly machine = signal<string>('all');

  readonly periodMetrics = signal<PeriodMetric[]>([
    { metricId: 'totalFuel', valueDisplay: '24,500 L', labelKey: 'reports.period.totalFuel', icon: 'local_gas_station', accent: 'amber' },
    { metricId: 'avgEfficiency', valueDisplay: '85.3%', labelKey: 'reports.period.avgEfficiency', icon: 'trending_up', accent: 'yellow' },
    { metricId: 'activeHours', valueDisplay: '4,280', labelKey: 'reports.period.activeHours', icon: 'schedule', accent: 'blue' },
    { metricId: 'alertsResolved', valueDisplay: '156', labelKey: 'reports.period.alertsResolved', icon: 'task_alt', accent: 'yellow' },
    { metricId: 'costSavings', valueDisplay: '$12,450', labelKey: 'reports.period.costSavings', icon: 'savings', accent: 'yellow' },
  ]);

  setDateRange(value: string): void {
    this.dateRange.set(value);
  }

  setProject(value: string): void {
    this.project.set(value);
  }

  setMachine(value: string): void {
    this.machine.set(value);
  }
}
