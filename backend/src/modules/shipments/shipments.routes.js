import express from 'express';

const router = express.Router();

// GET /api/shipments - Active Pharmaceutical Ingredient shipments tracking
router.get('/', (req, res) => {
  const shipments = [
    {
      id: 'SHP-001',
      supplier: 'Bengal Active Pharmaceutical Ingredient Imports Ltd',
      ingredient_name: 'Paracetamol Pure Powder',
      quantity_kg: 5000,
      status: 'in_transit',
      port_of_entry: 'Chittagong Port',
      scheduled_arrival: '2025-07-15',
      delay_days: 3,
      risk_level: 'medium'
    },
    {
      id: 'SHP-002',
      supplier: 'Padma Chemical & Raw Material Synthetics',
      ingredient_name: 'Amoxicillin Trihydrate Compacted',
      quantity_kg: 2500,
      status: 'delivered',
      port_of_entry: 'Chittagong Port',
      scheduled_arrival: '2025-07-05',
      actual_arrival: '2025-07-06',
      delay_days: 1,
      risk_level: 'low'
    },
    {
      id: 'SHP-003',
      supplier: 'Meghna Pharma Global Ingredients',
      ingredient_name: 'Metformin Hydrochloride',
      quantity_kg: 3500,
      status: 'delayed',
      port_of_entry: 'Mongla Port',
      scheduled_arrival: '2025-07-10',
      delay_days: 12,
      risk_level: 'high'
    }
  ];

  res.json({
    data_label: 'Synthetic data',
    shipments
  });
});

export default router;

