import React from 'react';
import { ExternalLink, Database, Globe, CloudRain } from 'lucide-react';

/**
 * Reusable External Data Source Indicator Badge
 * Clearly distinguishes external observations, database records, and AI-generated predictions.
 */
export default function ExternalDataBadge({ source, type = 'external', timestamp, attribution }) {
  const getBadgeStyle = () => {
    switch (type) {
      case 'external':
        return 'bg-teal-950/60 text-teal-300 border-teal-500/30';
      case 'database':
        return 'bg-blue-950/60 text-blue-300 border-blue-500/30';
      case 'simulated':
      case 'ai':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'external':
        return 'External Observation';
      case 'database':
        return 'Database Record';
      case 'simulated':
      case 'ai':
        return 'AI Simulation / Forecast';
      default:
        return 'Data';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border ${getBadgeStyle()}`}>
      <Globe className="w-3 h-3 flex-shrink-0" />
      <span className="font-semibold">{getLabel()}</span>
      {source && (
        <>
          <span className="opacity-40">•</span>
          <span className="opacity-90">{source}</span>
        </>
      )}
      {timestamp && (
        <span className="text-[10px] opacity-60 ml-1">
          ({new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
        </span>
      )}
    </div>
  );
}

