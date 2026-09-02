import { ConjunctionEvent, CAMOption, ManeuverResult } from '../types';

export function generateCAMOptions(conjunction: ConjunctionEvent): CAMOption[] {
  return [
    {
      id: 'opt-1',
      label: 'Along-Track Prograde Burn',
      description: 'Low-fuel along-track Δv to raise orbit and clear conjunction geometry',
      burnDirection: 'along-track',
      deltaV: 0.38,
      fuelCost: calculateFuelCost(0.38, 450),
      postManeuverPc: 2.1e-8,
      orbitAltitudeChange: +0.8,
      separationRate: 12.4,
      constellationLifetimeImpact: 'Negligible (< 0.01% orbit decay increase)',
      payloadBlackoutMinutes: 3.2
    },
    {
      id: 'opt-2',
      label: 'Radial Outward Burn',
      description: 'Higher Δv radial burn for faster separation with minimal along-track drift',
      burnDirection: 'radial',
      deltaV: 0.52,
      fuelCost: calculateFuelCost(0.52, 450),
      postManeuverPc: 5.6e-9,
      orbitAltitudeChange: +0.3,
      separationRate: 18.7,
      constellationLifetimeImpact: 'Minor (0.02% lifetime reduction)',
      payloadBlackoutMinutes: 5.8
    }
  ];
}

export function executeCAM(
  option: CAMOption,
  conjunction: ConjunctionEvent
): ManeuverResult {
  return {
    executed: true,
    success: true,
    selectedOptionId: option.id,
    executedOptionId: option.id,
    executionTime: Date.now(),
    preManeuverPc: conjunction.collisionProbability,
    postManeuverPc: option.postManeuverPc,
    finalPc: option.postManeuverPc,
    deltaV: option.deltaV,
    fuelUsed: option.fuelCost,
    newAltitude: 420 + option.orbitAltitudeChange,
    message: `Successfully executed ${option.label}. Collision probability reduced from ${conjunction.collisionProbability.toExponential(2)} to ${option.postManeuverPc.toExponential(2)}.`
  };
}

export function calculateFuelCost(deltaV: number, spacecraftMass: number): number {
  const Isp = 220; // seconds
  const g0 = 9.80665;
  const massRatio = Math.exp(-deltaV / (Isp * g0));
  const mFuel = spacecraftMass * (1 - massRatio);
  return Math.round(mFuel * 1000); // convert kg to grams
}
