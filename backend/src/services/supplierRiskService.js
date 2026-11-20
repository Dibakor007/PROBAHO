/**
 * Supplier and Shipment Risk Service
 * Computes an interpretable weighted risk score based on:
 * risk = w1*delay_ratio + w2*leadtime_variability + w3*fulfilment_gap + w4*route_concentration + w5*(1 - cover_ratio)
 * 
 * Weights are configurable and visible to users, normalized 0 to 100.
 * All data is synthetic and marked as simulated.
 */

export const DEFAULT_WEIGHTS = {
  w1_delay_ratio: 0.25,
  w2_leadtime_variability: 0.20,
  w3_fulfilment_gap: 0.25,
  w4_route_concentration: 0.15,
  w5_cover_deficiency: 0.15
};

/**
 * Calculates supplier risk score with transparent breakdown
 */
export function calculateSupplierRisk(supplierData, customWeights = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // Normalize weights so sum = 1.0
  const normalizedWeights = {
    w1: weights.w1_delay_ratio / totalWeight,
    w2: weights.w2_leadtime_variability / totalWeight,
    w3: weights.w3_fulfilment_gap / totalWeight,
    w4: weights.w4_route_concentration / totalWeight,
    w5: weights.w5_cover_deficiency / totalWeight
  };

  const delayRatio = Math.min(1.0, Math.max(0.0, supplierData.delay_ratio || 0));
  const leadtimeVar = Math.min(1.0, Math.max(0.0, supplierData.leadtime_variability || 0));
  const fulfilmentGap = Math.min(1.0, Math.max(0.0, supplierData.fulfilment_gap || 0));
  const routeConcentration = Math.min(1.0, Math.max(0.0, supplierData.route_concentration || 0));
  const coverRatio = Math.min(1.0, Math.max(0.0, supplierData.cover_ratio || 0));
  const coverDeficiency = 1.0 - coverRatio;

  const rawScore = 
    (normalizedWeights.w1 * delayRatio) +
    (normalizedWeights.w2 * leadtimeVar) +
    (normalizedWeights.w3 * fulfilmentGap) +
    (normalizedWeights.w4 * routeConcentration) +
    (normalizedWeights.w5 * coverDeficiency);

  // Scale to 0-100
  const score_0_to_100 = Math.round(rawScore * 1000) / 10;

  let riskTier = 'LOW';
  if (score_0_to_100 >= 60) {
    riskTier = 'HIGH';
  } else if (score_0_to_100 >= 35) {
    riskTier = 'MEDIUM';
  }

  return {
    supplier_id: supplierData.id || 'sup-001',
    supplier_name: supplierData.name || 'Bengal Active Pharmaceutical Ingredient Imports Ltd',
    risk_score: score_0_to_100,
    risk_tier: riskTier,
    is_simulated: true,
    data_label: 'Synthetic data',
    formula: 'w1*delay_ratio + w2*leadtime_variability + w3*fulfilment_gap + w4*route_concentration + w5*(1 - cover_ratio)',
    weights: {
      w1_delay_ratio: Math.round(normalizedWeights.w1 * 100) / 100,
      w2_leadtime_variability: Math.round(normalizedWeights.w2 * 100) / 100,
      w3_fulfilment_gap: Math.round(normalizedWeights.w3 * 100) / 100,
      w4_route_concentration: Math.round(normalizedWeights.w4 * 100) / 100,
      w5_cover_deficiency: Math.round(normalizedWeights.w5 * 100) / 100
    },
    metrics: {
      delay_ratio: delayRatio,
      leadtime_variability: leadtimeVar,
      fulfilment_gap: fulfilmentGap,
      route_concentration: routeConcentration,
      cover_ratio: coverRatio,
      cover_deficiency: Math.round(coverDeficiency * 100) / 100
    },
    weighted_contributions: {
      delay: Math.round(normalizedWeights.w1 * delayRatio * 1000) / 10,
      leadtime: Math.round(normalizedWeights.w2 * leadtimeVar * 1000) / 10,
      fulfilment: Math.round(normalizedWeights.w3 * fulfilmentGap * 1000) / 10,
      concentration: Math.round(normalizedWeights.w4 * routeConcentration * 1000) / 10,
      cover: Math.round(normalizedWeights.w5 * coverDeficiency * 1000) / 10
    }
  };
}

