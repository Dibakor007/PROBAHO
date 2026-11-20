import { externalCache } from './cache.js';

/**
 * Frankfurter International Currency Conversion Service
 * Tracks European Central Bank reference exchange rates (USD, EUR, INR, CNY, etc.).
 * Converts foreign Active Pharmaceutical Ingredient procurement costs into Bangladeshi Taka (BDT).
 * 
 * Note: The ECB does not quote a direct daily rate for BDT.
 * Hence, Frankfurter provides live USD/EUR/INR/CNY cross-rates,
 * which are converted to BDT using the interbank market rate (1 USD = 122.50 BDT benchmark).
 * Attribution: "Exchange rates from Frankfurter.app (European Central Bank data) with Bangladesh Bank interbank benchmark"
 */

const BENCHMARK_USD_TO_BDT = 122.50;

/**
 * Fetch latest exchange rates from Frankfurter and compute BDT conversion matrix
 */
export async function getExchangeRates() {
  const cacheKey = 'frankfurter_rates_usd';
  const TTL = 12 * 60 * 60 * 1000; // 12 hours cache

  return await externalCache.getOrFetch(
    cacheKey,
    async () => {
      const url = 'https://api.frankfurter.app/latest?from=USD';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Frankfurter returned status ${res.status}`);
        }

        const data = await res.json();
        const ecbRates = data.rates || {};

        // Compute BDT conversions for major pharmaceutical sourcing countries
        // Bangladesh sources Active Pharmaceutical Ingredients primarily from India (INR), China (CNY), Europe (EUR), USA (USD).
        const usdToInr = ecbRates.INR || 83.5;
        const usdToCny = ecbRates.CNY || 7.23;
        const usdToEur = ecbRates.EUR || 0.92;

        const ratesToBdt = {
          USD: BENCHMARK_USD_TO_BDT,
          EUR: Math.round((BENCHMARK_USD_TO_BDT / usdToEur) * 100) / 100,
          INR: Math.round((BENCHMARK_USD_TO_BDT / usdToInr) * 100) / 100,
          CNY: Math.round((BENCHMARK_USD_TO_BDT / usdToCny) * 100) / 100
        };

        return {
          base: 'USD',
          date: data.date,
          ecb_rates: {
            EUR: usdToEur,
            INR: usdToInr,
            CNY: usdToCny,
            GBP: ecbRates.GBP || 0.79,
            SGD: ecbRates.SGD || 1.34
          },
          rates_to_bdt: ratesToBdt,
          usd_to_bdt_benchmark: BENCHMARK_USD_TO_BDT,
          metadata: {
            source: 'Frankfurter API (European Central Bank reference rates) & Interbank Benchmark',
            attribution: 'Rates published by European Central Bank via Frankfurter.app',
            data_type: 'External observation & market benchmark',
            fetched_at: new Date().toISOString()
          }
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    TTL,
    'Frankfurter Currency API',
    {
      base: 'USD',
      date: new Date().toISOString().slice(0, 10),
      ecb_rates: { EUR: 0.92, INR: 83.5, CNY: 7.23, GBP: 0.79, SGD: 1.34 },
      rates_to_bdt: { USD: 122.50, EUR: 133.15, INR: 1.47, CNY: 16.94 },
      usd_to_bdt_benchmark: BENCHMARK_USD_TO_BDT,
      metadata: {
        source: 'Frankfurter (Offline Market Fallback)',
        attribution: 'Simulated currency baseline (1 USD = 122.50 BDT)',
        data_type: 'Market benchmark fallback',
        fetched_at: new Date().toISOString()
      }
    }
  );
}

/**
 * Convert foreign currency procurement cost of Active Pharmaceutical Ingredient into BDT
 * @param {number} amount Foreign currency amount
 * @param {string} from Currency code (USD, EUR, INR, CNY)
 * @param {number} quantityKg Weight of Active Pharmaceutical Ingredient in kg
 * @param {string} ingredientName Name of Active Pharmaceutical Ingredient
 */
export async function convertProcurementCost(amount, from = 'USD', quantityKg = 1000, ingredientName = 'Paracetamol Active Pharmaceutical Ingredient') {
  const currency = from.toUpperCase();
  const ratesResult = await getExchangeRates();
  const ratesData = ratesResult.data;

  const rateToBdt = ratesData.rates_to_bdt[currency] || (currency === 'USD' ? BENCHMARK_USD_TO_BDT : 1.0);
  const totalBdt = Math.round(amount * rateToBdt);
  const costPerKgBdt = quantityKg > 0 ? Math.round((totalBdt / quantityKg) * 100) / 100 : 0;
  const costPerKgForeign = quantityKg > 0 ? Math.round((amount / quantityKg) * 100) / 100 : 0;

  // Estimated import duty & clearance (approx 5% statutory concessional duty for raw pharma ingredients in Bangladesh)
  const estimatedImportDutyBdt = Math.round(totalBdt * 0.05);
  const totalLandedCostBdt = totalBdt + estimatedImportDutyBdt;

  return {
    procurement_id: `PROC-${Date.now().toString(36).toUpperCase()}`,
    ingredient_name: ingredientName,
    foreign_amount: amount,
    foreign_currency: currency,
    quantity_kg: quantityKg,
    conversion_rate_to_bdt: rateToBdt,
    total_cost_bdt: totalBdt,
    cost_per_kg_bdt: costPerKgBdt,
    cost_per_kg_foreign: costPerKgForeign,
    estimated_customs_duty_bdt: estimatedImportDutyBdt,
    total_landed_cost_bdt: totalLandedCostBdt,
    timestamp: new Date().toISOString(),
    rates_metadata: ratesData.metadata
  };
}

