import { RunRecord, RunRecordType, PVM, PVMStatus, StreamAnalytics } from '../types';
import { TOTAL_STREAMS } from '../constants';

// This file simulates analytics that could be performed by a more complex backend or TensorFlow.js model.
// For now, it uses statistical calculations.

export const calculateStreamAnalytics = (runs: RunRecord[], pvms: PVM[]): StreamAnalytics[] => {
    const analytics: StreamAnalytics[] = [];

    for (let i = 1; i <= TOTAL_STREAMS; i++) {
        const streamId = i;

        // Filter runs specific to this stream
        const runsForStream = runs.filter(run => run.streamId === streamId);

        const repairRecordsForStream = runsForStream.filter(
            run => run.type === RunRecordType.Repair
        );
        
        const repairMileages = repairRecordsForStream.map(r => r.mileage).filter(m => m > 0);
        
        let avgMileageToRepair = 0;
        if (repairMileages.length > 0) {
            avgMileageToRepair = repairMileages.reduce((a, b) => a + b, 0) / repairMileages.length;
        }

        const pvmOnStream = pvms.find(pvm => pvm.status === PVMStatus.InOperation && pvm.streamId === streamId);
        
        let predictedMileageToNextRepair = 0;
        if (pvmOnStream && avgMileageToRepair > 0) {
            predictedMileageToNextRepair = avgMileageToRepair - pvmOnStream.currentMileage;
        } else if (avgMileageToRepair > 0) {
            predictedMileageToNextRepair = avgMileageToRepair;
        }

        // Reliability is calculated based on the consistency of repair intervals (lower variance = higher reliability).
        let reliability = 0;
        if (repairMileages.length > 1 && avgMileageToRepair > 0) {
            const variance = repairMileages.map(x => Math.pow(x - avgMileageToRepair, 2)).reduce((a, b) => a + b, 0) / repairMileages.length;
            const stdDev = Math.sqrt(variance);
            // Normalize standard deviation to a 0-1 reliability score.
            // A lower std dev relative to the mean is better.
            reliability = Math.max(0, 1 - (stdDev / avgMileageToRepair));
        } else if (repairMileages.length > 0) {
            reliability = 0.5; // Not enough data for variance, give a neutral score.
        }

        analytics.push({
            streamId,
            avgMileageToRepair,
            predictedMileageToNextRepair: Math.max(0, predictedMileageToNextRepair),
            reliability,
        });
    }

    return analytics;
};