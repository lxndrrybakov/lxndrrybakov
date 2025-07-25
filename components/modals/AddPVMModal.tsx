
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ModalProps } from '../../types';

interface AddPVMModalProps extends ModalProps {
  onAddPVM: (number: string) => void;
}

export const AddPVMModal: React.FC<AddPVMModalProps> = ({ isOpen, onClose, onAddPVM }) => {
  const [pvmNumber, setPvmNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pvmNumber.trim()) {
      onAddPVM(pvmNumber.trim());
      setPvmNumber('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Добавить новый ПВМ">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Номер ПВМ"
          value={pvmNumber}
          onChange={(e) => setPvmNumber(e.target.value)}
          placeholder="Введите уникальный номер"
          required
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary">Добавить</Button>
        </div>
      </form>
    </Modal>
  );
};
