import React from 'react';
import { PVM, PVMStatus } from '../types';
import { MachineCard } from './MachineCard';
import { Server, Warehouse, Wrench } from 'lucide-react';

interface MachineGridProps {
  machines: PVM[];
  onMove: (pvm: PVM) => void;
  onDelete: (pvm: PVM) => void;
  onAddRun: (pvm: PVM) => void;
}

const StatusColumn: React.FC<{ title: string; machines: PVM[]; icon: React.ReactNode; children: React.ReactNode }> = ({ title, machines, icon, children }) => (
    <div className="bg-gray-100 dark:bg-gray-900/50 rounded-xl flex-1 min-w-[300px]">
        <div className="sticky top-[88px] bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm py-3 px-4 z-10 rounded-t-xl border-b-2 border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white flex items-center justify-center gap-3">
                {icon}
                {title}
                <span className="bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full">{machines.length}</span>
            </h2>
        </div>
        <div className="p-4 space-y-4 h-full overflow-y-auto">
            {children}
        </div>
    </div>
);

export const MachineGrid: React.FC<MachineGridProps> = ({ machines, onMove, onDelete, onAddRun }) => {
  const inOperation = machines.filter(pvm => pvm.status === PVMStatus.InOperation);
  const inStock = machines.filter(pvm => pvm.status === PVMStatus.InStock);
  const inRepair = machines.filter(pvm => pvm.status === PVMStatus.InRepair);

  return (
    <main className="pt-[100px] pb-12 px-4 h-screen">
        <div className="flex gap-6 h-[calc(100vh-148px)]">
            <StatusColumn title="В работе" machines={inOperation} icon={<Server className="text-green-500" />}>
                {inOperation.map(pvm => <MachineCard key={pvm.id} pvm={pvm} onMove={onMove} onDelete={onDelete} onAddRun={onAddRun} />)}
            </StatusColumn>
            <StatusColumn title="На складе" machines={inStock} icon={<Warehouse className="text-yellow-500" />}>
                {inStock.map(pvm => <MachineCard key={pvm.id} pvm={pvm} onMove={onMove} onDelete={onDelete} onAddRun={onAddRun} />)}
            </StatusColumn>
            <StatusColumn title="В ремонте" machines={inRepair} icon={<Wrench className="text-red-500" />}>
                {inRepair.map(pvm => <MachineCard key={pvm.id} pvm={pvm} onMove={onMove} onDelete={onDelete} onAddRun={onAddRun} />)}
            </StatusColumn>
        </div>
    </main>
  );
};