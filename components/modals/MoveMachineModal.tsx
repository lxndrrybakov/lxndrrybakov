import React, { useState } from 'react';
import { Modal } from './Modal';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { PVM, PVMStatus } from '../../types';
import { ModalProps } from '../../types';
import { TOTAL_STREAMS } from '../../constants';

interface MoveMachineModalProps extends ModalProps {
  pvm: PVM | null;
  occupiedStreams: number[];
  onMove: (pvmId: number, newStatus: PVMStatus, streamId?: number) => void;
}

export const MoveMachineModal: React.FC<MoveMachineModalProps> = ({ isOpen, onClose, pvm, onMove, occupiedStreams }) => {
  const [showStreamSelect, setShowStreamSelect] = useState(false);
  const [selectedStream, setSelectedStream] = useState('');

  if (!pvm) return null;

  const handleMoveToOperation = () => {
    if (!showStreamSelect) {
      setShowStreamSelect(true);
    } else if(selectedStream) {
      onMove(pvm.id, PVMStatus.InOperation, parseInt(selectedStream));
      resetAndClose();
    }
  };
  
  const handleMoveToStock = () => {
    onMove(pvm.id, PVMStatus.InStock);
    resetAndClose();
  };

  const handleMoveToRepair = () => {
    onMove(pvm.id, PVMStatus.InRepair);
    resetAndClose();
  };
  
  const resetAndClose = () => {
      setShowStreamSelect(false);
      setSelectedStream('');
      onClose();
  }

  const allStreams = Array.from({ length: TOTAL_STREAMS }, (_, i) => i + 1);

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={`Переместить ПВМ №${pvm.number}`}>
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">Выберите новое состояние для ПВМ.</p>
        <div className="flex flex-col space-y-3">
          <Button variant="success" onClick={handleMoveToOperation} disabled={pvm.status === PVMStatus.InOperation}>
            Вернуть в работу
          </Button>

          {showStreamSelect && (
             <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                 <Select 
                    label="Выберите ручей" 
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                 >
                    <option value="" disabled>-- Выберите номер ручья --</option>
                    {allStreams.map(s => {
                      const isOccupied = occupiedStreams.includes(s) && s !== pvm?.streamId;
                      return (
                        <option key={s} value={s}>
                          Ручей №{s} {isOccupied ? '(Занят)' : ''}
                        </option>
                      )
                    })}
                 </Select>
             </div>
          )}

          <Button variant="warning" onClick={handleMoveToStock} disabled={pvm.status === PVMStatus.InStock}>
            Переместить на склад
          </Button>
          <Button variant="danger" onClick={handleMoveToRepair} disabled={pvm.status === PVMStatus.InRepair}>
            Отправить в ремонт
          </Button>
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={resetAndClose}>Отмена</Button>
        </div>
      </div>
    </Modal>
  );
};