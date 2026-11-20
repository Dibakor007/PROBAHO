const translations = {
  // App-wide
  appName: { en: 'PROBAHO', bn: 'প্রবাহ' },
  appSubtitle: { en: 'Supply Chain Decision Support', bn: 'সরবরাহ চেইন সিদ্ধান্ত সহায়তা' },
  syntheticBanner: {
    en: 'Synthetic data — for demonstration only',
    bn: 'সিন্থেটিক ডেটা — শুধুমাত্র প্রদর্শনের জন্য',
  },
  language: { en: 'বাংলা', bn: 'English' },

  // Navigation (9 Core Sections)
  navDashboard: { en: 'Executive Dashboard', bn: 'নির্বাহী ড্যাশবোর্ড' },
  navDigitalTwin: { en: 'Digital Twin Network', bn: 'ডিজিটাল টুইন নেটওয়ার্ক' },
  navInventory: { en: 'Medicine Inventory', bn: 'ওষুধ মজুদ' },
  navForecast: { en: 'AI Forecast Center', bn: 'এআই পূর্বাভাস কেন্দ্র' },
  navSimulator: { en: 'Disruption Simulator', bn: 'ব্যাঘাত সিমুলেটর' },
  navRedistribution: { en: 'Smart Redistribution', bn: 'স্মার্ট পুনর্বণ্টন' },
  navCopilot: { en: 'Bangla AI Copilot', bn: 'বাংলা এআই কোপাইলট' },
  navApprovals: { en: 'Approval & Audit', bn: 'অনুমোদন ও নিরীক্ষা' },

  // Dashboard
  totalFacilities: { en: 'Total Facilities', bn: 'মোট স্বাস্থ্যকেন্দ্র' },
  medicinesTracked: { en: 'Medicines Tracked', bn: 'ট্র্যাককৃত ওষুধ' },
  criticalAlerts: { en: 'Critical Alerts', bn: 'জরুরি সতর্কতা' },
  pendingApprovals: { en: 'Pending Approvals', bn: 'অপেক্ষমাণ অনুমোদন' },
  nationalAvailability: { en: 'National Medicine Availability', bn: 'জাতীয় ওষুধ প্রাপ্যতা' },
  avgDaysOfCover: { en: 'Average Days of Cover', bn: 'গড় মজুদ দিন' },
  alerts: { en: 'Alerts', bn: 'সতর্কতা' },
  lowDaysOfCover: { en: 'Low days of cover', bn: 'কম দিনের মজুদ' },
  expiryWarning: { en: 'Expiry warning', bn: 'মেয়াদ সতর্কতা' },
  daysOfCover: { en: 'Days of Cover', bn: 'মজুদ দিন' },
  ingredientShipmentRisks: { en: 'Active Pharmaceutical Ingredient Shipment Risks', bn: 'সক্রিয় ফার্মাসিউটিক্যাল উপাদান চালান ঝুঁকি' },
  recentActivity: { en: 'Recent System Activity', bn: 'সাম্প্রতিক সিস্টেম কার্যক্রম' },

  // Digital Twin
  digitalTwinTitle: { en: 'Supply Chain Digital Twin', bn: 'সরবরাহ চেইন ডিজিটাল টুইন' },
  digitalTwinSubtitle: { 
    en: 'Interactive imported Active Pharmaceutical Ingredient to clinic shelf network', 
    bn: 'আমদানিকৃত সক্রিয় ফার্মাসিউটিক্যাল উপাদান থেকে ক্লিনিক শেলফ পর্যন্ত মিথস্ক্রিয় নেটওয়ার্ক' 
  },
  upstreamSupplier: { en: 'Active Pharmaceutical Ingredient Supplier', bn: 'সক্রিয় ফার্মাসিউটিক্যাল উপাদান সরবরাহকারী' },
  manufacturer: { en: 'Medicine Formulation Plant', bn: 'ওষুধ উৎপাদন কারখানা' },
  centralWarehouse: { en: 'Central Medical Stores Depot', bn: 'কেন্দ্রীয় ওষুধ গুদাম' },
  nodeDetails: { en: 'Node Details', bn: 'নোড বিবরণ' },
  routesAndLeadTimes: { en: 'Shipment Routes & Lead Times', bn: 'চালান রুট ও লিড টাইম' },
  statusNormal: { en: 'Normal', bn: 'স্বাভাবিক' },
  statusWarning: { en: 'Warning', bn: 'সতর্কবার্তা' },
  statusCritical: { en: 'Critical', bn: 'সংকটজনক' },

  // Inventory
  inventoryTitle: { en: 'Medicine Inventory & Batches', bn: 'ওষুধ মজুদ ও ব্যাচ' },
  inventorySubtitle: { 
    en: 'Facility-level batches, FEFO consumption tracking & stock adjustments', 
    bn: 'স্বাস্থ্যকেন্দ্র ভিত্তিক ব্যাচ, ফেফো ব্যবহার ট্র্যাকিং ও মজুদ সমন্বয়' 
  },
  batchNumber: { en: 'Batch Number', bn: 'ব্যাচ নম্বর' },
  manufactureDate: { en: 'Mfg Date', bn: 'উৎপাদন তারিখ' },
  expiryDate: { en: 'Expiry Date', bn: 'মেয়াদ শেষ' },
  daysUntilExpiry: { en: 'Days Until Expiry', bn: 'মেয়াদের বাকি দিন' },
  fefoRecommendation: { en: 'FEFO Recommendation', bn: 'ফেফো সুপারিশ' },
  dispenseFirst: { en: 'Dispense First (FEFO)', bn: 'প্রথমে বিতরণ করুন (ফেফো)' },
  riskOfExpiryWaste: { en: 'Risk of Expiry Waste', bn: 'মেয়াদোত্তীর্ণ অপচয়ের ঝুঁকি' },
  adjustStock: { en: 'Record Stock Adjustment', bn: 'মজুদ সমন্বয় রেকর্ড করুন' },
  uploadCSV: { en: 'CSV Batch Intake', bn: 'সিএসভি ব্যাচ আপলোড' },

  // Simulator
  simulatorTitle: { en: 'Disruption Simulator', bn: 'ব্যাঘাত সিমুলেটর' },
  simulatorSubtitle: { 
    en: 'Scenario-based disruption modeling and supply chain resilience testing', 
    bn: 'সাপ্লাই চেইন ব্যাঘাত ও পরিবহন স্থায়িত্ব সিমুলেশন' 
  },
  shipmentDelay: { en: 'Shipment Delay (days)', bn: 'চালান বিলম্ব (দিন)' },
  supplierShortfall: { en: 'Supplier Shortfall (%)', bn: 'সরবরাহকারী ঘাটতি (%)' },
  capacityCut: { en: 'Manufacturing Capacity Cut (%)', bn: 'উৎপাদন সক্ষমতা হ্রাস (%)' },
  freightCostIncrease: { en: 'Freight Cost Increase (%)', bn: 'পরিবহন খরচ বৃদ্ধি (%)' },
  runSimulation: { en: 'Run Simulation', bn: 'সিমুলেশন চালান' },
  baseline: { en: 'Baseline', bn: 'বেসলাইন' },
  disrupted: { en: 'Disrupted', bn: 'ব্যাঘাতপ্রাপ্ত' },
  propagationPath: { en: 'Propagation Path', bn: 'প্রসারণ পথ' },
  stockLevels: { en: 'Stock Levels Over Time', bn: 'সময়ের সাথে মজুদ স্তর' },

  // Forecast
  forecastTitle: { en: 'AI Forecast Center', bn: 'এআই পূর্বাভাস কেন্দ্র' },
  forecastSubtitle: { 
    en: '30-day demand projections and Active Pharmaceutical Ingredient planning', 
    bn: '৩০ দিনের চাহিদা পূর্বাভাস ও সক্রিয় ফার্মাসিউটিক্যাল উপাদান পরিকল্পনা' 
  },
  selectFacility: { en: 'Select Facility', bn: 'স্বাস্থ্যকেন্দ্র নির্বাচন' },
  selectMedicine: { en: 'Select Medicine', bn: 'ওষুধ নির্বাচন' },
  selectModel: { en: 'Forecasting Model', bn: 'পূর্বাভাস মডেল' },
  runForecast: { en: 'Run Forecast', bn: 'পূর্বাভাস চালান' },
  consumption: { en: 'Consumption', bn: 'ব্যবহার' },
  forecast: { en: 'Forecast', bn: 'পূর্বাভাস' },
  confidence: { en: 'Confidence Band (80%)', bn: 'আস্থা ব্যান্ড (৮০%)' },
  stockoutWarning: { en: 'Stockout Warning', bn: 'মজুদ শেষ সতর্কতা' },
  expiryExposure: { en: 'Expiry Exposure', bn: 'মেয়াদোত্তীর্ণ ঝুঁকি' },
  estimatedStockout: { en: 'Estimated Stockout Date', bn: 'আনুমানিক মজুদ শেষ তারিখ' },
  batch: { en: 'Batch', bn: 'ব্যাচ' },
  quantity: { en: 'Quantity', bn: 'পরিমাণ' },
  willExpireUnused: { en: 'Will Expire Unused', bn: 'অব্যবহৃত মেয়াদোত্তীর্ণ হবে' },
  forecastEvaluation: { en: 'Model Evaluation (CV)', bn: 'মডেল মূল্যায়ন (সিভি)' },

  // Redistribution
  redistTitle: { en: 'Smart Redistribution', bn: 'স্মার্ট পুনর্বণ্টন' },
  runOptimizer: { en: 'Run Optimizer (OR-Tools)', bn: 'অপটিমাইজার চালান (ওআর-টুলস)' },
  transferProposals: { en: 'Transfer Proposals', bn: 'স্থানান্তর প্রস্তাব' },
  from: { en: 'From', bn: 'থেকে' },
  to: { en: 'To', bn: 'গন্তব্য' },
  medicine: { en: 'Medicine', bn: 'ওষুধ' },
  reason: { en: 'Reason', bn: 'কারণ' },
  constraints: { en: 'Constraints Verified', bn: 'সীমাবদ্ধতা যাচাই' },
  safetyStock: { en: 'Safety stock maintained', bn: 'নিরাপত্তা মজুদ বজায়' },
  capacityOk: { en: 'Recipient capacity OK', bn: 'প্রাপকের ধারণক্ষমতা ঠিক আছে' },
  shelfLifeOk: { en: 'Shelf life sufficient', bn: 'শেলফ লাইফ যথেষ্ট' },
  equityMetrics: { en: 'Days-of-Cover Equity', bn: 'মজুদ-দিন সমতা' },
  min: { en: 'Min', bn: 'সর্বনিম্ন' },
  max: { en: 'Max', bn: 'সর্বোচ্চ' },
  spread: { en: 'Spread', bn: 'বিস্তার' },
  submitApproval: { en: 'Submit for Approval', bn: 'অনুমোদনের জন্য জমা দিন' },

  // Copilot
  copilotTitle: { en: 'Bangla AI Copilot', bn: 'বাংলা এআই কোপাইলট' },
  copilotDisclaimer: {
    en: 'LLM explains only — all quantities come from deterministic models',
    bn: 'এলএলএম শুধু ব্যাখ্যা করে — সমস্ত পরিমাণ নির্ণায়ক মডেল থেকে আসে',
  },
  typeMessage: { en: 'Type your message...', bn: 'আপনার বার্তা লিখুন...' },
  send: { en: 'Send', bn: 'পাঠান' },

  // Approvals
  approvalsTitle: { en: 'Approval & Audit Center', bn: 'অনুমোদন ও নিরীক্ষা কেন্দ্র' },
  pendingRecommendations: { en: 'Pending Recommendations', bn: 'অপেক্ষমাণ সুপারিশ' },
  approve: { en: 'Approve', bn: 'অনুমোদন' },
  reject: { en: 'Reject', bn: 'প্রত্যাখ্যান' },
  userName: { en: 'Your Name', bn: 'আপনার নাম' },
  reasonLabel: { en: 'Reason', bn: 'কারণ' },
  auditLog: { en: 'Audit Log', bn: 'নিরীক্ষা লগ' },
  timestamp: { en: 'Timestamp', bn: 'সময়' },
  event: { en: 'Event', bn: 'ঘটনা' },
  user: { en: 'User', bn: 'ব্যবহারকারী' },
  hash: { en: 'Hash', bn: 'হ্যাশ' },
  verifyChain: { en: 'Verify Chain', bn: 'চেইন যাচাই' },
  chainValid: { en: 'Audit chain is valid ✓', bn: 'নিরীক্ষা চেইন বৈধ ✓' },
  chainBroken: { en: 'Chain broken at entry', bn: 'চেইন ভেঙেছে এন্ট্রিতে' },

  // Health check
  startingService: { en: 'Starting AI service...', bn: 'এআই সেবা চালু হচ্ছে...' },
  serviceReady: { en: 'Service ready', bn: 'সেবা প্রস্তুত' },
  serviceUnavailable: { en: 'Service unavailable', bn: 'সেবা অনুপলব্ধ' },

  // Common
  loading: { en: 'Loading...', bn: 'লোড হচ্ছে...' },
  error: { en: 'Error loading data', bn: 'ডেটা লোডে ত্রুটি' },
  retry: { en: 'Retry', bn: 'পুনরায় চেষ্টা' },
  noData: { en: 'No data available', bn: 'কোনো ডেটা নেই' },
  day: { en: 'Day', bn: 'দিন' },
};

export function t(key, language) {
  const entry = translations[key];
  if (!entry) return key;
  return entry[language] || entry.en || key;
}

export default translations;
