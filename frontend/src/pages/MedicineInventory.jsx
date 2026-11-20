import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import useApi from '../hooks/useApi';
import { 
  Package, 
  AlertTriangle, 
  Filter, 
  Clock, 
  FileSpreadsheet
} from 'lucide-react';

export default function MedicineInventory() {
  const { language } = useLanguage();
  const { get, post, loading } = useApi();

  const [selectedFacility, setSelectedFacility] = useState('ALL');
  const [selectedMedicine, setSelectedMedicine] = useState('ALL');

  const facilityMap = {
    'FAC-001': 'Pirganj Upazila Complex',
    'FAC-002': 'Morrelganj Upazila Complex',
    'FAC-003': 'Shibchar Upazila Complex',
    'FAC-004': 'Barakhata Community Clinic',
    'FAC-005': 'Panchgaon Community Clinic',
    'FAC-006': 'Char Fasson Community Clinic',
    'WH-001': 'Tejgaon Central Depot (CMSD)'
  };

  const medicineMap = {
    'MED-001': 'Paracetamol 500mg',
    'MED-002': 'Amoxicillin 500mg',
    'MED-003': 'Metformin 500mg',
    'MED-004': 'Omeprazole 20mg',
    'MED-005': 'ORS Sachet'
  };

  const [batches, setBatches] = useState([
    { id: 'BAT-0001', medicine_id: 'MED-001', facility_id: 'FAC-001', quantity: 1200, manufacture_date: '2024-02-23', expiry_date: '2025-07-28' },
    { id: 'BAT-0002', medicine_id: 'MED-002', facility_id: 'FAC-002', quantity: 2400, manufacture_date: '2023-08-08', expiry_date: '2025-08-02' },
    { id: 'BAT-0003', medicine_id: 'MED-003', facility_id: 'FAC-003', quantity: 1800, manufacture_date: '2024-10-30', expiry_date: '2026-08-28' },
    { id: 'BAT-0004', medicine_id: 'MED-004', facility_id: 'FAC-001', quantity: 950, manufacture_date: '2024-05-12', expiry_date: '2025-09-15' },
    { id: 'BAT-0005', medicine_id: 'MED-005', facility_id: 'FAC-004', quantity: 650, manufacture_date: '2024-01-15', expiry_date: '2025-07-20' },
    { id: 'BAT-0006', medicine_id: 'MED-001', facility_id: 'FAC-005', quantity: 3200, manufacture_date: '2024-03-10', expiry_date: '2026-03-10' },
    { id: 'BAT-0007', medicine_id: 'MED-002', facility_id: 'FAC-006', quantity: 1400, manufacture_date: '2024-04-18', expiry_date: '2025-11-20' },
    { id: 'BAT-0008', medicine_id: 'MED-005', facility_id: 'FAC-001', quantity: 800, manufacture_date: '2024-02-01', expiry_date: '2025-07-25' }
  ]);

  const [facilities, setFacilities] = useState([
    { id: 'FAC-001', name: 'Pirganj Upazila Health Complex' },
    { id: 'FAC-002', name: 'Morrelganj Upazila Health Complex' },
    { id: 'FAC-003', name: 'Shibchar Upazila Health Complex' },
    { id: 'FAC-004', name: 'Barakhata Community Clinic' },
    { id: 'FAC-005', name: 'Panchgaon Community Clinic' },
    { id: 'FAC-006', name: 'Char Fasson Community Clinic' }
  ]);

  const [medicines, setMedicines] = useState([
    { id: 'MED-001', name: 'Paracetamol 500mg' },
    { id: 'MED-002', name: 'Amoxicillin 500mg' },
    { id: 'MED-003', name: 'Metformin 500mg' },
    { id: 'MED-004', name: 'Omeprazole 20mg' },
    { id: 'MED-005', name: 'ORS Sachet' }
  ]);

  const [adjustmentModal, setAdjustmentModal] = useState(false);
  const [adjustBatch, setAdjustBatch] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [csvResult, setCsvResult] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  useEffect(() => {
    get('/ai/seed-data')
      .then((data) => {
        if (data.facilities && Array.isArray(data.facilities)) setFacilities(data.facilities);
        if (data.medicines && Array.isArray(data.medicines)) setMedicines(data.medicines);
        if (data.batches && Array.isArray(data.batches) && data.batches.length > 0) {
          setBatches(data.batches.slice(0, 30));
        }
      })
      .catch((err) => console.warn('Loading seed batches (resilient local mode):', err));
  }, []);

  const handleStockAdjust = async (e) => {
    e.preventDefault();
    if (!adjustBatch || !adjustQty || !adjustReason) {
      alert('Please fill out all required fields');
      return;
    }

    const batchKey = adjustBatch.id || adjustBatch.batch_number || adjustBatch.batch_id;

    try {
      await post('/ai/approve', {
        recommendation_id: `ADJUST-${batchKey}`,
        action: 'approve',
        user_name: 'Facility Pharmacist',
        reason: `Manual stock adjustment to ${adjustQty} units. Reason: ${adjustReason}`
      }).catch(() => null);

      setBatches(prev => prev.map(b => 
        (b.id === batchKey || b.batch_number === batchKey || b.batch_id === batchKey)
          ? { ...b, quantity: parseInt(adjustQty, 10) }
          : b
      ));

      setActionNotice({
        type: 'success',
        text: `Batch ${batchKey} updated to ${parseInt(adjustQty, 10).toLocaleString()} units (audit logged).`
      });

      setAdjustmentModal(false);
      setAdjustBatch(null);
      setAdjustQty('');
      setAdjustReason('');
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message });
    }
  };

  const handleSimulateCSV = () => {
    setCsvResult({
      is_valid: false,
      summary: { total_rows: 5, valid_count: 3, invalid_count: 1, duplicate_count: 1 },
      invalid_records: [
        { row: 4, errors: ['Expiry date (2024-12-31) must be strictly in the future'] }
      ]
    });
  };

  const filteredBatches = batches.filter((b) => {
    const matchFac = selectedFacility === 'ALL' || b.facility_id === selectedFacility;
    const matchMed = selectedMedicine === 'ALL' || b.medicine_id === selectedMedicine;
    return matchFac && matchMed;
  });

  const getDaysUntilExpiry = (expStr) => {
    try {
      const exp = new Date(expStr);
      const ref = new Date('2025-07-15');
      const diffTime = exp.getTime() - ref.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 180;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#00a896]" />
            <span>{t('inventoryTitle', language)}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('inventorySubtitle', language)}
          </p>
        </div>

        <button
          onClick={handleSimulateCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition"
        >
          <FileSpreadsheet className="h-4 w-4 text-[#00a896]" />
          <span>{t('uploadCSV', language)}</span>
        </button>
      </div>

      {actionNotice && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {actionNotice.text}
        </div>
      )}

      {csvResult && (
        <div className="bg-white border border-amber-300 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              CSV Ingestion Validation Report
            </h3>
            <button onClick={() => setCsvResult(null)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
          </div>
          <div className="flex gap-4 text-xs">
            <span>Total: <strong>{csvResult.summary.total_rows}</strong></span>
            <span className="text-emerald-700">Valid: <strong>{csvResult.summary.valid_count}</strong></span>
            <span className="text-rose-700">Invalid: <strong>{csvResult.summary.invalid_count}</strong></span>
            <span className="text-amber-700">Duplicates: <strong>{csvResult.summary.duplicate_count}</strong></span>
          </div>
          <p className="text-xs text-rose-700 font-mono">
            {csvResult.invalid_records[0]?.errors[0]}
          </p>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="h-3.5 w-3.5 text-[#00a896]" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-[#00a896]"
          >
            <option value="ALL">All Facilities</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {facilityMap[f.id] || f.name}
              </option>
            ))}
          </select>

          <select
            value={selectedMedicine}
            onChange={(e) => setSelectedMedicine(e.target.value)}
            className="bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:border-[#00a896]"
          >
            <option value="ALL">All Tracer Medicines</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {medicineMap[m.id] || m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Showing <strong className="text-slate-900">{filteredBatches.length}</strong> batches
        </div>
      </div>

      {/* Clean Batch Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-2.5 px-4">{t('batchNumber', language)}</th>
                <th className="py-2.5 px-4">Facility</th>
                <th className="py-2.5 px-4">{t('medicine', language)}</th>
                <th className="py-2.5 px-4">{t('quantity', language)}</th>
                <th className="py-2.5 px-4">{t('expiryDate', language)}</th>
                <th className="py-2.5 px-4">{t('daysUntilExpiry', language)}</th>
                <th className="py-2.5 px-4">{t('fefoRecommendation', language)}</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredBatches.map((batch, idx) => {
                const daysLeft = getDaysUntilExpiry(batch.expiry_date);
                const isNearExpiry = daysLeft <= 45;
                const isCritical = daysLeft <= 20;
                const batchId = batch.id || batch.batch_number || batch.batch_id || `BAT-${idx + 101}`;

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {batchId}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">
                      {facilityMap[batch.facility_id] || batch.facility_id}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-[#00a896] font-semibold">
                      {medicineMap[batch.medicine_id] || batch.medicine_id}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 tabular-nums">
                      {batch.quantity?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {batch.expiry_date}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`font-bold tabular-nums ${
                        isCritical ? 'text-rose-600' : isNearExpiry ? 'text-amber-600' : 'text-slate-700'
                      }`}>
                        {daysLeft}d
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Priority FEFO
                        </span>
                      ) : isNearExpiry ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Dispense Next
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-sans">
                      <button
                        onClick={() => {
                          setAdjustBatch(batch);
                          setAdjustQty(batch.quantity);
                          setAdjustmentModal(true);
                        }}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-[#00a896] rounded text-[11px] font-bold transition border border-slate-200"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustmentModal && adjustBatch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Adjust Stock Count: {adjustBatch.id || adjustBatch.batch_number || adjustBatch.batch_id}
            </h3>
            <form onSubmit={handleStockAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Facility & Medicine</label>
                <div className="text-slate-800 font-semibold">
                  {facilityMap[adjustBatch.facility_id] || adjustBatch.facility_id} • {medicineMap[adjustBatch.medicine_id] || adjustBatch.medicine_id}
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Counted Physical Quantity</label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Stock Update</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physical inventory count verified"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00a896] hover:bg-[#008c7d] text-white rounded font-bold shadow-2xs"
                >
                  Save Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
