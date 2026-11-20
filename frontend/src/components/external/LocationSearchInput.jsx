import React, { useState } from 'react';
import { Search, MapPin, Loader2, Check, ExternalLink } from 'lucide-react';
import probahoApi from '../../services/api';
import ExternalDataBadge from './ExternalDataBadge';

/**
 * Warehouse and Clinic Geocoding Location Search
 * Powered by OpenStreetMap Nominatim API
 * Allows finding clinics, upazila health complexes, and medical distribution facilities in Bangladesh.
 */
export default function LocationSearchInput({ onSelectLocation, language = 'en' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await probahoApi.geocode(query);
      setResults(res.data.data?.results || []);
    } catch (err) {
      console.warn('[Nominatim] Search failed:', err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    if (onSelectLocation) {
      onSelectLocation({
        name: item.display_name.split(',')[0],
        full_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || 'facility',
        source: item.source || 'Nominatim'
      });
    }
  };

  return (
    <div className="bg-[#0f1d33] border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              {language === 'bn' ? 'স্বাস্থ্যকেন্দ্র ও গুদাম অনুসন্ধান' : 'Facility & Clinic Geocoder'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'bn' ? 'নোমিনাটিম ওপেনস্ট্রিটম্যাপ সার্চ' : 'Nominatim OpenStreetMap geocoding for Bangladesh'}
            </p>
          </div>
        </div>
        <ExternalDataBadge source="Nominatim" type="external" attribution="Data © OpenStreetMap contributors, ODbL 1.0" />
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'bn' ? 'উপজেলা স্বাস্থ্য কমপ্লেক্স বা জেলা খুঁজুন (যেমন: Savar, Pirganj, Dhaka)...' : 'Search clinic, upazila, or warehouse (e.g., Savar, Pirganj, Dhaka)...'}
            className="w-full bg-[#0a1628] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {language === 'bn' ? 'অনুসন্ধান' : 'Search'}
        </button>
      </form>

      {/* Results Dropdown */}
      {loading ? (
        <div className="text-xs text-slate-400 py-3 text-center flex items-center justify-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
          Searching OpenStreetMap directory...
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-xs text-slate-500 py-2 text-center">
          No matching healthcare facility found in Bangladesh directory.
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {results.map((item, idx) => (
            <div
              key={item.place_id || idx}
              onClick={() => handleSelect(item)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-start justify-between gap-2 ${
                selectedItem?.place_id === item.place_id
                  ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
                  : 'bg-[#0a1628] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-white">{item.display_name.split(',')[0]}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{item.display_name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Lat: {parseFloat(item.lat).toFixed(4)}, Lon: {parseFloat(item.lon).toFixed(4)}
                  </div>
                </div>
              </div>
              <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] rounded font-medium transition flex-shrink-0">
                Select
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

