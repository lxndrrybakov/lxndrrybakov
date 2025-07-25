import React from 'react';
import { PVM, PVMStatus } from '../types';
import { MILEAGE_WARNING_THRESHOLD, MILEAGE_CRITICAL_THRESHOLD, PVM_IMAGE_BASE64 } from '../constants';
import { ArrowRightLeft, Trash2, Plus } from 'lucide-react';

interface MachineCardProps {
  pvm: PVM;
  onMove: (pvm: PVM) => void;
  onDelete: (pvm: PVM) => void;
  onAddRun: (pvm: PVM) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ pvm, onMove, onDelete, onAddRun }) => {
  const getBackgroundColor = () => {
    if (pvm.currentMileage >= MILEAGE_CRITICAL_THRESHOLD) {
      return 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/70';
    }
    if (pvm.currentMileage >= MILEAGE_WARNING_THRESHOLD) {
      return 'bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/70';
    }
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80';
  };

  return (
    <div className={`group relative rounded-lg shadow-lg border-2 p-4 transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${getBackgroundColor()}`}>
      <div className="bg-white rounded-md p-1 mb-3">
        <img src={PVM_IMAGE_BASE64} alt="ПВМ" className="w-full h-24 object-contain" />
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">ПВМ №{pvm.number}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Текущий пробег</p>
        <p className="text-xl font-semibold text-cyan-600 dark:text-cyan-400 mb-2">{pvm.currentMileage.toFixed(2)} т.</p>
        {pvm.status === PVMStatus.InOperation && (
          <div className="bg-green-600 text-white text-xs font-bold rounded-full px-3 py-1 inline-block">
            Ручей №{pvm.streamId}
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onMove(pvm)} className="p-2 bg-gray-900 bg-opacity-60 rounded-full text-gray-300 hover:text-white hover:bg-indigo-600" title="Переместить">
          <ArrowRightLeft size={16} />
        </button>
        <button onClick={() => onDelete(pvm)} className="p-2 bg-gray-900 bg-opacity-60 rounded-full text-gray-300 hover:text-white hover:bg-red-600" title="Удалить">
          <Trash2 size={16} />
        </button>
      </div>

      {pvm.status === PVMStatus.InOperation && (
        <button 
          onClick={() => onAddRun(pvm)}
          className="absolute bottom-2 right-2 p-2 bg-green-600 bg-opacity-80 rounded-full text-white hover:bg-green-500 transform transition-transform group-hover:scale-110"
          title="Добавить пробег"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
};