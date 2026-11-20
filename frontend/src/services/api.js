import axios from 'axios';

const rawBackendUrl = (import.meta.env.VITE_BACKEND_URL || 'https://probaho-backend-vdxy.onrender.com').replace(/\/+$/, '');
export const NODE_API_BASE = rawBackendUrl.endsWith('/api') ? rawBackendUrl : `${rawBackendUrl}/api`;

const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://probaho-backend-vdxy.onrender.com').replace(/\/+$/, '');
export const AI_SERVICE_BASE = rawApiUrl.endsWith('/ai') ? rawApiUrl : `${rawApiUrl}/ai`;

export const apiClient = axios.create({
  baseURL: NODE_API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token if stored
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('probaho_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const probahoApi = {
  // Node.js Backend routes
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  getDashboardSummary: () => apiClient.get('/dashboard/summary'),
  getFacilities: () => apiClient.get('/facilities'),
  getMedicines: () => apiClient.get('/medicines'),
  getInventory: (facilityId) => apiClient.get('/inventory', { params: { facility_id: facilityId } }),
  addStockRecord: (record) => apiClient.post('/inventory', record),
  getSuppliers: () => apiClient.get('/suppliers'),
  getShipments: () => apiClient.get('/shipments'),
  createScenario: (scenario) => apiClient.post('/scenarios', scenario),
  getRecommendations: () => apiClient.get('/recommendations'),
  approveRecommendation: (id, payload) => apiClient.post(`/recommendations/${id}/approve`, payload),
  rejectRecommendation: (id, payload) => apiClient.post(`/recommendations/${id}/reject`, payload),
  getAuditLogs: () => apiClient.get('/audit-logs'),
  verifyAudit: () => apiClient.get('/audit/verify'),
  askCopilot: (chatPayload) => apiClient.post('/copilot/chat', chatPayload),

  // External APIs (Open-Meteo, OSRM, Nominatim, Frankfurter, WHO GHO)
  getWeather: (lat, lon) => apiClient.get('/external/weather', { params: { lat, lon } }),
  getCorridorWeather: () => apiClient.get('/external/weather/corridors'),
  getRoute: (fromLat, fromLon, toLat, toLon, fromId, toId) => 
    apiClient.get('/external/route', { params: { from_lat: fromLat, from_lon: fromLon, to_lat: toLat, to_lon: toLon, from_id: fromId, to_id: toId } }),
  geocode: (query) => apiClient.get('/external/geocode', { params: { q: query } }),
  reverseGeocode: (lat, lon) => apiClient.get('/external/reverse-geocode', { params: { lat, lon } }),
  getCurrencyRates: () => apiClient.get('/external/currency/rates'),
  convertCurrency: (payload) => apiClient.post('/external/currency/convert', payload),
  getPublicHealthIndicators: () => apiClient.get('/external/public-health'),

  // Direct AI Service routes
  forecastDemand: (payload) => axios.post(`${AI_SERVICE_BASE}/forecast/demand`, payload),
  forecastIngredientRequirements: (payload) => axios.post(`${AI_SERVICE_BASE}/forecast/api-requirements`, payload),
  calculateSupplierRisk: (payload) => axios.post(`${AI_SERVICE_BASE}/risk/supplier`, payload),
  simulateDisruption: (payload) => axios.post(`${AI_SERVICE_BASE}/simulate/disruption`, payload),
  optimizeRedistribution: (payload) => axios.post(`${AI_SERVICE_BASE}/optimize/redistribution`, payload),
  analyzeExpiry: (payload) => axios.post(`${AI_SERVICE_BASE}/expiry/analyze`, payload),
  explainWithCopilot: (payload) => axios.post(`${AI_SERVICE_BASE}/copilot/explain`, payload),
  checkHealth: () => axios.get(`${AI_SERVICE_BASE}/health`),
};

export default probahoApi;

