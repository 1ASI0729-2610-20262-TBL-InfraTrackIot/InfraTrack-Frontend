export type TelemetryTimelineSeverity = 'info' | 'warning' | 'critical';
export type TelemetryTimelineStatus = 'active' | 'resolved';

export interface TelemetryTimelineEntry {
  description: string;
  timeLabel: string;
  status: TelemetryTimelineStatus;
  severity: TelemetryTimelineSeverity;
}
