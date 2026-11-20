import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import { 
  Network, 
  Building2, 
  Ship, 
  Factory, 
  Warehouse, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers
} from 'lucide-react';

export default function DigitalTwin() {
  const { language } = useLanguage();
  const [selectedNode, setSelectedNode] = useState('WH-001');
  const [selectedMedicine, setSelectedMedicine] = useState('ALL');

  // Network Nodes Definition
  const nodes = [
    {
      id: 'SUP-001',
      name: 'Bengal Active Pharmaceutical Ingredient Imports',
      name_bn: 'বেঙ্গল সক্রিয় উপাদান আমদানিকারক',
      type: 'supplier',
      location: 'Chittagong Port',
      role: 'Raw Material Import Hub',
      capacity: '500,000 kg',
      currentStock: '185,000 kg',
      status: 'warning',
      riskNote: 'Port customs clearance and freight delay risk'
    },
    {
      id: 'MFG-001',
      name: 'Padma Formulation & Manufacturing Plant',
      name_bn: 'পদ্মা ফর্মুলেশন ও ওষুধ প্ল্যান্ট',
      type: 'manufacturer',
      location: 'Gazipur Industrial Zone',
      role: 'Finished Tablet & Capsule Production',
      capacity: '2,000,000 units/mo',
      currentStock: '820,000 units',
      status: 'normal',
      riskNote: 'Dependent on raw Active Pharmaceutical Ingredient supply'
    },
    {
      id: 'WH-001',
      name: 'Tejgaon Central Medical Stores Depot (CMSD)',
      name_bn: 'তেজগাঁও কেন্দ্রীয় ওষুধ গুদাম',
      type: 'warehouse',
      location: 'Dhaka Central Hub',
      role: 'National Storage & Dispatch Hub',
      capacity: '5,000,000 units',
      currentStock: '2,450,000 units',
      status: 'normal',
      riskNote: 'Central distribution point to all healthcare facilities'
    },
    // Downstream Facilities
    {
      id: 'FAC-001',
      name: 'Pirganj Upazila Health Complex',
      name_bn: 'পীরগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স',
      type: 'upazila_health_complex',
      district: 'Rangpur',
      capacity: '50,000 units',
      currentStock: selectedMedicine === 'MED-001' ? '1,200 units' : '14,200 units',
      daysOfCover: selectedMedicine === 'MED-001' ? '3.2 days' : '7.4 days',
      status: selectedMedicine === 'MED-001' || selectedMedicine === 'ALL' ? 'critical' : 'normal',
      riskNote: 'Imminent stockout for Paracetamol and ORS'
    },
    {
      id: 'FAC-002',
      name: 'Morrelganj Upazila Health Complex',
      name_bn: 'মোড়েলগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স',
      type: 'upazila_health_complex',
      district: 'Bagerhat',
      capacity: '45,000 units',
      currentStock: selectedMedicine === 'MED-002' ? '4,800 units' : '28,900 units',
      daysOfCover: selectedMedicine === 'MED-002' ? '18.4 days' : '16.0 days',
      status: selectedMedicine === 'MED-002' || selectedMedicine === 'ALL' ? 'warning' : 'normal',
      riskNote: 'Batch BX-2025-08 near expiry; candidate donor facility'
    },
    {
      id: 'FAC-003',
      name: 'Shibchar Upazila Health Complex',
      name_bn: 'শিবচর উপজেলা স্বাস্থ্য কমপ্লেক্স',
      type: 'upazila_health_complex',
      district: 'Madaripur',
      capacity: '48,000 units',
      currentStock: '22,400 units',
      daysOfCover: '12.6 days',
      status: 'normal',
      riskNote: 'Stable safety stock buffer across essential tracer medicines'
    },
    {
      id: 'FAC-004',
      name: 'Barakhata Community Clinic',
      name_bn: 'বড়খাতা কমিউনিটি ক্লিনিক',
      type: 'community_clinic',
      district: 'Lalmonirhat',
      capacity: '8,000 units',
      currentStock: selectedMedicine === 'MED-005' ? '650 units' : '1,100 units',
      daysOfCover: selectedMedicine === 'MED-005' ? '1.8 days' : '4.2 days',
      status: selectedMedicine === 'MED-005' || selectedMedicine === 'ALL' ? 'critical' : 'warning',
      riskNote: 'Severe shortage of Oral Rehydration Salts'
    },
    {
      id: 'FAC-005',
      name: 'Panchgaon Community Clinic',
      name_bn: 'পাঁচগাঁও কমিউনিটি ক্লিনিক',
      type: 'community_clinic',
      district: 'Moulvibazar',
      capacity: '7,500 units',
      currentStock: '4,200 units',
      daysOfCover: '14.1 days',
      status: 'normal',
      riskNote: 'Normal operational inventory'
    },
    {
      id: 'FAC-006',
      name: 'Char Fasson Community Clinic',
      name_bn: 'চরফ্যাশন কমিউনিটি ক্লিনিক',
      type: 'community_clinic',
      district: 'Bhola',
      capacity: '9,000 units',
      currentStock: '3,800 units',
      daysOfCover: '8.5 days',
      status: 'normal',
      riskNote: 'Island transit dependent on riverine weather conditions'
    }
  ];

  const routes = [
    { from: 'Bengal Imports', to: 'Padma Formulation', leadDays: 2 },
    { from: 'Padma Formulation', to: 'Tejgaon CMSD', leadDays: 1 },
    { from: 'Tejgaon CMSD', to: 'Pirganj Complex', leadDays: 3 },
    { from: 'Tejgaon CMSD', to: 'Morrelganj Complex', leadDays: 2 },
    { from: 'Tejgaon CMSD', to: 'Shibchar Complex', leadDays: 1 },
    { from: 'Pirganj Complex', to: 'Barakhata Clinic', leadDays: 1 }
  ];

  const activeNode = nodes.find(n => n.id === selectedNode) || nodes[2];

  const getNodeIcon = (type) => {
    switch (type) {
      case 'supplier': return Ship;
      case 'manufacturer': return Factory;
      case 'warehouse': return Warehouse;
      default: return Building2;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'critical') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="h-3 w-3 text-rose-600" />
          {t('statusCritical', language)}
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-3 w-3 text-amber-600" />
          {t('statusWarning', language)}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        {t('statusNormal', language)}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Network className="h-5 w-5 text-[#00a896]" />
            <span>{t('digitalTwinTitle', language)}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('digitalTwinSubtitle', language)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Filter:</span>
          <select 
            value={selectedMedicine}
            onChange={(e) => setSelectedMedicine(e.target.value)}
            className="bg-white text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00a896] shadow-2xs text-xs font-medium"
          >
            <option value="ALL">All Tracer Medicines</option>
            <option value="MED-001">Paracetamol 500mg</option>
            <option value="MED-002">Amoxicillin 500mg</option>
            <option value="MED-005">ORS Sachets</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Network Layout + Selected Node Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Nodes Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
              <Layers className="h-4 w-4 text-[#00a896]" />
              <span>Multi-Echelon Network Nodes</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className="text-slate-500 text-[11px]">Normal</span></div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className="text-slate-500 text-[11px]">Warning</span></div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span><span className="text-slate-500 text-[11px]">Critical</span></div>
            </div>
          </div>

          {/* Tier 1: Upstream & Central Storage Hub */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              1. Upstream & Central Storage Hub
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {nodes.slice(0, 3).map((node) => {
                const Icon = getNodeIcon(node.type);
                const isSelected = selectedNode === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node.id)}
                    className={`text-left p-3 rounded-xl border transition flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-teal-50/50 border-[#00a896] shadow-xs ring-1 ring-[#00a896]' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-teal-50 text-[#00a896] border border-teal-100">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {getStatusBadge(node.status)}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {language === 'bn' ? node.name_bn : node.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1">{node.location}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600 flex justify-between">
                      <span className="text-slate-400">Stock:</span>
                      <span className="font-semibold">{node.currentStock}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tier 2: Downstream Healthcare Facilities */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              2. Healthcare Facilities & Clinics
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {nodes.slice(3).map((node) => {
                const Icon = getNodeIcon(node.type);
                const isSelected = selectedNode === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node.id)}
                    className={`text-left p-3 rounded-xl border transition flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-teal-50/50 border-[#00a896] shadow-xs ring-1 ring-[#00a896]' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {getStatusBadge(node.status)}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {language === 'bn' ? node.name_bn : node.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{node.district}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] flex justify-between">
                      <span className="text-slate-400">Cover:</span>
                      <span className={`font-bold ${node.status === 'critical' ? 'text-rose-600' : 'text-slate-700'}`}>
                        {node.daysOfCover}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Node Details & Routes Drawer (1 col) */}
        <div className="space-y-5">
          {/* Node Profile Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#00a896] font-bold block">
                  Node Profile
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {language === 'bn' ? activeNode.name_bn : activeNode.name}
                </h3>
                <span className="text-xs font-mono text-slate-400">{activeNode.id}</span>
              </div>
              {getStatusBadge(activeNode.status)}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Role:</span>
                <span className="font-semibold text-slate-800 text-right">{activeNode.role || 'Healthcare Facility'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Capacity:</span>
                <span className="font-bold text-slate-900">{activeNode.capacity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Current Stock:</span>
                <span className="text-[#00a896] font-bold">{activeNode.currentStock}</span>
              </div>
              {activeNode.daysOfCover && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Days of Cover:</span>
                  <span className="font-bold text-amber-700">{activeNode.daysOfCover}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-700 block mb-1">Status Note:</span>
              <p>{activeNode.riskNote}</p>
            </div>
          </div>

          {/* Active Logistics Routes */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Truck className="h-3.5 w-3.5 text-[#00a896]" />
              <span>Key Logistics Corridors</span>
            </h3>

            <div className="space-y-2 text-xs">
              {routes.map((r, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">
                      {r.from} → {r.to}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#00a896] font-bold font-mono">{r.leadDays}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
