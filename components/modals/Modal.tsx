import React from 'react';
import { X } from 'lucide-react';
import { ModalProps } from '../../types';

interface GenericModalProps extends ModalProps {
  children: React.ReactNode;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<GenericModalProps> = ({ isOpen, onClose, children, title, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-3xl',
    full: 'max-w-7xl'
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-75 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};