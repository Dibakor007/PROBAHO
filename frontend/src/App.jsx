import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import DigitalTwin from './pages/DigitalTwin';
import MedicineInventory from './pages/MedicineInventory';
import Forecast from './pages/Forecast';
import Simulator from './pages/Simulator';
import Redistribution from './pages/Redistribution';
import Copilot from './pages/Copilot';
import Approvals from './pages/Approvals';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 1. Executive Dashboard */}
        <Route index element={<Dashboard />} />
        
        {/* 2. Supply Chain Digital Twin */}
        <Route path="network" element={<DigitalTwin />} />
        
        {/* 3. Medicine Inventory */}
        <Route path="inventory" element={<MedicineInventory />} />
        
        {/* 4. AI Forecast Center */}
        <Route path="forecast" element={<Forecast />} />
        
        {/* 5. Disruption Simulator */}
        <Route path="simulator" element={<Simulator />} />
        
        {/* 6. Smart Redistribution */}
        <Route path="redistribution" element={<Redistribution />} />
        
        {/* 7. Bangla AI Copilot */}
        <Route path="copilot" element={<Copilot />} />
        
        {/* 8. Approval & Audit Center */}
        <Route path="approvals" element={<Approvals />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
