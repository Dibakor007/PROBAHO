import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { externalCache } from '../src/services/external/cache.js';
import { calculateWeatherRiskIndex, fetchWeather } from '../src/services/external/openMeteoService.js';
import { calculateRoute } from '../src/services/external/osrmService.js';
import { geocodeLocation } from '../src/services/external/nominatimService.js';
import { getExchangeRates, convertProcurementCost } from '../src/services/external/frankfurterService.js';
import { fetchHealthIndicators } from '../src/services/external/whoGhoService.js';
import app from '../src/app.js';

describe('External APIs Integration Suite', () => {

  describe('1. In-Memory Cache with Stale Fallback', () => {
    test('Stores and retrieves values with timestamps and cacheStatus', async () => {
      externalCache.set('test_key', { foo: 'bar' }, 1000, 'Test Source');
      const entry = externalCache.get('test_key');
      assert.ok(entry);
      assert.equal(entry.data.foo, 'bar');
      assert.equal(entry.isCached, true);
      assert.equal(entry.isStale, false);
      assert.ok(entry.timestamp);
    });

    test('getOrFetch returns cached value without re-fetching', async () => {
      let callCount = 0;
      const fetchFn = async () => {
        callCount++;
        return { count: callCount };
      };

      const first = await externalCache.getOrFetch('call_count_key', fetchFn, 5000);
      assert.equal(first.data.count, 1);
      assert.equal(first.cacheStatus, 'MISS');

      const second = await externalCache.getOrFetch('call_count_key', fetchFn, 5000);
      assert.equal(second.data.count, 1);
      assert.equal(second.cacheStatus, 'HIT');
      assert.equal(callCount, 1);
    });
  });

  describe('2. Open-Meteo Weather Risk Monitoring', () => {
    test('Calculates low risk under mild rainfall and low winds', () => {
      const risk = calculateWeatherRiskIndex({
        precipitation_sum: [2.0, 1.5, 0.0],
        wind_speed_10m_max: [12.0, 10.0, 8.0]
      });
      assert.equal(risk.tier, 'LOW');
      assert.equal(risk.transitDelayDays, 0);
      assert.ok(risk.score < 25);
    });

    test('Calculates high or critical risk under extreme monsoon rainfall (>50mm)', () => {
      const risk = calculateWeatherRiskIndex({
        precipitation_sum: [75.0, 40.0],
        wind_speed_10m_max: [45.0, 30.0]
      });
      assert.ok(['HIGH', 'CRITICAL'].includes(risk.tier));
      assert.ok(risk.transitDelayDays >= 2);
      assert.ok(risk.score >= 45);
    });

    test('fetchWeather returns weather data with attribution and metadata', async () => {
      const res = await fetchWeather(23.8103, 90.4125);
      assert.ok(res.data);
      assert.ok(res.data.current);
      assert.ok(res.data.weatherRisk);
      assert.match(res.data.metadata.source, /Open-Meteo/);
      assert.match(res.data.metadata.attribution, /CC BY 4.0/);
    });
  });

  describe('3. OSRM Shipment Route Calculation', () => {
    test('Calculates driving route between Dhaka CMSD and Savar', async () => {
      // Dhaka CMSD [23.78, 90.40] to Savar [23.8583, 90.2567]
      const res = await calculateRoute(23.78, 90.40, 23.8583, 90.2567);
      assert.ok(res.data);
      assert.ok(res.data.distance_km > 15 && res.data.distance_km < 60);
      assert.ok(res.data.duration_minutes > 15);
      assert.ok(res.data.geometry);
      assert.equal(res.data.geometry.type, 'LineString');
      assert.ok(res.data.geometry.coordinates.length >= 2);
      assert.ok(res.data.metadata);
    });
  });

  describe('4. Nominatim Geocoding Service', () => {
    test('Geocodes query in Bangladesh with local fallback fallback', async () => {
      const res = await geocodeLocation('Dhaka');
      assert.ok(res.data);
      assert.ok(res.data.results.length >= 1);
      const top = res.data.results[0];
      assert.ok(top.lat && top.lon);
      assert.ok(top.display_name);
    });

    test('Falls back gracefully for local health complexes', async () => {
      const res = await geocodeLocation('Pirganj Upazila Health Complex');
      assert.ok(res.data);
      assert.ok(res.data.count >= 1);
    });
  });

  describe('5. Frankfurter Currency Conversion', () => {
    test('Calculates BDT conversion rates from foreign currencies', async () => {
      const res = await getExchangeRates();
      assert.ok(res.data);
      assert.ok(res.data.rates_to_bdt);
      assert.equal(res.data.rates_to_bdt.USD, 122.50);
      assert.ok(res.data.rates_to_bdt.INR > 1.0 && res.data.rates_to_bdt.INR < 2.0);
      assert.ok(res.data.rates_to_bdt.CNY > 14.0 && res.data.rates_to_bdt.CNY < 20.0);
    });

    test('Converts foreign procurement cost into BDT with import duty', async () => {
      const conv = await convertProcurementCost(10000, 'USD', 2000, 'Paracetamol Active Pharmaceutical Ingredient');
      assert.equal(conv.foreign_amount, 10000);
      assert.equal(conv.foreign_currency, 'USD');
      assert.equal(conv.quantity_kg, 2000);
      assert.equal(conv.total_cost_bdt, 1225000);
      assert.equal(conv.cost_per_kg_bdt, 612.5);
      assert.equal(conv.estimated_customs_duty_bdt, 61250);
      assert.equal(conv.total_landed_cost_bdt, 1286250);
      assert.match(conv.ingredient_name, /Active Pharmaceutical Ingredient/);
    });
  });

  describe('6. WHO GHO Public Health Indicators', () => {
    test('Retrieves Bangladesh essential medicine benchmarks', async () => {
      const res = await fetchHealthIndicators();
      assert.ok(res.data);
      assert.equal(res.data.country, 'Bangladesh');
      assert.ok(res.data.benchmarks.length >= 2);
      const targetAvail = res.data.benchmarks.find(b => b.code === 'WHO_EM_AVAIL');
      assert.ok(targetAvail);
      assert.equal(targetAvail.target_pct, 80.0);
    });
  });

  describe('7. Express External API Endpoints', () => {
    test('GET /api/external/weather returns JSON with attribution', async () => {
      const server = app.listen(0);
      const port = server.address().port;
      try {
        const res = await fetch(`http://localhost:${port}/api/external/weather?lat=23.81&lon=90.41`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.data_label, 'External observation');
        assert.ok(json.data);
        assert.match(json.attribution, /Open-Meteo/);
      } finally {
        server.close();
      }
    });

    test('GET /api/external/route calculates distance and duration', async () => {
      const server = app.listen(0);
      const port = server.address().port;
      try {
        const res = await fetch(`http://localhost:${port}/api/external/route?from_lat=23.78&from_lon=90.40&to_lat=23.858&to_lon=90.256`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.ok(json.route.distance_km > 0);
        assert.ok(json.route.duration_minutes > 0);
      } finally {
        server.close();
      }
    });

    test('POST /api/external/currency/convert returns BDT procurement calculations', async () => {
      const server = app.listen(0);
      const port = server.address().port;
      try {
        const res = await fetch(`http://localhost:${port}/api/external/currency/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 5000,
            from: 'USD',
            quantity_kg: 500,
            ingredient_name: 'Amoxicillin Active Pharmaceutical Ingredient'
          })
        });
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.conversion.total_cost_bdt, 612500);
        assert.equal(json.conversion.cost_per_kg_bdt, 1225);
      } finally {
        server.close();
      }
    });

    test('GET /api/external/public-health returns WHO benchmarks', async () => {
      const server = app.listen(0);
      const port = server.address().port;
      try {
        const res = await fetch(`http://localhost:${port}/api/external/public-health`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.data_label, 'Public Health Benchmark');
        assert.ok(json.indicators.benchmarks.length > 0);
      } finally {
        server.close();
      }
    });
  });

});

