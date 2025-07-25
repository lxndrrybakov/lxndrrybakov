import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ label, children, className, id, ...props }) => {
  const baseClasses = "w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <select id={id} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
};