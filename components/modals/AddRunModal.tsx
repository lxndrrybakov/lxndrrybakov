import React, { useState } from 'react';
import { Modal } from './Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { PVM } from '../../types';
import { ModalProps } from '../../types';
import { BilletCoefficients } from '../../constants';

interface AddRunModalProps extends ModalProps {
  pvm: PVM | null;
  onAddRun: (pvmId: number, billetCount: number, billetSize: 130 | 150, scrap: number) => void;
}

export const AddRunModal: React.FC<AddRunModalProps> = ({ isOpen, onClose, pvm, onAddRun }) => {
  const [billetCount, setBilletCount] = useState('');
  const [billetSize, setBilletSize] = useState<'130' | '150'>('130');
  const [scrap, setScrap] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pvm && billetCount && scrap) {
      onAddRun(pvm.id, parseInt(billetCount), parseInt(billetSize) as 130 | 150, parseFloat(scrap));
      setBilletCount('');
      setBilletSize('130');
      setScrap('');
      onClose();
    }
  };

  if (!pvm) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Добавить пробег - ПВМ №${pvm.number}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Количество заготовок"
          type="number"
          value={billetCount}
          onChange={(e) => setBilletCount(e.target.value)}
          placeholder="0"
          min="0"
          required
        />
        <Select
          label="Размер заготовки (мм)"
          value={billetSize}
          onChange={(e) => setBilletSize(e.target.value as '130' | '150')}
        >
          <option value="130">130</option>
          <option value="150">150</option>
        </Select>
        <Input
          label="Технический брак (т)"
          type="number"
          step="0.01"
          value={scrap}
          onChange={(e) => setScrap(e.target.value)}
          placeholder="0.00"
          min="0"
          required
        />
        <div className="pt-2 text-gray-500 dark:text-gray-400">
            Расчетный пробег: {billetCount && scrap ? ((parseInt(billetCount) * BilletCoefficients[parseInt(billetSize) as 130 | 150]) - parseFloat(scrap)).toFixed(2) + ' т.' : '0.00 т.'}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary">Добавить</Button>
        </div>
      </form>
    </Modal>
  );
};