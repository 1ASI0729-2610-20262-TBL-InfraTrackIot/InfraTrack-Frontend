export type SensorMetricId = 'fuelLevel' | 'engineTemp' | 'rpm' | 'battery';

export interface SensorMetric {
  sensorMetricId: SensorMetricId;
  value: string;
  progress: number;
  icon: string;
}
