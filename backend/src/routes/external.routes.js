import express from 'express';
import { z } from 'zod';
import { fetchWeather, fetchLogisticsCorridorWeather, LOGISTICS_HUBS } from '../services/external/openMeteoService.js';
import { calculateRoute } from '../services/external/osrmService.js';
import { geocodeLocation, reverseGeocode } from '../services/external/nominatimService.js';
import { getExchangeRates, convertProcurementCost } from '../services/external/frankfurterService.js';
import { fetchHealthIndicators } from '../services/external/whoGhoService.js';
import { db } from '../services/db.js';

const router = express.Router();

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------
const WeatherQuerySchema = z.object({
  lat: z.coerce.number().min(20).max(27).default(23.8103),
  lon: z.coerce.number().min(88).max(93).default(90.4125)
});

const RouteQuerySchema = z.object({
  from_lat: z.coerce.number().min(20).max(27).optional(),
  from_lon: z.coerce.number().min(88).max(93).optional(),
  to_lat: z.coerce.number().min(20).max(27).optional(),
  to_lon: z.coerce.number().min(88).max(93).optional(),
  from_id: z.string().optional(),
  to_id: z.string().optional()
});

const GeocodeQuerySchema = z.object({
  q: z.string().min(1, 'Query parameter q is required')
});

const CurrencyConvertSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  from: z.string().default('USD'),
  quantity_kg: z.coerce.number().positive().default(1000),
  ingredient_name: z.string().default('Paracetamol Active Pharmaceutical Ingredient')
});

// -----------------------------------------------------------------------------
// 1. Open-Meteo Weather Routes
// -----------------------------------------------------------------------------

// GET /api/external/weather
router.get('/weather', async (req, res) => {
  try {
    const validated = WeatherQuerySchema.parse(req.query);
    const result = await fetchWeather(validated.lat, validated.lon);
    
    res.json({
      success: true,
      data_label: 'External observation',
      cache_status: result.cacheStatus,
      is_cached: result.isCached,
      timestamp: result.timestamp,
      data: result.data,
      attribution: 'Weather data by Open-Meteo.com under CC BY 4.0'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to fetch weather data', message: err.message });
  }
});

// GET /api/external/weather/corridors
router.get('/weather/corridors', async (req, res) => {
  try {
    const corridors = await fetchLogisticsCorridorWeather();
    res.json(corridors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch corridor weather', message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. OSRM Shipment Route Calculation
// -----------------------------------------------------------------------------

// GET /api/external/route
router.get('/route', async (req, res) => {
  try {
    const query = RouteQuerySchema.parse(req.query);
    let lat1 = query.from_lat;
    let lon1 = query.from_lon;
    let lat2 = query.to_lat;
    let lon2 = query.to_lon;

    // Resolve facility IDs if provided
    if (query.from_id && (!lat1 || !lon1)) {
      const fac = db.getFacilityById(query.from_id);
      if (fac && fac.coords) {
        lat1 = fac.coords[0];
        lon1 = fac.coords[1];
      }
    }

    if (query.to_id && (!lat2 || !lon2)) {
      const fac = db.getFacilityById(query.to_id);
      if (fac && fac.coords) {
        lat2 = fac.coords[0];
        lon2 = fac.coords[1];
      }
    }

    // Default to Dhaka CMSD -> Savar Upazila Health Complex if not provided
    lat1 = lat1 || 23.7800;
    lon1 = lon1 || 90.4000;
    lat2 = lat2 || 23.8583;
    lon2 = lon2 || 90.2567;

    const routeResult = await calculateRoute(lat1, lon1, lat2, lon2);

    res.json({
      success: true,
      data_label: routeResult.data.is_offline_approximation ? 'Simulated road estimate' : 'External observation',
      cache_status: routeResult.cacheStatus,
      is_cached: routeResult.isCached,
      timestamp: routeResult.timestamp,
      origin: { lat: lat1, lon: lon1, id: query.from_id || null },
      destination: { lat: lat2, lon: lon2, id: query.to_id || null },
      route: routeResult.data,
      attribution: routeResult.data.metadata.attribution
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to calculate route', message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. Nominatim Warehouse & Clinic Geocoding
// -----------------------------------------------------------------------------

// GET /api/external/geocode
router.get('/geocode', async (req, res) => {
  try {
    const validated = GeocodeQuerySchema.parse(req.query);
    const geocodeResult = await geocodeLocation(validated.q);

    res.json({
      success: true,
      data_label: 'External observation',
      cache_status: geocodeResult.cacheStatus,
      is_cached: geocodeResult.isCached,
      timestamp: geocodeResult.timestamp,
      data: geocodeResult.data,
      attribution: 'Data © OpenStreetMap contributors, ODbL 1.0'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: err.errors });
    }
    res.status(500).json({ error: 'Geocoding failed', message: err.message });
  }
});

// GET /api/external/reverse-geocode
router.get('/reverse-geocode', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'lat and lon query parameters must be numbers' });
    }

    const revResult = await reverseGeocode(lat, lon);
    res.json({
      success: true,
      data_label: 'External observation',
      timestamp: revResult.timestamp,
      data: revResult.data,
      attribution: 'Data © OpenStreetMap contributors, ODbL 1.0'
    });
  } catch (err) {
    res.status(500).json({ error: 'Reverse geocoding failed', message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 4. Frankfurter Currency Conversion
// -----------------------------------------------------------------------------

// GET /api/external/currency/rates
router.get('/currency/rates', async (req, res) => {
  try {
    const ratesResult = await getExchangeRates();
    res.json({
      success: true,
      data_label: 'External observation & market benchmark',
      cache_status: ratesResult.cacheStatus,
      is_cached: ratesResult.isCached,
      timestamp: ratesResult.timestamp,
      rates: ratesResult.data,
      attribution: 'Rates published by European Central Bank via Frankfurter.app'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch currency rates', message: err.message });
  }
});

// POST /api/external/currency/convert
router.post('/currency/convert', async (req, res) => {
  try {
    const body = CurrencyConvertSchema.parse(req.body);
    const conversion = await convertProcurementCost(
      body.amount,
      body.from,
      body.quantity_kg,
      body.ingredient_name
    );

    res.json({
      success: true,
      data_label: 'External observation & market benchmark',
      conversion
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: err.errors });
    }
    res.status(500).json({ error: 'Currency conversion failed', message: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. WHO GHO Public Health Indicators
// -----------------------------------------------------------------------------

// GET /api/external/public-health
router.get('/public-health', async (req, res) => {
  try {
    const healthResult = await fetchHealthIndicators();
    res.json({
      success: true,
      data_label: 'Public Health Benchmark',
      cache_status: healthResult.cacheStatus,
      is_cached: healthResult.isCached,
      timestamp: healthResult.timestamp,
      indicators: healthResult.data,
      attribution: 'Data provided by World Health Organization Global Health Observatory'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch WHO indicators', message: err.message });
  }
});

export default router;

