import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PVM, RunRecord, RunRecordType, ModalProps } from '../../types';
import { exportToCSV } from '../../services/csvExportService';
import { Download, Trash2, Wrench, Tally4, BarChart2 } from 'lucide-react';
import { TOTAL_STREAMS } from '../../constants';

interface StatsModalProps extends ModalProps {
    pvms: PVM[];
    runs: RunRecord[];
    onOpenStreamStats: (streamId: number) => void;
    onDeleteData: (period: 'today' | 'week' | 'month' | 'all') => void;
}

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <Card className="flex-1 text-center !bg-gray-100 dark:!bg-gray-800 border-gray-300 dark:border-gray-700">
        <div className="flex justify-center text-indigo-500 dark:text-indigo-400 mb-2">{icon}</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </Card>
);

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, pvms, runs, onOpenStreamStats, onDeleteData }) => {
  const [pvmFilter, setPvmFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePeriod, setDeletePeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const filteredRuns = useMemo(() => {
    const now = new Date();
    return runs.filter(run => {
        const pvmMatch = pvmFilter === 'all' || run.pvmId === parseInt(pvmFilter);
        
        const runDate = new Date(run.date);
        let timeMatch = false;
        if (timeFilter === 'all') {
            timeMatch = true;
        } else if (timeFilter === 'today') {
            timeMatch = runDate.toDateString() === now.toDateString();
        } else if (timeFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            timeMatch = runDate >= weekAgo;
        } else if (timeFilter === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            timeMatch = runDate >= monthAgo;
        }
        return pvmMatch && timeMatch;
    });
  }, [runs, pvmFilter, timeFilter]);

  const runRecords = filteredRuns.filter(r => r.type === RunRecordType.Run);
  const repairRecords = filteredRuns.filter(r => r.type === RunRecordType.Repair);
  
  const avgMileageToRepair = repairRecords.length > 0
    ? (repairRecords.reduce((acc, r) => acc + r.mileage, 0) / repairRecords.length).toFixed(0)
    : 'N/A';

  const handleDeleteClick = () => {
    onDeleteData(deletePeriod);
    setShowDeleteConfirm(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Статистика ПВМ" size="full">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <Select label="Фильтр по ПВМ" value={pvmFilter} onChange={e => setPvmFilter(e.target.value)}>
                <option value="all">Все ПВМ</option>
                {pvms.map(pvm => <option key={pvm.id} value={pvm.id}>ПВМ №{pvm.number}</option>)}
            </Select>
            <Select label="Фильтр по времени" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
                <option value="all">Все время</option>
                <option value="today">Сегодня</option>
                <option value="week">За неделю</option>
                <option value="month">За месяц</option>
            </Select>
            <div className="md:col-span-2 flex justify-end gap-2 pt-6">
                <Button onClick={() => exportToCSV(filteredRuns, 'pvm_stats')} icon={<Download size={16}/>}>Экспорт</Button>
                <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} icon={<Trash2 size={16}/>}>Удалить данные</Button>
            </div>
        </div>

        {showDeleteConfirm && (
            <Card className="bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700">
                <h4 className="font-bold text-lg mb-2 text-red-800 dark:text-red-200">Подтвердите удаление</h4>
                <p className="text-red-700 dark:text-red-200 mb-4">Вы уверены, что хотите удалить записи?</p>
                <div className="flex items-center gap-4">
                    <Select value={deletePeriod} onChange={(e) => setDeletePeriod(e.target.value as any)}>
                        <option value="today">За сегодня</option>
                        <option value="week">За неделю</option>
                        <option value="month">За месяц</option>
                        <option value="all">Все данные</option>
                    </Select>
                    <Button variant="danger" onClick={handleDeleteClick}>Удалить</Button>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Отмена</Button>
                </div>
            </Card>
        )}

        <div className="flex flex-col md:flex-row gap-4">
            <StatCard title="Всего записей пробегов" value={runRecords.length} icon={<Tally4 size={32}/>} />
            <StatCard title="Всего ремонтов" value={repairRecords.length} icon={<Wrench size={32}/>} />
            <StatCard title="Средний пробег до ремонта" value={`${avgMileageToRepair} т.`} icon={<BarChart2 size={32}/>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Пробеги за плавку</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-200 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Дата</th>
                                <th className="px-4 py-2">ПВМ №</th>
                                <th className="px-4 py-2">Размер</th>
                                <th className="px-4 py-2">Кол-во</th>
                                <th className="px-4 py-2">Обрезь</th>
                                <th className="px-4 py-2">Пробег</th>
                            </tr>
                        </thead>
                        <tbody>
                           {runRecords.map(run => (
                             <tr key={run.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-800">
                                <td className="px-4 py-2">{new Date(run.date).toLocaleString('ru-RU')}</td>
                                <td className="px-4 py-2">{run.pvmNumber}</td>
                                <td className="px-4 py-2">{run.billetSize}</td>
                                <td className="px-4 py-2">{run.billetCount}</td>
                                <td className="px-4 py-2">{run.scrap?.toFixed(2)}</td>
                                <td className="px-4 py-2 font-semibold text-cyan-600 dark:text-cyan-400">{run.mileage.toFixed(2)} т.</td>
                             </tr>
                           ))}
                        </tbody>
                    </table>
                     {runRecords.length === 0 && <p className="p-4 text-center text-gray-500">Нет записей</p>}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Записи о ремонтах</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-200 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Дата</th>
                                <th className="px-4 py-2">ПВМ №</th>
                                <th className="px-4 py-2">Пробег до ремонта</th>
                            </tr>
                        </thead>
                        <tbody>
                           {repairRecords.map(run => (
                             <tr key={run.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-800">
                                <td className="px-4 py-2">{new Date(run.date).toLocaleString('ru-RU')}</td>
                                <td className="px-4 py-2">{run.pvmNumber}</td>
                                <td className="px-4 py-2 font-semibold text-red-500 dark:text-red-400">{run.mileage.toFixed(2)} т.</td>
                             </tr>
                           ))}
                        </tbody>
                    </table>
                     {repairRecords.length === 0 && <p className="p-4 text-center text-gray-500">Нет записей</p>}
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Статистика по ручьям</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({length: TOTAL_STREAMS}, (_, i) => i+1).map(streamId => (
                    <Button key={streamId} variant="secondary" onClick={() => onOpenStreamStats(streamId)}>
                        Ручей №{streamId}
                    </Button>
                ))}
            </div>
        </div>

      </div>
    </Modal>
  );
};