export type MachineOperationalStatus = 'active' | 'warning' | 'idle' | 'resolved';
export type MachineFuelLevel = 'high' | 'medium' | 'low' | 'warning';

export interface Machine {
  /** Id numérico de la API (acciones editar / borrar). */
  machineryApiId: number;
  machineId: string;
  machineName: string;
  operationalStatus: MachineOperationalStatus;
  fuelLevel: MachineFuelLevel;
  locationLabel: string;
}
