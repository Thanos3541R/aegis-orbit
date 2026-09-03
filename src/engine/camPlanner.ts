import { ConjunctionEvent, CAMOption, ManeuverResult, ParetoPoint } from '../types';

export function generateCAMOptions(conjunction: ConjunctionEvent): CAMOption[] {
  return [
    {
      id: 'opt-1',
      label: 'Along-Track Prograde Burn',
      description: 'CW along-track phase shift — low-fuel Δv to raise orbit and shift TCA geometry',
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
      description: 'Radial outward burn — rapid cross-track separation for urgent TCA scenarios',
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
    newAltitude: 505 + option.orbitAltitudeChange,
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

export function computeParetoFrontier(conjunction: ConjunctionEvent): ParetoPoint[] {
  const points: ParetoPoint[] = [];
  const minRisk = 1e-8;
  const maxRisk = 1e-5;
  const numPoints = 20;

  for (let i = 0; i < numPoints; i++) {
    // Log-spaced interpolation
    const logRisk = Math.log10(maxRisk) - (i / (numPoints - 1)) * (Math.log10(maxRisk) - Math.log10(minRisk));
    const riskTolerance = Math.pow(10, logRisk);
    
    // Proportional to -log10(riskTolerance)
    // risk = 1e-5 -> -log10 = 5. Maps to 0.1 m/s?
    // risk = 1e-8 -> -log10 = 8. Maps to 0.8 m/s?
    // Let's create a linear mapping from [-log(1e-5), -log(1e-8)] -> [0.1, 0.8]
    // i.e., [5, 8] -> [0.1, 0.8]
    const negLogRisk = -logRisk;
    const deltaV = 0.1 + ((negLogRisk - 5) / (8 - 5)) * (0.8 - 0.1);
    
    const fuelCostGrams = calculateFuelCost(deltaV, 450);
    const missionLifetimeLossDays = deltaV * 2.5;

    points.push({
      riskTolerance,
      deltaV,
      fuelCostGrams,
      missionLifetimeLossDays
    });
  }

  return points;
}
