/**
 * Synthetic fallback inventory data
 * Ensures 100% operational uptime if AI service is starting or disconnected.
 */
export function getFallbackInventory() {
  return {
    reference_date: '2025-07-15',
    data_label: 'Synthetic data',
    inventory_status: [
      {
        facility_id: 'fac-001',
        facility_name: 'Pirganj Upazila Health Complex',
        medicine_id: 'med-001',
        medicine_name: 'Paracetamol 500mg Tablet',
        current_stock: 190,
        average_daily_consumption: 59.95,
        days_of_cover: 3.2,
        status: 'CRITICAL'
      },
      {
        facility_id: 'fac-002',
        facility_name: 'Morrelganj Upazila Health Complex',
        medicine_id: 'med-002',
        medicine_name: 'Amoxicillin 500mg Capsule',
        current_stock: 580,
        average_daily_consumption: 32.5,
        days_of_cover: 17.8,
        status: 'HEALTHY'
      },
      {
        facility_id: 'fac-003',
        facility_name: 'Shibchar Upazila Health Complex',
        medicine_id: 'med-003',
        medicine_name: 'Metformin 500mg Tablet',
        current_stock: 310,
        average_daily_consumption: 22.5,
        days_of_cover: 13.8,
        status: 'HEALTHY'
      },
      {
        facility_id: 'fac-004',
        facility_name: 'Barakhata Community Clinic',
        medicine_id: 'med-004',
        medicine_name: 'Omeprazole 20mg Capsule',
        current_stock: 75,
        average_daily_consumption: 15.0,
        days_of_cover: 5.0,
        status: 'LOW'
      },
      {
        facility_id: 'fac-005',
        facility_name: 'Panchgaon Community Clinic',
        medicine_id: 'med-005',
        medicine_name: 'Oral Rehydration Salts (ORS) Sachet',
        current_stock: 420,
        average_daily_consumption: 29.7,
        days_of_cover: 14.1,
        status: 'HEALTHY'
      },
      {
        facility_id: 'wh-001',
        facility_name: 'Central Medical Stores Depot (CMSD)',
        medicine_id: 'med-001',
        medicine_name: 'Paracetamol 500mg Tablet',
        current_stock: 150000,
        average_daily_consumption: 1200.0,
        days_of_cover: 125.0,
        status: 'EXCESS'
      }
    ],
    expiry_alerts: [
      {
        type: 'low_stock',
        severity: 'critical',
        facility_id: 'fac-001',
        facility_name: 'Pirganj Upazila Health Complex',
        medicine_id: 'med-001',
        medicine_name: 'Paracetamol 500mg Tablet',
        days_of_cover: 3.2,
        action_required: 'Immediate inter-facility redistribution needed'
      },
      {
        type: 'expiry_warning',
        severity: 'medium',
        batch_number: 'BX-2025-08',
        facility_id: 'fac-002',
        facility_name: 'Morrelganj Upazila Health Complex',
        medicine_id: 'med-002',
        medicine_name: 'Amoxicillin 500mg Capsule',
        quantity: 240,
        expiry_date: '2025-08-02',
        days_until_expiry: 18,
        action_required: 'FEFO dispatch prioritization recommended'
      }
    ]
  };
}
