import React, { useState, useEffect } from 'react';
import { PVM, PVMStatus, RunRecord, RunRecordType } from './types';
import { BilletCoefficients } from './constants';
import {
    getPvms,
    createPvm,
    updatePvm,
    deletePvm,
    getRuns,
    createRun,
    deleteRun,
} from './services/apiService';
import Header from './components/Header';
import Footer from './components/Footer';
import { MachineGrid } from './components/MachineGrid';
import { AddRunModal } from './components/modals/AddRunModal';
import { MoveMachineModal } from './components/modals/MoveMachineModal';
import { AddPVMModal } from './components/modals/AddPVMModal';
import { StatsModal } from './components/modals/StatsModal';
import { StreamStatsModal } from './components/modals/StreamStatsModal';
import { AnalyticsModal } from './components/modals/AnalyticsModal';
import { ConfirmationModal } from './components/modals/ConfirmationModal';

const App: React.FC = () => {
    const [pvms, setPvms] = useState<PVM[]>([]);
    const [runs, setRuns] = useState<RunRecord[]>([]);
    
    // Modal states
    const [isAddRunModalOpen, setAddRunModalOpen] = useState(false);
    const [isMoveModalOpen, setMoveModalOpen] = useState(false);
    const [isAddPVMModalOpen, setAddPVMModalOpen] = useState(false);
    const [isStatsModalOpen, setStatsModalOpen] = useState(false);
    const [isStreamStatsModalOpen, setStreamStatsModalOpen] = useState(false);
    const [isAnalyticsModalOpen, setAnalyticsModalOpen] = useState(false);
    const [isDeletePVMConfirmOpen, setDeletePVMConfirmOpen] = useState(false);
    const [isDeleteDataConfirmOpen, setDeleteDataConfirmOpen] = useState(false);

    const [selectedPvm, setSelectedPvm] = useState<PVM | null>(null);
    const [selectedStreamId, setSelectedStreamId] = useState<number | null>(null);
    const [deletePeriod, setDeletePeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [pvmsData, runsData] = await Promise.all([getPvms(), getRuns()]);
                setPvms(pvmsData);
                setRuns(runsData);
            } catch (err) {
                console.error('Failed to load data', err);
            }
        };
        loadData();
    }, []);

    const handleAddRun = async (pvmId: number, billetCount: number, billetSize: 130 | 150, scrap: number) => {
        const mileage = billetCount * BilletCoefficients[billetSize] - scrap;
        if (mileage < 0) {
            alert("Пробег не может быть отрицательным.");
            return;
        }

        const pvm = pvms.find(p => p.id === pvmId);
        if (!pvm) return;

        try {
            const newRun: RunRecord = await createRun({
                pvmId,
                pvmNumber: pvm.number,
                billetCount,
                billetSize,
                scrap,
                mileage,
                date: new Date().toISOString(),
                type: RunRecordType.Run,
                streamId: pvm.streamId,
                id: crypto.randomUUID(),
            });
            setRuns(prev => [...prev, newRun]);

            const updatedPvm: PVM = await updatePvm(pvmId, {
                currentMileage: pvm.currentMileage + mileage,
                totalMileage: pvm.totalMileage + mileage,
            });
            setPvms(prev => prev.map(p => (p.id === updatedPvm.id ? updatedPvm : p)));
        } catch (err) {
            console.error('Failed to add run', err);
        }
    };
    
    const handleMovePVM = async (pvmId: number, newStatus: PVMStatus, streamId?: number) => {
        const pvmToMove = pvms.find(p => p.id === pvmId);
        if (!pvmToMove) return;

        try {
            // If moving to repair, create repair record
            if (newStatus === PVMStatus.InRepair && pvmToMove.currentMileage > 0) {
                const repair = await createRun({
                    id: crypto.randomUUID(),
                    pvmId,
                    pvmNumber: pvmToMove.number,
                    date: new Date().toISOString(),
                    mileage: pvmToMove.currentMileage,
                    type: RunRecordType.Repair,
                    streamId: pvmToMove.streamId,
                });
                setRuns(prev => [...prev, repair]);
            }

            // PVM occupying target stream should be moved to stock
            const occupying = pvms.find(p => p.streamId === streamId);
            if (occupying && occupying.id !== pvmId) {
                const updated = await updatePvm(occupying.id, { status: PVMStatus.InStock, streamId: undefined });
                setPvms(prev => prev.map(p => (p.id === updated.id ? updated : p)));
            }

            const comingFromRepair = pvmToMove.status === PVMStatus.InRepair;
            const updatedPvm = await updatePvm(pvmId, {
                status: newStatus,
                streamId: newStatus === PVMStatus.InOperation ? streamId : undefined,
                currentMileage: newStatus === PVMStatus.InRepair || comingFromRepair ? 0 : pvmToMove.currentMileage,
            });

            setPvms(prev => prev.map(p => (p.id === updatedPvm.id ? updatedPvm : p)));
        } catch (err) {
            console.error('Failed to move PVM', err);
        }
    };

    const handleAddPVM = async (number: string) => {
        if (pvms.some(pvm => pvm.number === number)) {
            alert('ПВМ с таким номером уже существует!');
            return;
        }
        try {
            const created: PVM = await createPvm({
                number,
                status: PVMStatus.InStock,
                currentMileage: 0,
                totalMileage: 0,
                id: Date.now(),
            });
            setPvms(prev => [...prev, created]);
        } catch (err) {
            console.error('Failed to add PVM', err);
        }
    };

    const handleDeletePVM = async () => {
        if (!selectedPvm) return;
        try {
            await deletePvm(selectedPvm.id);
            setPvms(pvms.filter(pvm => pvm.id !== selectedPvm.id));
            setRuns(runs.filter(run => run.pvmId !== selectedPvm.id));
            setSelectedPvm(null);
        } catch (err) {
            console.error('Failed to delete PVM', err);
        }
    };

    const recalculateAllPvmsMileage = (allPvms: PVM[], allRuns: RunRecord[]): PVM[] => {
        return allPvms.map(pvm => {
            const pvmRuns = allRuns.filter(run => run.pvmId === pvm.id);
            const repairRecords = pvmRuns
                .filter(r => r.type === RunRecordType.Repair)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
            const lastRepairDate = repairRecords.length > 0 ? new Date(repairRecords[0].date) : null;
    
            const currentMileage = pvmRuns
                .filter(r => r.type === RunRecordType.Run && (!lastRepairDate || new Date(r.date) > lastRepairDate))
                .reduce((acc, run) => acc + run.mileage, 0);
    
            const totalMileage = pvmRuns
                .filter(r => r.type === RunRecordType.Run)
                .reduce((acc, run) => acc + run.mileage, 0);
    
            return { ...pvm, currentMileage, totalMileage };
        });
    };

    const handleDeleteData = async (period: 'today' | 'week' | 'month' | 'all') => {
        let newRuns: RunRecord[];

        if (period === 'all') {
            newRuns = [];
        } else {
            const now = new Date();
            newRuns = runs.filter(run => {
                const runDate = new Date(run.date);
                if (period === 'today') {
                    return runDate.toDateString() !== now.toDateString();
                }
                if (period === 'week') {
                    const weekAgo = new Date();
                    weekAgo.setDate(now.getDate() - 7);
                    return runDate < weekAgo;
                }
                if (period === 'month') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(now.getMonth() - 1);
                    return runDate < monthAgo;
                }
                return true; 
            });
        }
    
        const updatedPvms = recalculateAllPvmsMileage(pvms, newRuns);

        try {
            const removed = runs.filter(r => !newRuns.includes(r));
            await Promise.all(removed.map(r => deleteRun(r.id)));
            await Promise.all(updatedPvms.map(p => updatePvm(p.id, { currentMileage: p.currentMileage, totalMileage: p.totalMileage })));
            setRuns(newRuns);
            setPvms(updatedPvms);
        } catch (err) {
            console.error('Failed to delete data', err);
        }
    };

    const openAddRunModal = (pvm: PVM) => { setSelectedPvm(pvm); setAddRunModalOpen(true); };
    const openMoveModal = (pvm: PVM) => { setSelectedPvm(pvm); setMoveModalOpen(true); };
    const openDeleteConfirm = (pvm: PVM) => { setSelectedPvm(pvm); setDeletePVMConfirmOpen(true); };
    const openStreamStatsModal = (streamId: number) => { setSelectedStreamId(streamId); setStreamStatsModalOpen(true); };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
            <Header
                onStatsClick={() => setStatsModalOpen(true)}
                onAddPVMClick={() => setAddPVMModalOpen(true)}
                onAnalyticsClick={() => setAnalyticsModalOpen(true)}
            />
            
            <MachineGrid
                machines={pvms}
                onAddRun={openAddRunModal}
                onMove={openMoveModal}
                onDelete={openDeleteConfirm}
            />
            
            <Footer />

            <AddRunModal 
                isOpen={isAddRunModalOpen}
                onClose={() => setAddRunModalOpen(false)}
                pvm={selectedPvm}
                onAddRun={handleAddRun}
            />
            <MoveMachineModal
                isOpen={isMoveModalOpen}
                onClose={() => setMoveModalOpen(false)}
                pvm={selectedPvm}
                onMove={handleMovePVM}
                occupiedStreams={pvms.filter(p => p.streamId).map(p => p.streamId!)}
            />
            <AddPVMModal 
                isOpen={isAddPVMModalOpen}
                onClose={() => setAddPVMModalOpen(false)}
                onAddPVM={handleAddPVM}
            />
            <StatsModal
                isOpen={isStatsModalOpen}
                onClose={() => setStatsModalOpen(false)}
                pvms={pvms}
                runs={runs}
                onOpenStreamStats={openStreamStatsModal}
                onDeleteData={(period) => { setDeletePeriod(period); setDeleteDataConfirmOpen(true); }}
            />
            <StreamStatsModal
                isOpen={isStreamStatsModalOpen}
                onClose={() => setStreamStatsModalOpen(false)}
                streamId={selectedStreamId}
                runs={runs}
            />
             <AnalyticsModal
                isOpen={isAnalyticsModalOpen}
                onClose={() => setAnalyticsModalOpen(false)}
                pvms={pvms}
                runs={runs}
            />
            <ConfirmationModal
                isOpen={isDeletePVMConfirmOpen}
                onClose={() => setDeletePVMConfirmOpen(false)}
                title="Подтверждение удаления"
                message={<p>Вы уверены, что хотите удалить <strong>ПВМ №{selectedPvm?.number}</strong>? Это действие необратимо и удалит всю связанную историю.</p>}
                onConfirm={handleDeletePVM}
            />
            <ConfirmationModal
                isOpen={isDeleteDataConfirmOpen}
                onClose={() => setDeleteDataConfirmOpen(false)}
                title="Подтверждение удаления данных"
                message={<p>Вы уверены, что хотите удалить записи пробегов? Это действие необратимо.</p>}
                onConfirm={() => handleDeleteData(deletePeriod)}
            />
        </div>
    );
};

export default App;