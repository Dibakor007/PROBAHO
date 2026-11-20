import { externalCache } from './cache.js';

/**
 * OSRM Routing Service
 * Calculates road network driving distance, transit duration, and route geometry.
 * Free routing engine powered by OpenStreetMap road network data.
 * Attribution: "Routing data © OpenStreetMap contributors, OSRM"
 */

/**
 * Haversine distance formula (in km) between two [lat, lon] points.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Offline route approximation for Bangladesh road conditions:
 * Road winding tortuosity factor ~1.32x straight line.
 * Commercial pharmaceutical logistics average speed in Bangladesh ~40 km/h (including toll/ferry/checkpoints).
 */
function fallbackRoute(lat1, lon1, lat2, lon2) {
  const straightKm = haversineDistance(lat1, lon1, lat2, lon2);
  const roadKm = Math.round(straightKm * 1.32 * 10) / 10;
  const durationHours = Math.round((roadKm / 40) * 10) / 10;
  const durationMinutes = Math.round(durationHours * 60);

  // Generate intermediate waypoint for polyline visualization
  const midLat = (lat1 + lat2) / 2 + 0.02;
  const midLon = (lon1 + lon2) / 2 - 0.02;

  return {
    distance_km: roadKm,
    duration_minutes: durationMinutes,
    duration_hours: durationHours,
    duration_formatted: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
    geometry: {
      type: 'LineString',
      coordinates: [
        [lon1, lat1],
        [midLon, midLat],
        [lon2, lat2]
      ]
    },
    is_offline_approximation: true,
    metadata: {
      source: 'Haversine Bangladesh Logistics Road Tortuosity Model',
      attribution: 'Simulated road corridor baseline (1.32x straight-line, 40 km/h freight average)',
      data_type: 'Simulated road estimate'
    }
  };
}

/**
 * Calculate driving route between origin and destination coordinates
 * @param {number} lat1 Origin latitude
 * @param {number} lon1 Origin longitude
 * @param {number} lat2 Destination latitude
 * @param {number} lon2 Destination longitude
 */
export async function calculateRoute(lat1, lon1, lat2, lon2) {
  const cacheKey = `osrm_route_${Number(lat1).toFixed(3)},${Number(lon1).toFixed(3)}_to_${Number(lat2).toFixed(3)},${Number(lon2).toFixed(3)}`;
  const TTL = 24 * 60 * 60 * 1000; // 24 hours (road networks are stable)

  return await externalCache.getOrFetch(
    cacheKey,
    async () => {
      // OSRM requires coordinates in longitude,latitude order
      const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&steps=false`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

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
          throw new Error(`OSRM returned status ${res.status}`);
        }

        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes || !data.routes.length) {
          throw new Error(`OSRM route calculation failed with code: ${data.code}`);
        }

        const primaryRoute = data.routes[0];
        const distanceKm = Math.round((primaryRoute.distance / 1000) * 10) / 10;
        const durationMinutes = Math.round(primaryRoute.duration / 60);
        const durationHours = Math.round((durationMinutes / 60) * 10) / 10;

        return {
          distance_km: distanceKm,
          duration_minutes: durationMinutes,
          duration_hours: durationHours,
          duration_formatted: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
          geometry: primaryRoute.geometry, // GeoJSON LineString
          is_offline_approximation: false,
          metadata: {
            source: 'OSRM (Open Source Routing Machine)',
            attribution: 'Routing data © OpenStreetMap contributors, OSRM',
            data_type: 'External observation',
            fetched_at: new Date().toISOString()
          }
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },
    TTL,
    'OSRM Route Engine',
    fallbackRoute(lat1, lon1, lat2, lon2)
  );
}

