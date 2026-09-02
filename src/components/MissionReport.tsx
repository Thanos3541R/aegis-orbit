import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Download, Copy, X, FileText, CheckCircle } from 'lucide-react';
import { generateCDM } from '../engine/conjunctionEngine';
import { TELEMETRY_CHANNELS } from '../engine/telemetrySimulator';

export const MissionReport: React.FC = () => {
  const { showMissionReport, setShowMissionReport, conjunctions, maneuverResult, currentTelemetry, satellites } = useStore();
  const [copied, setCopied] = useState(false);

  if (!showMissionReport) return null;

  const activeConjunction = conjunctions.length > 0 ? conjunctions[0] : null;
  const cdmData = activeConjunction ? generateCDM(activeConjunction, satellites) : null;
  
  const cdmString = cdmData ? JSON.stringify(cdmData, null, 2) : 'No active conjunctions.';

  const handleCopy = () => {
    navigator.clipboard.writeText(cdmString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([cdmString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CDM_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-space-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMissionReport(false)}>
      <div className="modal-content bg-space-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-space-800/80 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            📋 Mission Report — Conjunction Data Message
          </h2>
          <button onClick={() => setShowMissionReport(false)} className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-space-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-8">
          
          {cdmData && (
            <section>
              <h3 className="text-lg font-medium text-gray-200 mb-4 border-b border-gray-800 pb-2">CDM Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-space-800 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-indigo-400 font-semibold mb-2">Message Info</h4>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-gray-500">Creation Date:</span>
                    <span className="text-gray-200">{String(cdmData.CREATION_DATE)}</span>
                    <span className="text-gray-500">TCA:</span>
                    <span className="text-gray-200 font-mono">{String(cdmData.TCA)}</span>
                    <span className="text-gray-500">Miss Distance:</span>
                    <span className="text-gray-200 font-mono">{String(cdmData.MISS_DISTANCE)}</span>
                    <span className="text-gray-500">Collision Prob:</span>
                    <span className="text-red-400 font-mono">{Number(cdmData.COLLISION_PROBABILITY).toExponential(3)}</span>
                  </div>
                </div>
                
                <div className="bg-space-800 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-indigo-400 font-semibold mb-2">Primary Object</h4>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-gray-500">Name:</span>
                    <span className="text-gray-200">{String((cdmData.OBJECT1 as Record<string,unknown>)?.OBJECT_NAME || 'Unknown')}</span>
                    <span className="text-gray-500">Type:</span>
                    <span className="text-gray-200">{String((cdmData.OBJECT1 as Record<string,unknown>)?.OBJECT_TYPE || 'Unknown')}</span>
                    <span className="text-gray-500">Maneuverable:</span>
                    <span className="text-gray-200">{String((cdmData.OBJECT1 as Record<string,unknown>)?.MANEUVERABLE || 'N/A')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-space-800 p-4 rounded-lg border border-gray-700">
                <h4 className="text-indigo-400 font-semibold mb-2">Raw CDM Data</h4>
                <pre className="text-xs text-gray-300 font-mono overflow-x-auto max-h-48 overflow-y-auto bg-space-900 p-3 rounded">
                  {cdmString}
                </pre>
              </div>
            </section>
          )}

          {maneuverResult && (
            <section>
              <h3 className="text-lg font-medium text-gray-200 mb-4 border-b border-gray-800 pb-2">Post-Maneuver Report</h3>
              <div className="bg-space-800 p-4 rounded-lg border border-emerald-500/20">
                <div className="grid grid-cols-4 gap-4 text-sm text-center">
                  <div>
                    <span className="block text-gray-500 text-xs uppercase mb-1">ΔV Applied</span>
                    <span className="text-gray-200 font-mono text-lg">{maneuverResult.deltaV.toFixed(3)} m/s</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase mb-1">Fuel Used</span>
                    <span className="text-gray-200 font-mono text-lg">{maneuverResult.fuelUsed.toFixed(1)} g</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase mb-1">New Altitude</span>
                    <span className="text-gray-200 font-mono text-lg">{maneuverResult.newAltitude.toFixed(1)} km</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase mb-1">Post-Maneuver Pc</span>
                    <span className="text-emerald-400 font-mono text-lg">{maneuverResult.postManeuverPc.toExponential(2)}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-lg font-medium text-gray-200 mb-4 border-b border-gray-800 pb-2">Telemetry Health Snapshot</h3>
            <div className="grid grid-cols-4 gap-3">
              {TELEMETRY_CHANNELS.map((config) => {
                const val = currentTelemetry ? (currentTelemetry[config.id] as number) : 0;
                let status = 'nominal';
                if (val < config.warningRange[0] || val > config.warningRange[1]) status = 'critical';
                else if (val < config.nominalRange[0] || val > config.nominalRange[1]) status = 'warning';
                
                return (
                  <div key={config.id} className="bg-space-800 p-3 rounded border border-gray-700 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-400">{config.label}</div>
                      <div className="text-sm font-mono text-gray-100">{val.toFixed(2)} {config.unit}</div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${status === 'nominal' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        <div className="p-4 border-t border-gray-800 bg-space-800/50 rounded-b-xl flex justify-end gap-3">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-space-700 hover:bg-space-600 text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CDM as JSON
          </button>
        </div>
      </div>
    </div>
  );
};
