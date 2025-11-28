import { ShieldAlert, Clock, BarChart2, PieChart } from 'lucide-react';
import type { Client } from '../types';
import {
  formatBytes,
  formatDate,
  getUsagePercent,
  getRemainingBytes,
  isExpired,
  isOverLimit,
  isClientHealthy,
} from '../types';
import { TrafficChart } from './Charts';
import { t, type Language } from '../i18n';

interface ShareViewProps {
  client: Client;
  lang?: Language;
}

export const ShareView: React.FC<ShareViewProps> = ({
  client,
  lang = 'zh',
}) => {
  const overLimit = isOverLimit(client);
  const expired = isExpired(client);
  const healthy = isClientHealthy(client);
  const remaining = getRemainingBytes(client);
  const usagePercent = getUsagePercent(client);

  const getOrdinal = (n: number, language: Language) => {
    if (language === 'zh') return '日';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-12 flex justify-center transition-colors duration-300">
      <div className="max-w-4xl w-full space-y-8">
        {/* Anti-Crawler Notice */}
        <div className="text-center text-xs text-gray-400 mb-8 font-mono tracking-widest uppercase">
          {t('secureLink', lang)}
        </div>

        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-gray-700 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                {t('appName', lang)}
              </h1>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="font-mono text-sm">
                  ID: {client.uuid.slice(0, 8)}...
                </span>
              </div>
            </div>
            <div
              className={`px-5 py-2 rounded-full border font-bold text-sm tracking-wide ${
                healthy
                  ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400'
              }`}
            >
              {healthy
                ? t('active', lang).toUpperCase()
                : t('stopped', lang).toUpperCase()}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 transition-transform hover:scale-105">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-[10px] uppercase font-bold tracking-wider">
                <BarChart2 size={14} /> {t('dataUsed', lang)}
              </div>
              <div className="text-2xl font-mono text-gray-900 dark:text-white font-bold">
                {formatBytes(client.usedBytes)}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 transition-transform hover:scale-105">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-[10px] uppercase font-bold tracking-wider">
                <PieChart size={14} /> {t('remaining', lang)}
              </div>
              <div className="text-2xl font-mono text-gray-900 dark:text-white font-bold">
                {client.limitBytes === -1
                  ? t('unlimited', lang)
                  : formatBytes(remaining)}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 transition-transform hover:scale-105">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-[10px] uppercase font-bold tracking-wider">
                <Clock size={14} /> {t('resetCycle', lang)}
              </div>
              <div className="text-xl font-mono text-gray-900 dark:text-white mt-1 font-semibold">
                {client.resetInterval === 'monthly'
                  ? `${client.resetDay}${getOrdinal(client.resetDay, lang)}`
                  : t('manual', lang)}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 transition-transform hover:scale-105">
              <div className="flex items-center gap-2 text-gray-400 mb-2 text-[10px] uppercase font-bold tracking-wider">
                <ShieldAlert size={14} /> {t('subscription', lang)}
              </div>
              <div className="text-sm font-mono text-gray-900 dark:text-white mt-2 break-words font-medium">
                {formatDate(client.expiryDate)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-1000 ease-out shadow-lg ${
                  overLimit || expired
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{
                  width: `${client.limitBytes === -1 ? 5 : usagePercent}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Traffic Chart */}
        <TrafficChart
          data={client.history}
          height={350}
          color="#3b82f6"
          title={t('trafficHistory', lang)}
        />

        {/* Footer */}
        <div className="text-center pt-8 text-gray-400 text-sm">
          {t('poweredBy', lang)}
        </div>
      </div>
    </div>
  );
};
