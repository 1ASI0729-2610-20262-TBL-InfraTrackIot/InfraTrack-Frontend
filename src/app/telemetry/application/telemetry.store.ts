import { Injectable, signal } from '@angular/core';

import { SensorMetric } from '../domain/model/sensor-metric.model';
import { TelemetryTimelineEntry } from '../domain/model/telemetry-timeline-entry.model';

@Injectable({ providedIn: 'root' })
export class TelemetryStore {
  readonly sensorMetrics = signal<SensorMetric[]>([
    { sensorMetricId: 'fuelLevel', value: '82%', progress: 82, icon: 'local_gas_station' },
    { sensorMetricId: 'engineTemp', value: '73 °C', progress: 73, icon: 'thermostat' },
    { sensorMetricId: 'rpm', value: '1,400', progress: 65, icon: 'speed' },
    { sensorMetricId: 'battery', value: '87%', progress: 87, icon: 'battery_charging_full' },
  ]);

  readonly timeline = signal<TelemetryTimelineEntry[]>([
    {
      description: 'Engine RPM exceeded (1,400)',
      timeLabel: '10:42 AM',
      status: 'active',
      severity: 'warning',
    },
    {
      description: 'GPS heartbeat restored',
      timeLabel: '10:18 AM',
      status: 'resolved',
      severity: 'info',
    },
    {
      description: 'Fuel drop > 8% in 5 minutes',
      timeLabel: '09:55 AM',
      status: 'active',
      severity: 'critical',
    },
  ]);
}
