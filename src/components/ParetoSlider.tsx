import React, { useState, useMemo } from 'react';
import { Shield } from 'lucide-react';
import { ConjunctionEvent, ParetoPoint } from '../types';
import { computeParetoFrontier } from '../engine/camPlanner';

interface ParetoSliderProps {
  conjunction: ConjunctionEvent;
  onCommitBurn: (point: ParetoPoint) => void;
}

export const ParetoSlider: React.FC<ParetoSliderProps> = ({ conjunction, onCommitBurn }) => {
  const [sliderIndex, setSliderIndex] = useState(0);
  const paretoPoints = useMemo(() => computeParetoFrontier(conjunction), [conjunction]);

  if (paretoPoints.length === 0) return null;

  const currentPoint = paretoPoints[sliderIndex];

  return (
    <div className="bg-space-800/80 rounded-lg border border-space-700 p-3 mt-2">
      <div className="flex items-center gap-2 mb-2 text-gray-200 font-semibold text-xs uppercase tracking-wider">
        <Shield size={14} className="text-cyan-400" />
        Risk Tolerance Optimizer
      </div>
      
      <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
        <span>10⁻⁵ (Accept)</span>
        <span className="font-mono text-cyan-300 font-bold bg-space-900 px-1.5 py-0.5 rounded">
          {currentPoint.riskTolerance.toExponential(1)}
        </span>
        <span>10⁻⁸ (Strict)</span>
      </div>

      <input 
        type="range" 
        min={0} 
        max={paretoPoints.length - 1} 
        value={sliderIndex}
        onChange={(e) => setSliderIndex(parseInt(e.target.value))}
        className="w-full accent-cyan-500 mb-3"
      />

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-space-900/60 p-1.5 rounded border border-space-700/50">
          <span className="text-[9px] text-gray-500 block uppercase">ΔV</span>
          <span className="text-xs font-mono font-bold text-white">{currentPoint.deltaV.toFixed(3)} m/s</span>
        </div>
        <div className="bg-space-900/60 p-1.5 rounded border border-space-700/50">
          <span className="text-[9px] text-gray-500 block uppercase">Fuel</span>
          <span className="text-xs font-mono font-bold text-amber-300">{currentPoint.fuelCostGrams.toFixed(0)} g</span>
        </div>
        <div className="bg-space-900/60 p-1.5 rounded border border-space-700/50">
          <span className="text-[9px] text-gray-500 block uppercase">Lifetime</span>
          <span className="text-xs font-mono font-bold text-red-300">-{currentPoint.missionLifetimeLossDays.toFixed(1)} days</span>
        </div>
      </div>

      <button 
        onClick={() => onCommitBurn(currentPoint)}
        className="w-full py-1.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]"
      >
        Commit Burn Vector
      </button>
    </div>
  );
};
