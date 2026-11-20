import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Info, X } from 'lucide-react';

/**
 * Synthetic Data Notice
 * Clean, minimal, and dismissible banner respecting SCM enterprise design.
 */
export default function StatusBanner() {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('probaho_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('probaho_banner_dismissed', 'true');
    } catch {}
  };

  return (
    <div className="bg-slate-100/90 border border-slate-200/90 rounded-xl px-4 py-2 mb-5 flex items-center justify-between gap-3 shadow-2xs transition-all">
      <div className="flex items-center gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-[#00a896] shrink-0" />
        <span className="font-medium">
          {language === 'bn' 
            ? 'ডেমো প্ল্যাটফর্ম — কৃত্রিম তথ্য দ্বারা চালিত (Synthetic data)' 
            : 'Evaluation Platform — Powered by Synthetic data'}
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
        title="Dismiss notice"
        aria-label="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
