import React from 'react';
import { AlertTriangle, Clock, Package } from 'lucide-react';

/**
 * Alert Card Component
 * Styled following the Figma SCM (Supply Chain Management) Template
 * Clean rounded container with pastel status fills and high-contrast typography.
 */
export default function AlertCard({ type, facility, medicine, message, value, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse mb-2" />
        <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  const isExpiry = type === 'expiry';
  const borderColor = isExpiry ? 'border-amber-200' : 'border-rose-200';
  const bgColor = isExpiry ? 'bg-amber-50/70' : 'bg-rose-50/70';
  const iconColor = isExpiry ? 'text-amber-600' : 'text-rose-600';
  const badgeColor = isExpiry ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300';
  const Icon = isExpiry ? Clock : AlertTriangle;

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-4 flex items-start gap-3 shadow-xs hover:shadow-sm transition-all duration-200`}>
      <div className="p-2 rounded-lg bg-white shadow-xs shrink-0 mt-0.5">
        <Icon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-900 font-bold text-xs truncate">{medicine}</span>
          {value !== undefined && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor} tabular-nums shrink-0`}>
              {value}
            </span>
          )}
        </div>
        <p className="text-slate-600 text-xs mt-0.5 font-medium">{facility}</p>
        {message && <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{message}</p>}
      </div>
    </div>
  );
}
