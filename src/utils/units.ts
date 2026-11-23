// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Dimension-Safe Unit Conversion Engine
// ==============================================================================

import { UnitType } from '../types';

export type UnitDimension = 'weight' | 'volume' | 'count';

export const UNIT_DIMENSIONS: Record<UnitType, UnitDimension> = {
  kg: 'weight',
  g: 'weight',
  L: 'volume',
  ml: 'volume',
  pkt: 'count',
  pcs: 'count',
  ctn: 'count',
};

// Standard base conversions within dimension:
// weight base: grams
// volume base: millilitres
// count base: pieces
const BASE_FACTORS: Record<UnitType, number> = {
  kg: 1000,
  g: 1,
  L: 1000,
  ml: 1,
  pkt: 1,
  pcs: 1,
  ctn: 20, // Default 1 carton = 20 packets (customizable per product)
};

/**
 * Converts a quantity from one unit to another with dimension validation.
 * @param qty Amount to convert
 * @param fromUnit Source unit
 * @param toUnit Target unit
 * @param cartonSize Optional custom count of packets per carton (defaults to 20)
 */
export function convertUnit(
  qty: number,
  fromUnit: UnitType,
  toUnit: UnitType,
  cartonSize: number = 20
): { success: boolean; result: number; error?: string } {
  if (fromUnit === toUnit) {
    return { success: true, result: qty };
  }

  const fromDim = UNIT_DIMENSIONS[fromUnit];
  const toDim = UNIT_DIMENSIONS[toUnit];

  if (fromDim !== toDim) {
    return {
      success: false,
      result: qty,
      error: `Dimension mismatch: cannot convert ${fromUnit} (${fromDim}) to ${toUnit} (${toDim}) without density or package definition.`,
    };
  }

  // Handle carton scaling for count dimension
  const fromFactor = fromUnit === 'ctn' ? cartonSize : BASE_FACTORS[fromUnit];
  const toFactor = toUnit === 'ctn' ? cartonSize : BASE_FACTORS[toUnit];

  const inBase = qty * fromFactor;
  const converted = inBase / toFactor;

  return { success: true, result: converted };
}

/**
 * Checks if two units share the same dimension
 */
export function areCompatibleUnits(unitA: UnitType, unitB: UnitType): boolean {
  return UNIT_DIMENSIONS[unitA] === UNIT_DIMENSIONS[unitB];
}
