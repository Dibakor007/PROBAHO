import { externalCache } from './cache.js';
import fs from 'fs';
import path from 'path';

/**
 * OpenStreetMap Nominatim Geocoding Service
 * Complies strictly with Nominatim Usage Policy:
 * 1. Valid custom User-Agent identifying PROBAHO.
 * 2. Caching responses.
 * 3. Rate limiting (min 1 second between live calls).
 * 4. Bounded to Bangladesh (countrycodes=bd).
 * Attribution: "Data © OpenStreetMap contributors, ODbL 1.0"
 */

let lastNominatimRequestTime = 0;

/**
 * Throttle helper to respect 1 req/sec policy
 */
async function throttleNominatim() {
  const now = Date.now();
  const timeSinceLast = now - lastNominatimRequestTime;
  if (timeSinceLast < 1100) {
    const waitMs = 1100 - timeSinceLast;
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
  lastNominatimRequestTime = Date.now();
}

/**
 * Load local fallback facilities from sample-data/facilities.json
 */
function getLocalFacilitiesFallback(query) {
  try {
    const facilitiesPath = path.resolve(process.cwd(), '../sample-data/facilities.json');
    const altPath = path.resolve(process.cwd(), 'sample-data/facilities.json');
    const filePath = fs.existsSync(facilitiesPath) ? facilitiesPath : altPath;
    
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const lower = query.toLowerCase();
      const matches = data.filter(f => 
        (f.name && f.name.toLowerCase().includes(lower)) ||
        (f.name_en && f.name_en.toLowerCase().includes(lower)) ||
        (f.location && f.location.toLowerCase().includes(lower)) ||
        (f.id && f.id.toLowerCase().includes(lower))
      );
      
      return matches.map(m => ({
        place_id: `local-${m.id}`,
        osm_id: m.id,
        lat: m.coords ? String(m.coords[0]) : '23.8103',
        lon: m.coords ? String(m.coords[1]) : '90.4125',
        display_name: `${m.name_en || m.name}, ${m.location || 'Bangladesh'}`,
        type: m.type || 'facility',
        category: 'healthcare',
        importance: 0.8,
        source: 'Local Facility Database'
      }));
    }
  } catch (err) {
    console.warn('[Nominatim] Error reading local facilities fallback:', err.message);
  }
  return [];
}

/**
 * Geocode address/facility query in Bangladesh
 * @param {string} query Search terms (e.g., "Savar Health Complex", "Dhaka CMSD", "Gazipur")
 */
export async function geocodeLocation(query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return { data: [], metadata: { source: 'Nominatim', count: 0 } };
  }

  const cleanQuery = query.trim();
  const cacheKey = `nominatim_search_${cleanQuery.toLowerCase()}`;
  const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days cache for geocoding

  return await externalCache.getOrFetch(
    cacheKey,
    async () => {
      await throttleNominatim();

      const encoded = encodeURIComponent(cleanQuery);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=bd&limit=5&addressdetails=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PROBAHO-SupplyChain-Platform/1.0 (contact@probaho.bd)'
          }
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Nominatim returned status ${res.status}`);
        }

        const data = await res.json();
        
        // If Nominatim returns empty, merge with local facility database search
        if (!data || data.length === 0) {
          const localFallback = getLocalFacilitiesFallback(cleanQuery);
          return {
            query: cleanQuery,
            results: localFallback,
            count: localFallback.length,
            metadata: {
              source: localFallback.length ? 'Local Facility Database (Nominatim match empty)' : 'Nominatim',
              attribution: 'Data © OpenStreetMap contributors / PROBAHO facility registry',
              data_type: 'External observation & local directory',
              fetched_at: new Date().toISOString()
            }
          };
        }

        const mapped = data.map(item => ({
          place_id: item.place_id,
          osm_id: item.osm_id,
          lat: item.lat,
          lon: item.lon,
          display_name: item.display_name,
          type: item.type,
          category: item.class,
          importance: item.importance,
          address: item.address,
          source: 'Nominatim'
        }));

        return {
          query: cleanQuery,
          results: mapped,
          count: mapped.length,
          metadata: {
            source: 'Nominatim (OpenStreetMap)',
            attribution: 'Data © OpenStreetMap contributors, ODbL 1.0',
            data_type: 'External observation',
            fetched_at: new Date().toISOString()
          }
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    TTL,
    'Nominatim Geocoder',
    {
      query: cleanQuery,
      results: getLocalFacilitiesFallback(cleanQuery),
      count: getLocalFacilitiesFallback(cleanQuery).length,
      metadata: {
        source: 'Local Facility Database (Offline fallback)',
        attribution: 'PROBAHO facility directory',
        data_type: 'Database record',
        fetched_at: new Date().toISOString()
      }
    }
  );
}

/**
 * Reverse geocode coordinates to location name
 */
export async function reverseGeocode(lat, lon) {
  const cacheKey = `nominatim_reverse_${Number(lat).toFixed(4)}_${Number(lon).toFixed(4)}`;
  const TTL = 7 * 24 * 60 * 60 * 1000;

  return await externalCache.getOrFetch(
    cacheKey,
    async () => {
      await throttleNominatim();
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PROBAHO-SupplyChain-Platform/1.0 (contact@probaho.bd)'
          }
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`Nominatim reverse returned ${res.status}`);
        const data = await res.json();

        return {
          lat,
          lon,
          display_name: data.display_name || `${lat}, ${lon}`,
          address: data.address || {},
          metadata: {
            source: 'Nominatim Reverse Geocoder',
            attribution: 'Data © OpenStreetMap contributors, ODbL 1.0',
            data_type: 'External observation',
            fetched_at: new Date().toISOString()
          }
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    TTL,
    'Nominatim Reverse Geocoder'
  );
}

