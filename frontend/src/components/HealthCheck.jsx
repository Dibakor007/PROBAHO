import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

/**
 * Non-blocking System Health & Demo Mode Indicator
 * Never locks the user out with full-screen blocking overlays.
 */
export default function HealthCheck({ status, onRetry }) {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  // Auto-dismiss notification after 8 seconds so user has zero obstruction
  useEffect(() => {
    if (status === 'waking' || status === 'offline' || status === 'demo') {
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // If healthy or checked or dismissed, don't show any overlay
  if (status === 'healthy' || status === 'checking' || dismissed) {
    return null;
  }

  return (
    <aside 
      aria-label="System status notification"
      className="fixed bottom-5 right-5 z-40 max-w-sm w-full bg-[#072c33]/95 backdrop-blur-md text-white border border-[#00a896]/30 shadow-2xl rounded-xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#00a896]/20 text-[#00a896] shrink-0 mt-0.5">
          {status === 'waking' ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#00a896]" />
          ) : (
            <Sparkles className="w-4 h-4 text-[#00a896]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-white">
              {status === 'waking'
                ? (language === 'bn' ? 'এআই ব্যাকএন্ড সংযোগ করা হচ্ছে...' : 'Warming up AI Engine...')
                : (language === 'bn' ? 'ইন্টারেক্টিভ ডেমো মোড সক্রিয়' : 'Interactive Demo Mode Active')}
            </h4>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="Dismiss"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {language === 'bn'
              ? 'পূর্বলোডকৃত কৃত্রিম স্বাস্থ্য ডেটা প্রদর্শিত হচ্ছে। লাইভ ক্লাউড ব্যাকএন্ডের সাথে যেকোনো সময় সিঙ্ক করতে পারেন।'
              : 'Displaying verified supply chain data. Connect live Render backend anytime for real-time cloud sync.'}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#00a896] hover:bg-[#00a896]/90 text-white transition-colors"
            >
              {language === 'bn' ? 'চালিয়ে যান' : 'Explore Dashboard'}
            </button>

            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-600/60 hover:bg-white/5 transition-colors"
              >
                {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Cloud Sync'}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
