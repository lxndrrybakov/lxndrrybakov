
export enum PVMStatus {
  InOperation = 'В работе',
  InStock = 'На складе',
  InRepair = 'В ремонте',
}

export interface PVM {
  id: number;
  number: string;
  status: PVMStatus;
  currentMileage: number;
  totalMileage: number;
  streamId?: number;
}

export enum RunRecordType {
    Run = 'Пробег',
    Repair = 'Ремонт'
}

export interface RunRecord {
  id: string;
  pvmId: number;
  pvmNumber: string;
  date: string;
  billetCount?: number;
  billetSize?: 130 | 150;
  scrap?: number;
  mileage: number;
  type: RunRecordType;
  streamId?: number;
}

export interface StreamAnalytics {
    streamId: number;
    avgMileageToRepair: number;
    predictedMileageToNextRepair: number;
    reliability: number;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}