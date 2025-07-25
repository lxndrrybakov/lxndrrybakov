import React, { useState } from 'react';
import { Modal } from './Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ModalProps } from '../../types';
import { ADMIN_PASSWORD } from '../../constants';

interface ConfirmationModalProps extends ModalProps {
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, title, message, onConfirm, confirmText = 'Подтвердить' }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (password === ADMIN_PASSWORD) {
      setError('');
      onConfirm();
      onClose();
    } else {
      setError('Неверный пароль');
    }
  };

  const handleClose = () => {
      setPassword('');
      setError('');
      onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <div className="text-gray-700 dark:text-gray-300">{message}</div>
        <Input
          label="Введите пароль для подтверждения"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={handleClose}>Отмена</Button>
          <Button variant="danger" onClick={handleConfirm}>{confirmText}</Button>
        </div>
      </div>
    </Modal>
  );
};