import express from 'express';
import { calculateSupplierRisk } from '../../services/supplierRiskService.js';

const router = express.Router();

// GET /api/suppliers - Upstream Active Pharmaceutical Ingredient suppliers & risk scores
router.get('/', (req, res) => {
  const sampleSuppliers = [
    {
      id: 'SUP-001',
      name: 'Bengal Active Pharmaceutical Ingredient Imports Ltd',
      country: 'India',
      delay_ratio: 0.35,
      leadtime_variability: 0.40,
      fulfilment_gap: 0.20,
      route_concentration: 0.70,
      cover_ratio: 0.55
    },
    {
      id: 'SUP-002',
      name: 'Padma Chemical & Raw Material Synthetics',
      country: 'China',
      delay_ratio: 0.15,
      leadtime_variability: 0.20,
      fulfilment_gap: 0.10,
      route_concentration: 0.50,
      cover_ratio: 0.80
    },
    {
      id: 'SUP-003',
      name: 'Meghna Pharma Global Ingredients',
      country: 'South Korea',
      delay_ratio: 0.55,
      leadtime_variability: 0.65,
      fulfilment_gap: 0.45,
      route_concentration: 0.85,
      cover_ratio: 0.30
    }
  ];

  const scores = sampleSuppliers.map(s => calculateSupplierRisk(s));

  res.json({
    data_label: 'Synthetic data',
    suppliers: scores
  });
});

export default router;

