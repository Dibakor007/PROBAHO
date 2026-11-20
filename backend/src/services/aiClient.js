import { config } from '../config/env.js';

/**
 * AI Service Client
 * Proxies calls from Node.js backend to FastAPI AI Service (/ai/*)
 */

async function request(endpoint, options = {}) {
  const url = `${config.aiServiceUrl}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service responded with ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`[AI Service Client] Error calling ${endpoint}:`, err.message);
    throw err;
  }
}

export const aiClient = {
  checkHealth: () => request('/ai/health'),
  getSeedData: () => request('/ai/seed-data'),
  getInventory: () => request('/ai/inventory'),
  runForecast: (payload) => request('/ai/forecast', { method: 'POST', body: JSON.stringify(payload) }),
  runSimulation: (payload) => request('/ai/simulate', { method: 'POST', body: JSON.stringify(payload) }),
  runOptimizer: (payload) => request('/ai/optimize', { method: 'POST', body: JSON.stringify(payload) }),
  askCopilot: (payload) => request('/ai/copilot', { method: 'POST', body: JSON.stringify(payload) }),
  getAuditLogs: () => request('/ai/audit'),
  verifyAudit: () => request('/ai/verify-audit'),
  getEvaluationReport: () => request('/ai/evaluation-report'),
  getPromptLibrary: () => request('/ai/copilot/prompts'),
  executePrompt: (payload) => request('/ai/copilot/prompts/execute', { method: 'POST', body: JSON.stringify(payload) })
};

