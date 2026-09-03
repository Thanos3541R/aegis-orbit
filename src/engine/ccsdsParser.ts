// ── CCSDS 508.0-B-1 Conjunction Data Message Engine ─────────────────────────
// Generates CDM in JSON and KVN (Keyword=Value Notation) formats.
// Parses KVN text back into key-value records.

import type { ConjunctionEvent, Satellite } from '../types';

export function generateCDM_JSON(conjunction: ConjunctionEvent, satellites: Satellite[]): Record<string, unknown> {
  const primary = satellites.find(s => s.id === conjunction.primaryId);
  const secondary = [...satellites].find(s => s.id === conjunction.secondaryId);

  return {
    CCSDS_CDM_VERS: '1.0',
    CREATION_DATE: new Date().toISOString(),
    ORIGINATOR: 'IS4OM_NETRA_AEGIS',
    MESSAGE_ID: `CDM-${conjunction.id}-${Date.now()}`,
    TCA: `T-${Math.floor(conjunction.tca / 60)}min ${Math.floor(conjunction.tca % 60)}s`,
    MISS_DISTANCE: `${conjunction.missDistance} m`,
    RELATIVE_SPEED: `${conjunction.relativeVelocity} km/s`,
    COLLISION_PROBABILITY: conjunction.collisionProbability,
    COLLISION_PROBABILITY_METHOD: 'CHAN-1997',
    EMERGENCY_REPORTABLE: conjunction.riskLevel === 'CRITICAL' ? 'YES' : 'NO',
    OBJECT1: {
      OBJECT_DESIGNATOR: primary?.id || conjunction.primaryId,
      OBJECT_NAME: conjunction.primaryName,
      INTERNATIONAL_DESIGNATOR: '2024-001A',
      OBJECT_TYPE: 'PAYLOAD',
      EPHEMERIS_NAME: 'AegisOrbit Propagator v2.0',
      COVARIANCE_METHOD: 'CALCULATED',
      MANEUVERABLE: 'YES',
      ORBIT_CENTER: 'EARTH',
      REF_FRAME: 'EME2000',
    },
    OBJECT2: {
      OBJECT_DESIGNATOR: secondary?.id || conjunction.secondaryId,
      OBJECT_NAME: conjunction.secondaryName,
      INTERNATIONAL_DESIGNATOR: '1993-036PL',
      OBJECT_TYPE: 'DEBRIS',
      EPHEMERIS_NAME: 'AegisOrbit Propagator v2.0',
      COVARIANCE_METHOD: 'CALCULATED',
      MANEUVERABLE: 'N/A',
      ORBIT_CENTER: 'EARTH',
      REF_FRAME: 'EME2000',
    },
    COVARIANCE_RTN: {
      CR_R: conjunction.covariance[0][0],
      CT_R: conjunction.covariance[1][0],
      CN_R: conjunction.covariance[2][0],
      CT_T: conjunction.covariance[1][1],
      CN_T: conjunction.covariance[2][1],
      CN_N: conjunction.covariance[2][2],
    },
  };
}

export function generateCDM_KVN(conjunction: ConjunctionEvent, satellites: Satellite[]): string {
  const msg = generateCDM_JSON(conjunction, satellites);
  const cov = msg.COVARIANCE_RTN as Record<string, number>;
  const obj1 = msg.OBJECT1 as Record<string, string>;
  const obj2 = msg.OBJECT2 as Record<string, string>;

  return `CCSDS_CDM_VERS                = ${msg.CCSDS_CDM_VERS}
CREATION_DATE                 = ${msg.CREATION_DATE}
ORIGINATOR                    = ${msg.ORIGINATOR}
MESSAGE_ID                    = ${msg.MESSAGE_ID}
TCA                           = ${msg.TCA}
MISS_DISTANCE                 = ${msg.MISS_DISTANCE}
RELATIVE_SPEED                = ${msg.RELATIVE_SPEED}
COLLISION_PROBABILITY         = ${(msg.COLLISION_PROBABILITY as number).toExponential(3)}
COLLISION_PROBABILITY_METHOD  = ${msg.COLLISION_PROBABILITY_METHOD}
EMERGENCY_REPORTABLE          = ${msg.EMERGENCY_REPORTABLE}
OBJECT1_NAME                  = ${obj1.OBJECT_NAME}
OBJECT1_DESIGNATOR            = ${obj1.OBJECT_DESIGNATOR}
OBJECT1_OBJECT_TYPE           = ${obj1.OBJECT_TYPE}
OBJECT1_MANEUVERABLE          = ${obj1.MANEUVERABLE}
OBJECT2_NAME                  = ${obj2.OBJECT_NAME}
OBJECT2_DESIGNATOR            = ${obj2.OBJECT_DESIGNATOR}
OBJECT2_OBJECT_TYPE           = ${obj2.OBJECT_TYPE}
OBJECT2_MANEUVERABLE          = ${obj2.MANEUVERABLE}
COVARIANCE_METHOD             = CALCULATED
CR_R                          = ${cov.CR_R.toFixed(3)}
CT_R                          = ${cov.CT_R.toFixed(3)}
CN_R                          = ${cov.CN_R.toFixed(3)}
CT_T                          = ${cov.CT_T.toFixed(3)}
CN_T                          = ${cov.CN_T.toFixed(3)}
CN_N                          = ${cov.CN_N.toFixed(3)}`;
}

export function parseCDM_KVN(kvnText: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = kvnText.split('\n');

  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx !== -1) {
      const key = line.substring(0, idx).trim();
      const value = line.substring(idx + 1).trim();
      result[key] = value;
    }
  }

  return result;
}
