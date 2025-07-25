import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RunRecord, RunRecordType, ModalProps } from '../../types';
import { exportToCSV } from '../../services/csvExportService';
import { Download, Wrench, Tally4 } from 'lucide-react';

interface StreamStatsModalProps extends ModalProps {
  streamId: number | null;
  runs: RunRecord[];
}

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <Card className="flex-1 text-center !bg-gray-100 dark:!bg-gray-800 border-gray-300 dark:border-gray-700">
        <div className="flex justify-center text-indigo-500 dark:text-indigo-400 mb-2">{icon}</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </Card>
);

export const StreamStatsModal: React.FC<StreamStatsModalProps> = ({ isOpen, onClose, streamId, runs }) => {
  const [timeFilter, setTimeFilter] = useState('all');

  const filteredRuns = useMemo(() => {
    if (!streamId) return [];

    // Filter by streamId FIRST
    const streamRuns = runs.filter(run => run.streamId === streamId);

    // Then filter by time
    return streamRuns.filter(run => {
        const runDate = new Date(run.date);
        if (timeFilter === 'all') {
            return true;
        }
        
        const now = new Date(); // Use a fresh `now` for each check
        if (timeFilter === 'today') {
            return runDate.toDateString() === now.toDateString();
        }
        if (timeFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return runDate >= weekAgo;
        }
        if (timeFilter === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return runDate >= monthAgo;
        }
        return true;
    });
  }, [runs, timeFilter, streamId]);
  
  const repairRecords = filteredRuns.filter(r => r.type === RunRecordType.Repair);
  const avgMileageToRepair = repairRecords.length > 0
    ? (repairRecords.reduce((acc, r) => acc + r.mileage, 0) / repairRecords.length).toFixed(0)
    : 'N/A';


  if (!streamId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Статистика ручья №${streamId}`} size="xl">
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} className="w-1/3">
                    <option value="all">Все время</option>
                    <option value="today">Сегодня</option>
                    <option value="week">За неделю</option>
                    <option value="month">За месяц</option>
                </Select>
                <Button onClick={() => exportToCSV(filteredRuns, `stream_${streamId}_stats`)} icon={<Download size={16}/>}>
                    Экспорт
                </Button>
            </div>
            
            <div className="flex gap-4">
                <StatCard title="Всего записей" value={filteredRuns.length} icon={<Tally4 size={28}/>}/>
                <StatCard title="Всего ремонтов" value={repairRecords.length} icon={<Wrench size={28}/>}/>
                <StatCard title="Средний пробег до ремонта" value={`${avgMileageToRepair} т.`} icon={<Wrench size={28}/>}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">История ремонтов</h3>
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
                        {repairRecords.length === 0 && <p className="p-4 text-center text-gray-500">Нет данных о ремонтах</p>}
                    </div>
                </div>

                 <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Все записи</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                           <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-200 dark:bg-gray-700 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Дата</th>
                                    <th className="px-4 py-2">ПВМ №</th>
                                    <th className="px-4 py-2">Тип</th>
                                    <th className="px-4 py-2">Пробег</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRuns.map(run => (
                                    <tr key={run.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-800">
                                        <td className="px-4 py-2">{new Date(run.date).toLocaleString('ru-RU')}</td>
                                        <td className="px-4 py-2">{run.pvmNumber}</td>
                                        <td className={`px-4 py-2 font-semibold ${run.type === RunRecordType.Repair ? 'text-red-500 dark:text-red-400' : 'text-cyan-600 dark:text-cyan-400'}`}>{run.type}</td>
                                        <td className="px-4 py-2">{run.mileage.toFixed(2)} т.</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredRuns.length === 0 && <p className="p-4 text-center text-gray-500">Нет записей</p>}
                    </div>
                </div>
            </div>
        </div>
    </Modal>
  );
};