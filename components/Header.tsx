import React from 'react';
import { BarChart, Plus, Brain } from 'lucide-react';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
    onStatsClick: () => void;
    onAddPVMClick: () => void;
    onAnalyticsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onStatsClick, onAddPVMClick, onAnalyticsClick }) => {
  const currentTime = useCurrentTime();
  const formattedDate = currentTime.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = currentTime.toLocaleTimeString('ru-RU');

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center">
        {/* The SVG logo works well on both themes, no change needed. For different logos, conditional rendering would be used. */}
        <img src="https://www.qarmet.kz/local/templates/qarmet/images/logo-text-white.svg" alt="Qarmet Logo" className="h-8 mr-4"/>
      </div>
      <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
        Учёт пробегов ПВМ МНЛЗ 3
      </h1>
      <div className="flex items-center space-x-4">
        <div className="text-right hidden md:block">
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">{formattedDate}</div>
          <div className="text-lg font-mono text-gray-800 dark:text-gray-100">{formattedTime}</div>
        </div>
         <div className="flex items-center space-x-1">
            <ThemeToggle />
            <button onClick={onStatsClick} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Статистика">
                <BarChart size={22}/>
            </button>
            <button onClick={onAddPVMClick} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Добавить ПВМ">
                <Plus size={22}/>
            </button>
            <button onClick={onAnalyticsClick} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" title="Анализ данных">
                <Brain size={22}/>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;