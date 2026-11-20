import React from 'react';

/**
 * KPI Stat Card Component
 * Styled following the Figma SCM (Supply Chain Management) Template
 * (Figma Community file 1354682817335330954)
 * Features:
 * - Crisp white rounded card container
 * - Left-aligned circular pastel icon container
 * - Large tabular numerals in slate-900
 * - High-contrast uppercase label in slate-500
 * - Subtle trend badge / status pill
 */
export default function KPICard({ 
  icon: Icon, 
  label, 
  value, 
  badge,
  trend,
  color = 'teal', 
  loading 
}) {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      text: 'text-teal-600',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    blue: {
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      text: 'text-sky-600',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    red: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  };

  const scheme = colorMap[color] || colorMap.teal;

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {Icon && (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${scheme.bg} ${scheme.border}`}>
              <Icon className={`w-6 h-6 ${scheme.text}`} aria-hidden="true" />
            </div>
          )}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              {label}
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {value}
            </div>
          </div>
        </div>

        {badge && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${scheme.badgeBg}`}>
            {badge}
          </span>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{trend.label}</span>
          <span className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-slate-700'}`}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
