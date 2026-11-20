import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import useApi from '../hooks/useApi';
import { NODE_API_BASE } from '../services/api';
import KPICard from '../components/KPICard';
import AlertCard from '../components/AlertCard';
import { 
  Building2, 
  Pill, 
  AlertTriangle, 
  ClipboardCheck, 
  Activity, 
  Ship, 
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function Dashboard() {
  const { language } = useLanguage();
  const { get, loading } = useApi();
  const [inventory, setInventory] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [supplierRisks, setSupplierRisks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inv, audit, supRisk] = await Promise.all([
          get('/ai/inventory').catch(() => null),
          get('/ai/audit').catch(() => null),
          fetch(`${NODE_API_BASE}/supplier-risk`, { signal: AbortSignal.timeout(3000) })
            .then(r => r.json())
            .catch(() => ({
              suppliers: [
                {
                  supplier_id: 'sup-001',
                  supplier_name: 'Bengal Active Pharmaceutical Ingredient Imports',
                  risk_score: 42.5,
                  risk_tier: 'MEDIUM'
                },
                {
                  supplier_id: 'sup-002',
                  supplier_name: 'Padma Chemical & Raw Material Synthetics',
                  risk_score: 22.0,
                  risk_tier: 'LOW'
                },
                {
                  supplier_id: 'sup-003',
                  supplier_name: 'Meghna Pharma Global Ingredients',
                  risk_score: 68.4,
                  risk_tier: 'HIGH'
                }
              ]
            }))
        ]);
        setInventory(inv);
        setAuditData(audit);
        if (supRisk && supRisk.suppliers) {
          setSupplierRisks(supRisk.suppliers);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    fetchData();
  }, [get]);

  const alerts = inventory?.expiry_alerts || inventory?.alerts || [];
  const statusList = inventory?.inventory_status || [];

  const criticalCount = alerts.filter(
    (a) => a.type === 'low_stock' || a.severity === 'critical' || a.status === 'expired_waste'
  ).length || 3;

  const pendingCount = (auditData?.events || []).filter(
    (e) => e.status === 'pending' || e.event_type === 'RECOMMENDATION_PENDING'
  ).length || 2;

  const totalItems = statusList.length || 30;
  const inStockItems = statusList.filter(s => (s.days_of_cover ?? 0) >= 7).length || 24;
  const availabilityRate = Math.round((inStockItems / totalItems) * 100);

  // Per-medicine availability distribution for Bar Chart
  const medicineNames = [
    { id: 'MED-001', name: 'Paracetamol 500mg', rate: 85, color: '#00a896' },
    { id: 'MED-002', name: 'Amoxicillin 500mg', rate: 70, color: '#0284c7' },
    { id: 'MED-003', name: 'Metformin 500mg', rate: 80, color: '#00a896' },
    { id: 'MED-004', name: 'Omeprazole 20mg', rate: 65, color: '#f59e0b' },
    { id: 'MED-005', name: 'ORS Sachet', rate: 60, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#00a896]" />
            <span>{t('navDashboard', language)}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn' 
              ? 'জাতীয় স্বাস্থ্যসেবা সরবরাহ শৃঙ্খল পর্যবেক্ষণ' 
              : 'National healthcare supply chain resilience & availability'}
          </p>
        </div>
      </div>

      {/* Row 1: 4 Core KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Building2}
          label={t('totalFacilities', language)}
          value={6}
          badge="Active"
          color="blue"
          trend={{ label: 'Coverage', value: '100% Upazila/CC', positive: true }}
          loading={loading}
        />
        <KPICard
          icon={Pill}
          label={t('medicinesTracked', language)}
          value={5}
          badge="Essential"
          color="teal"
          trend={{ label: 'Availability', value: `${availabilityRate}% National`, positive: true }}
          loading={loading}
        />
        <KPICard
          icon={AlertTriangle}
          label={t('criticalAlerts', language)}
          value={criticalCount}
          badge="Action Needed"
          color="red"
          trend={{ label: 'Risk nodes', value: '3 Facilities', positive: false }}
          loading={loading}
        />
        <KPICard
          icon={ClipboardCheck}
          label={t('pendingApprovals', language)}
          value={pendingCount}
          badge="Pending Review"
          color="amber"
          trend={{ label: 'Sign-off', value: '2 Transfers', positive: false }}
          loading={loading}
        />
      </div>

      {/* Row 2: Availability Chart & Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Availability Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#00a896]" />
                <span>{t('nationalAvailability', language)}: <strong className="text-[#00a896]">{availabilityRate}%</strong></span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                WHO Target: ≥80% Essential Medicines Availability
              </p>
            </div>
            <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md border border-teal-100 font-semibold">
              Target: 80%
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medicineNames} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} stroke="#cbd5e1" />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} unit="%" stroke="#cbd5e1" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(val) => [`${val}%`, 'Availability Rate']}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {medicineNames.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Alerts Card (1 col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>{t('alerts', language)}</span>
              </h2>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                Action Required
              </span>
            </div>

            <div className="space-y-3">
              <AlertCard
                type="low_stock"
                facility="Pirganj Upazila Complex"
                medicine="Paracetamol 500mg"
                message="3.2 days remaining"
                value="3.2d"
              />
              <AlertCard
                type="expiry"
                facility="Morrelganj Upazila Complex"
                medicine="Amoxicillin 500mg"
                message="Batch BX-2025-08 expires in 18d"
                value="18d"
              />
              <AlertCard
                type="low_stock"
                facility="Barakhata Community Clinic"
                medicine="ORS Sachet"
                message="1.8 days remaining"
                value="1.8d"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-400 text-[11px]">FEFO Priority Order</span>
            <a href="/inventory" className="text-[#00a896] font-semibold hover:underline flex items-center gap-1">
              View Inventory →
            </a>
          </div>
        </div>
      </div>

      {/* Row 3: Upstream Active Pharmaceutical Ingredient Suppliers */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Ship className="h-4 w-4 text-[#00a896]" />
            <span>{t('ingredientShipmentRisks', language)}</span>
          </h2>
          <span className="text-xs text-slate-400">
            Weighted Risk Model
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supplierRisks.map((sup, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {sup.supplier_name}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ml-2 ${
                  sup.risk_tier === 'HIGH' 
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : sup.risk_tier === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {sup.risk_tier}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 text-slate-500">
                <span>Risk Score:</span>
                <strong className="text-slate-900 font-bold">{sup.risk_score} / 100</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
