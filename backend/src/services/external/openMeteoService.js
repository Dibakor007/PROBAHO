import { externalCache } from './cache.js';

/**
 * Open-Meteo Weather Risk Service
 * Free weather forecast API (non-commercial & commercial with attribution).
 * Monitors monsoon rainfall, storm windspeed, and flood risk for Bangladesh transport corridors.
 * Attribution: "Weather data by Open-Meteo.com under CC BY 4.0"
 */

// Default coordinates for key Bangladesh pharmaceutical logistics hubs
export const LOGISTICS_HUBS = {
  dhaka: { name: 'Dhaka CMSD Hub', lat: 23.8103, lon: 90.4125, division: 'Dhaka' },
  chittagong: { name: 'Chittagong Port Terminal', lat: 22.3569, lon: 91.7832, division: 'Chittagong' },
  gazipur: { name: 'Gazipur Manufacturing Zone', lat: 24.0023, lon: 90.4264, division: 'Dhaka' },
  rangpur: { name: 'Rangpur Upazila Corridor', lat: 25.7439, lon: 89.2752, division: 'Rangpur' },
  sylhet: { name: 'Sylhet Flood-Prone Belt', lat: 24.8949, lon: 91.8687, division: 'Sylhet' },
  barishal: { name: 'Barishal Coastal Belt', lat: 22.7010, lon: 90.3535, division: 'Barishal' },
  khulna: { name: 'Khulna Mongla Port Route', lat: 22.8456, lon: 89.5403, division: 'Khulna' }
};

/**
 * Compute composite flood & weather risk index (0 to 100)
 * Evaluates rainfall mm, rain probability, and maximum wind speed.
 */
export function calculateWeatherRiskIndex(daily) {
  if (!daily || !daily.precipitation_sum || !daily.precipitation_sum.length) {
    return { score: 10, tier: 'LOW', transitDelayDays: 0, alert: 'Normal road transit conditions.' };
  }

  const maxRain = Math.max(...daily.precipitation_sum);
  const maxWind = daily.wind_speed_10m_max ? Math.max(...daily.wind_speed_10m_max) : 10;
  
  // Rain scoring: 0-10mm = 10pts, 10-30mm = 30pts, 30-60mm = 60pts, 60-100mm+ = 90-100pts
  let rainScore = (maxRain / 80) * 60;
  if (rainScore > 60) rainScore = 60;

  // Wind scoring: 0-20km/h = 5pts, 20-50km/h = 25pts, >50km/h = 40pts
  let windScore = (maxWind / 60) * 40;
  if (windScore > 40) windScore = 40;

  const score = Math.min(100, Math.round(rainScore + windScore));

  let tier = 'LOW';
  let transitDelayDays = 0;
  let alert = 'Optimal weather conditions. Normal transit expected.';

  if (score >= 70) {
    tier = 'CRITICAL';
    transitDelayDays = 3;
    alert = 'Severe monsoon flash flood / storm hazard. Highway transit disrupted (+2 to +3 days delay).';
  } else if (score >= 45) {
    tier = 'HIGH';
    transitDelayDays = 2;
    alert = 'Heavy monsoon precipitation. Waterlogging likely on low-lying highways (+1 to +2 days delay).';
  } else if (score >= 25) {
    tier = 'MEDIUM';
    transitDelayDays = 1;
    alert = 'Moderate rainfall. Minor transit delays (+0.5 to +1 day delay) in local corridors.';
  }

  return {
    score,
    tier,
    transitDelayDays,
    alert,
    maxRainMm: maxRain,
    maxWindKmh: maxWind
  };
}

/**
 * Fetch weather forecast for specific coordinates
 */
export async function fetchWeather(lat, lon, timezone = 'Asia/Dhaka') {
  const cacheKey = `weather_${Number(lat).toFixed(3)}_${Number(lon).toFixed(3)}`;
  const TTL = 30 * 60 * 1000; // 30 minutes cache

  return await externalCache.getOrFetch(
    cacheKey,
    async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,precipitation_probability_max,wind_speed_10m_max&timezone=${encodeURIComponent(timezone)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Open-Meteo returned status ${res.status}`);
        }

        const data = await res.json();
        const risk = calculateWeatherRiskIndex(data.daily);

        return {
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation,
          timezone: data.timezone,
          current: {
            temperature_c: data.current?.temperature_2m,
            humidity_pct: data.current?.relative_humidity_2m,
            precipitation_mm: data.current?.precipitation,
            wind_speed_kmh: data.current?.wind_speed_10m,
            time: data.current?.time
          },
          daily: data.daily,
          weatherRisk: risk,
          metadata: {
            source: 'Open-Meteo',
            attribution: 'Weather data by Open-Meteo.com under CC BY 4.0',
            data_type: 'External observation',
            fetched_at: new Date().toISOString()
          }
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    TTL,
    'Open-Meteo Weather API',
    // Fallback data if offline
    {
      latitude: Number(lat),
      longitude: Number(lon),
      current: {
        temperature_c: 28.5,
        humidity_pct: 75,
        precipitation_mm: 5.2,
        wind_speed_kmh: 12.0,
        time: new Date().toISOString()
      },
      daily: {
        time: [new Date().toISOString().slice(0, 10)],
        precipitation_sum: [8.5],
        precipitation_probability_max: [45],
        wind_speed_10m_max: [18.0]
      },
      weatherRisk: {
        score: 28,
        tier: 'MEDIUM',
        transitDelayDays: 1,
        alert: 'Moderate monsoon activity (Offline benchmark fallback).',
        maxRainMm: 8.5,
        maxWindKmh: 18.0
      },
      metadata: {
        source: 'Open-Meteo (Offline Benchmark)',
        attribution: 'Weather data by Open-Meteo.com under CC BY 4.0',
        data_type: 'Simulated benchmark fallback',
        fetched_at: new Date().toISOString()
      }
    }
  );
}

/**
 * Fetch weather across all major Bangladesh supply chain transit corridors
 */
export async function fetchLogisticsCorridorWeather() {
  const results = {};
  for (const [key, hub] of Object.entries(LOGISTICS_HUBS)) {
    try {
      const weatherResult = await fetchWeather(hub.lat, hub.lon);
      results[key] = {
        name: hub.name,
        division: hub.division,
        coordinates: [hub.lat, hub.lon],
        weather: weatherResult.data
      };
    } catch (err) {
      results[key] = {
        name: hub.name,
        division: hub.division,
        coordinates: [hub.lat, hub.lon],
        error: err.message
      };
    }
  }
  return {
    corridors: results,
    timestamp: new Date().toISOString(),
    attribution: 'Weather data by Open-Meteo.com under CC BY 4.0',
    data_label: 'External observation'
  };
}

