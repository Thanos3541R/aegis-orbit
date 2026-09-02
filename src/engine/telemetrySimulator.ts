import { TelemetryChannel, TelemetrySample, ScenarioId, AnomalyEvent } from '../types';

export const TELEMETRY_CHANNELS: TelemetryChannel[] = [
  { id: 'wheelSpeed1', key: 'wheelSpeed1', name: 'Wheel 1 Speed', label: 'Wheel 1 Speed', unit: 'RPM', nominalRange: [2800, 3200], warningRange: [2500, 3500], color: '#10B981' },
  { id: 'wheelSpeed2', key: 'wheelSpeed2', name: 'Wheel 2 Speed', label: 'Wheel 2 Speed', unit: 'RPM', nominalRange: [2800, 3200], warningRange: [2500, 3500], color: '#06B6D4' },
  { id: 'wheelSpeed3', key: 'wheelSpeed3', name: 'Wheel 3 Speed', label: 'Wheel 3 Speed', unit: 'RPM', nominalRange: [2800, 3200], warningRange: [2500, 3500], color: '#8B5CF6' },
  { id: 'busVoltage', key: 'busVoltage', name: 'Bus Voltage', label: 'Bus Voltage', unit: 'V', nominalRange: [27.5, 28.5], warningRange: [26.0, 30.0], color: '#F59E0B' },
  { id: 'solarCurrent', key: 'solarCurrent', name: 'Solar Current', label: 'Solar Current', unit: 'A', nominalRange: [4.5, 5.5], warningRange: [3.5, 6.5], color: '#3B82F6' },
  { id: 'batterySoc', key: 'batterySoc', name: 'Battery SoC', label: 'Battery SoC', unit: '%', nominalRange: [75, 95], warningRange: [60, 100], color: '#10B981' },
  { id: 'fuelMass', key: 'fuelMass', name: 'Fuel Mass', label: 'Fuel Mass', unit: 'kg', nominalRange: [8.0, 12.0], warningRange: [5.0, 12.5], color: '#EF4444' },
  { id: 'panelTemp', key: 'panelTemp', name: 'Panel Temp', label: 'Panel Temp', unit: '°C', nominalRange: [15, 35], warningRange: [5, 50], color: '#F97316' },
];

function getChannelCenter(channel: TelemetryChannel): number {
  return (channel.nominalRange[0] + channel.nominalRange[1]) / 2;
}

export function generateTelemetrySample(
  time: number,
  scenario: ScenarioId,
  prevSample: TelemetrySample | null
): TelemetrySample {
  const sample: TelemetrySample = {
    timestamp: time,
    wheelSpeed1: 0,
    wheelSpeed2: 0,
    wheelSpeed3: 0,
    busVoltage: 0,
    solarCurrent: 0,
    batterySoc: 0,
    fuelMass: 0,
    panelTemp: 0,
  };

  for (const channel of TELEMETRY_CHANNELS) {
    const center = getChannelCenter(channel);
    const prevVal = prevSample ? (prevSample[channel.id] as number) : center;
    
    // Random walk with reversion to mean
    const noise = (Math.random() - 0.5) * center * 0.005;
    const reversion = (center - prevVal) * 0.1;
    let val = prevVal + noise + reversion;

    // Fault Injection for Scenario B
    if (scenario === 'B') {
      if (channel.id === 'wheelSpeed2' && time > 2) {
        val += (6000 - val) * 0.05;
      }
      if (channel.id === 'busVoltage' && time > 4) {
        val -= 0.02;
        if (val < 24) val = 24;
      }
      if (channel.id === 'panelTemp' && time > 6) {
        val += (65 - val) * 0.02;
      }
      if (channel.id === 'batterySoc' && time > 5) {
        val -= 0.3;
        if (val < 20) val = 20;
      }
    }

    sample[channel.id] = val;
  }
  return sample;
}

export function calculateAnomalyScore(
  sample: TelemetrySample,
  history: TelemetrySample[]
): { score: number; channelScores: Record<string, number> } {
  if (history.length < 2) return { score: 0, channelScores: {} };
  
  const channelScores: Record<string, number> = {};
  let maxScore = 0;

  for (const channel of TELEMETRY_CHANNELS) {
    const values = history.map(h => h[channel.id] as number);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance) || 1e-6;

    const zScore = Math.abs((sample[channel.id] as number) - mean) / stddev;
    channelScores[channel.id] = zScore;
    if (zScore > maxScore) maxScore = zScore;
  }

  return { score: maxScore, channelScores };
}

export function detectAnomaly(
  sample: TelemetrySample,
  history: TelemetrySample[],
  time: number
): AnomalyEvent | null {
  if (history.length < 10) return null;

  const { score, channelScores } = calculateAnomalyScore(sample, history.slice(-60));
  
  if (score > 3) {
    const wheelSigma = channelScores['wheelSpeed2']?.toFixed(1) || '0.0';
    const voltSigma = channelScores['busVoltage']?.toFixed(1) || '0.0';
    const rootCause = `Anomaly driven by ${wheelSigma}σ divergence in Wheel 2 Speed vs Bus Voltage`;
    
    return {
      id: `anomaly-${time.toFixed(2)}`,
      timestamp: time,
      severity: score > 5 ? 'CRITICAL' : 'WARNING',
      score,
      message: rootCause,
      rootCause,
      sigmaValues: channelScores,
      affectedChannels: Object.entries(channelScores)
        .filter(([, z]) => z > 3)
        .map(([id]) => id),
    };
  }

  return null;
}
