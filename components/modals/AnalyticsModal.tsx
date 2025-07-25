import React, { useMemo } from 'react';
import { Modal } from './Modal';
import { Card } from '../ui/Card';
import { PVM, RunRecord, StreamAnalytics, ModalProps } from '../../types';
import { calculateStreamAnalytics } from '../../services/analyticsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface AnalyticsModalProps extends ModalProps {
    runs: RunRecord[];
    pvms: PVM[];
}

const getReliabilityInfo = (reliability: number) => {
    if (reliability > 0.85) return { text: "Стабильная работа. Интервалы между ремонтами предсказуемы.", color: "text-green-600 dark:text-green-400" };
    if (reliability > 0.6) return { text: "Требуется внимание. Наблюдается некоторый разброс в пробегах до ремонта.", color: "text-yellow-600 dark:text-yellow-400" };
    return { text: "Рекомендуется проверка. Значительный разброс в пробегах, что указывает на нестабильную работу.", color: "text-red-600 dark:text-red-400" };
};

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, runs, pvms }) => {
    const { theme } = useTheme();
    const analyticsData = useMemo(() => calculateStreamAnalytics(runs, pvms), [runs, pvms]);

    const chartData = analyticsData.map(data => ({
        name: `Ручей ${data.streamId}`,
        'Средний пробег до ремонта': data.avgMileageToRepair,
        'Прогноз до след. ремонта': data.predictedMileageToNextRepair,
    }));
    
    const generalConclusions = useMemo(() => {
        if (analyticsData.length === 0 || analyticsData.every(d => d.avgMileageToRepair === 0)) {
            return { mostStable: 'N/A', highestMileage: 'N/A', inspectionOrder: 'N/A' };
        }
        const mostStable = analyticsData.reduce((prev, current) => (prev.reliability > current.reliability) ? prev : current);
        const highestMileage = analyticsData.reduce((prev, current) => (prev.avgMileageToRepair > current.avgMileageToRepair) ? prev : current);
        const inspectionOrder = [...analyticsData].sort((a, b) => a.reliability - b.reliability).map(d => `Ручей ${d.streamId}`).join(' -> ');
        
        return {
            mostStable: `Ручей ${mostStable.streamId} (${(mostStable.reliability * 100).toFixed(0)}%)`,
            highestMileage: `Ручей ${highestMileage.streamId} (${highestMileage.avgMileageToRepair.toFixed(0)} т.)`,
            inspectionOrder
        };
    }, [analyticsData]);

    const themeColors = {
        dark: {
            grid: '#4a5568',
            axis: '#9ca3af',
            tooltipBg: '#1f2937',
            tooltipBorder: '#4a5568',
        },
        light: {
            grid: '#e2e8f0',
            axis: '#4b5563',
            tooltipBg: '#ffffff',
            tooltipBorder: '#e2e8f0',
        }
    }
    const currentThemeColors = theme === 'dark' ? themeColors.dark : themeColors.light;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Анализ данных ПВМ" size="full">
            <div className="space-y-6">
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-gray-100">Пробеги и прогнозы по ручьям</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={currentThemeColors.grid} />
                            <XAxis dataKey="name" stroke={currentThemeColors.axis} />
                            <YAxis stroke={currentThemeColors.axis}>
                               <Label value="Пробег (т)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: currentThemeColors.axis }} />
                            </YAxis>
                            <Tooltip contentStyle={{ backgroundColor: currentThemeColors.tooltipBg, border: `1px solid ${currentThemeColors.tooltipBorder}` }} />
                            <Legend />
                            <Line type="monotone" dataKey="Средний пробег до ремонта" stroke="#8884d8" activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="Прогноз до след. ремонта" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <h4 className="font-bold text-center text-gray-800 dark:text-gray-100">Наиболее стабильный ручей</h4>
                        <p className="text-2xl text-center font-mono text-green-600 dark:text-green-400">{generalConclusions.mostStable}</p>
                    </Card>
                     <Card>
                        <h4 className="font-bold text-center text-gray-800 dark:text-gray-100">Ручей с наибольшим средним пробегом</h4>
                        <p className="text-2xl text-center font-mono text-cyan-600 dark:text-cyan-400">{generalConclusions.highestMileage}</p>
                    </Card>
                     <Card className="md:col-span-2 lg:col-span-1">
                        <h4 className="font-bold text-center text-gray-800 dark:text-gray-100">Рекомендуемый порядок проверки</h4>
                        <p className="text-lg text-center font-mono text-yellow-600 dark:text-yellow-400">{generalConclusions.inspectionOrder}</p>
                    </Card>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Рекомендации по ручьям</h3>
                    <div className="space-y-4">
                        {analyticsData.map(data => {
                            const reliabilityInfo = getReliabilityInfo(data.reliability);
                            return (
                                <Card key={data.streamId} className="border-l-4 border-indigo-500">
                                    <h4 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">Ручей №{data.streamId}</h4>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Средний пробег до ремонта</p>
                                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{data.avgMileageToRepair.toFixed(0)} т.</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Прогноз до след. ремонта</p>
                                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{data.predictedMileageToNextRepair.toFixed(0)} т.</p>
                                        </div>
                                         <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Надежность</p>
                                            <p className={`text-lg font-semibold ${reliabilityInfo.color}`}>{(data.reliability * 100).toFixed(0)}%</p>
                                        </div>
                                    </div>
                                    <p className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="font-semibold">Вывод: </span>{reliabilityInfo.text}
                                    </p>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
};