import React, { useState, useEffect } from 'react';
import { PVM, PVMStatus, RunRecord, RunRecordType } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BilletCoefficients, INITIAL_PVM_COUNT } from './constants';
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
    const [pvms, setPvms] = useLocalStorage<PVM[]>('pvms_data', []);
    const [runs, setRuns] = useLocalStorage<RunRecord[]>('runs_data', []);
    
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
        if (pvms.length === 0) {
            const initialPvms: PVM[] = Array.from({ length: INITIAL_PVM_COUNT }, (_, i) => ({
                id: Date.now() + i,
                number: String(i + 1),
                status: i < 6 ? PVMStatus.InOperation : PVMStatus.InStock,
                currentMileage: 0,
                totalMileage: 0,
                streamId: i < 6 ? i + 1 : undefined,
            }));
            setPvms(initialPvms);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddRun = (pvmId: number, billetCount: number, billetSize: 130 | 150, scrap: number) => {
        const mileage = billetCount * BilletCoefficients[billetSize] - scrap;
        if (mileage < 0) {
            alert("Пробег не может быть отрицательным.");
            return;
        }

        setPvms(prev => prev.map(pvm => 
            pvm.id === pvmId
            ? { ...pvm, currentMileage: pvm.currentMileage + mileage, totalMileage: pvm.totalMileage + mileage }
            : pvm
        ));

        const pvm = pvms.find(p => p.id === pvmId);
        if (pvm) {
            const newRun: RunRecord = {
                id: crypto.randomUUID(),
                pvmId,
                pvmNumber: pvm.number,
                date: new Date().toISOString(),
                billetCount,
                billetSize,
                scrap,
                mileage,
                type: RunRecordType.Run,
                streamId: pvm.streamId,
            };
            setRuns(prev => [...prev, newRun]);
        }
    };
    
    const handleMovePVM = (pvmId: number, newStatus: PVMStatus, streamId?: number) => {
        const pvmToMove = pvms.find(p => p.id === pvmId);
        if(!pvmToMove) return;

        // Create repair record if moving to repair
        if (newStatus === PVMStatus.InRepair && pvmToMove.currentMileage > 0) {
            const repairRecord: RunRecord = {
                id: crypto.randomUUID(),
                pvmId,
                pvmNumber: pvmToMove.number,
                date: new Date().toISOString(),
                mileage: pvmToMove.currentMileage,
                type: RunRecordType.Repair,
                streamId: pvmToMove.streamId,
            };
            setRuns(prev => [...prev, repairRecord]);
        }

        setPvms(prev => {
             // If we are moving a PVM to an already occupied stream, the currently occupying PVM must be moved to stock.
            const pvmOnTargetStream = prev.find(p => p.streamId === streamId);
            
            return prev.map(pvm => {
                // The PVM we are explicitly moving
                if (pvm.id === pvmId) {
                    const comingFromRepair = pvm.status === PVMStatus.InRepair;
                    return {
                        ...pvm,
                        status: newStatus,
                        streamId: newStatus === PVMStatus.InOperation ? streamId : undefined,
                        // Reset current mileage when moving TO repair, or when coming FROM repair back to stock/operation
                        currentMileage: newStatus === PVMStatus.InRepair || comingFromRepair ? 0 : pvm.currentMileage,
                    };
                }
                // The PVM that was on the target stream (if any)
                if (pvmOnTargetStream && pvm.id === pvmOnTargetStream.id) {
                    return { ...pvm, status: PVMStatus.InStock, streamId: undefined };
                }
                return pvm;
            })
        });
    };

    const handleAddPVM = (number: string) => {
        if (pvms.some(pvm => pvm.number === number)) {
            alert('ПВМ с таким номером уже существует!');
            return;
        }
        const newPvm: PVM = {
            id: Date.now(),
            number,
            status: PVMStatus.InStock,
            currentMileage: 0,
            totalMileage: 0,
        };
        setPvms(prev => [...prev, newPvm]);
    };

    const handleDeletePVM = () => {
        if (selectedPvm) {
            setPvms(pvms.filter(pvm => pvm.id !== selectedPvm.id));
            setRuns(runs.filter(run => run.pvmId !== selectedPvm.id)); // Also remove associated runs
            setSelectedPvm(null);
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

    const handleDeleteData = (period: 'today' | 'week' | 'month' | 'all') => {
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
    
        setRuns(newRuns);
        setPvms(updatedPvms);
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