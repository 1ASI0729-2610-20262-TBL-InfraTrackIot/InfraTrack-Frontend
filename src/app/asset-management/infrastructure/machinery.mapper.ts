import { MachineryApiDto } from '../../shared/infratrack-api.dto';
import { Machine, MachineFuelLevel, MachineOperationalStatus } from '../domain/model/machine.entity';

function coerceId(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const STATUS_MAP: Record<string, MachineOperationalStatus> = {
  active: 'active',
  inactive: 'idle',
  maintenance: 'warning',
};

export function machineryDtoToMachine(d: MachineryApiDto): Machine {
  const id = coerceId(d.id);
  const machineId = id > 0 ? `MCH-${String(id).padStart(2, '0')}` : d.plateNumber || '—';
  const machineName = [d.brand, d.model].filter(Boolean).join(' ').trim() || d.plateNumber;
  const operationalStatus = STATUS_MAP[String(d.currentStatus)] ?? 'warning';
  const fuelLevel: MachineFuelLevel =
    d.currentStatus === 'maintenance' ? 'warning' : operationalStatus === 'active' ? 'high' : 'medium';
  const locationLabel = d.plateNumber ? `${d.plateNumber} · ${d.fuelType}` : '—';
  return { machineryApiId: id, machineId, machineName, operationalStatus, fuelLevel, locationLabel };
}

export type CreateMachineryBody = Omit<MachineryApiDto, 'id'>;

export function buildCreateMachineryBody(values: {
  operatorId: number;
  plateNumber: string;
  model: string;
  brand: string;
  fuelType: string;
  tankCapacityLiters: number;
  currentStatus: string;
  imageUrl: string;
}): CreateMachineryBody {
  return {
    operatorId: values.operatorId,
    plateNumber: values.plateNumber.trim(),
    model: values.model.trim(),
    brand: values.brand.trim(),
    fuelType: values.fuelType,
    tankCapacityLiters: values.tankCapacityLiters,
    currentStatus: values.currentStatus,
    imageUrl: values.imageUrl.trim() || 'https://placehold.co/640x400/e2e8f0/64748b?text=Machinery',
    createdAt: new Date().toISOString(),
  };
}
