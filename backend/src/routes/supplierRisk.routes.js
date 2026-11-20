import express from 'express';
import { calculateSupplierRisk, DEFAULT_WEIGHTS } from '../services/supplierRiskService.js';

const router = express.Router();

// GET /api/supplier-risk - Compute and view interpretable supplier risk scores
router.get('/', (req, res) => {
  // Configurable query weights
  const customWeights = {};
  if (req.query.w1) customWeights.w1_delay_ratio = parseFloat(req.query.w1);
  if (req.query.w2) customWeights.w2_leadtime_variability = parseFloat(req.query.w2);
  if (req.query.w3) customWeights.w3_fulfilment_gap = parseFloat(req.query.w3);
  if (req.query.w4) customWeights.w4_route_concentration = parseFloat(req.query.w4);
  if (req.query.w5) customWeights.w5_cover_deficiency = parseFloat(req.query.w5);

  // Synthetic supplier profiles
  const sampleSuppliers = [
    {
      id: 'sup-001',
      name: 'Bengal Active Pharmaceutical Ingredient Imports Ltd',
      country: 'India',
      delay_ratio: 0.35,
      leadtime_variability: 0.40,
      fulfilment_gap: 0.20,
      route_concentration: 0.70,
      cover_ratio: 0.55
    },
    {
      id: 'sup-002',
      name: 'Padma Chemical & Raw Material Synthetics',
      country: 'China',
      delay_ratio: 0.15,
      leadtime_variability: 0.20,
      fulfilment_gap: 0.10,
      route_concentration: 0.50,
      cover_ratio: 0.80
    },
    {
      id: 'sup-003',
      name: 'Meghna Pharma Global Ingredients',
      country: 'South Korea',
      delay_ratio: 0.55,
      leadtime_variability: 0.65,
      fulfilment_gap: 0.45,
      route_concentration: 0.85,
      cover_ratio: 0.30
    }
  ];

  const scores = sampleSuppliers.map(s => calculateSupplierRisk(s, customWeights));

  res.json({
    data_label: 'Synthetic data / Simulated',
    default_weights: DEFAULT_WEIGHTS,
    applied_weights: customWeights,
    suppliers: scores
  });
});

export default router;

