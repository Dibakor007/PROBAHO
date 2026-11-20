import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import { Loader2 } from 'lucide-react';

export default function HealthCheck({ status, onRetry }) {
  const { language } = useLanguage();

  if (status === 'healthy') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/95">
      <div className="text-center p-8">
        {status === 'checking' || status === 'waking' ? (
          <>
            <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {t('startingService', language)}
            </h2>
            <p className="text-gray-400 text-sm">
              {language === 'en'
                ? 'The backend service is warming up. This may take a moment...'
                : 'ব্যাকএন্ড সেবা চালু হচ্ছে। কিছুক্ষণ সময় লাগতে পারে...'}
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {t('serviceUnavailable', language)}
            </h2>
            <button
              onClick={onRetry}
              className="mt-4 px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
            >
              {t('retry', language)}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
