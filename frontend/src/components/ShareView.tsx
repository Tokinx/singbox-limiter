import { useState } from 'react';
import { Globe, Server } from 'lucide-react';
import type { Client } from '../types';
import {
  formatBytes,
  formatDate,
  formatDateTime,
  getUsagePercent,
  getRemainingBytes,
  getNextResetTime,
  isClientHealthy,
} from '../types';
import { TrafficChart, type TimeRange, timeRangeOptions } from './Charts';
import { t, type Language } from '../i18n';

interface ShareViewProps {
  client: Client;
  lang?: Language;
  onLoadTraffic?: (id: string, hours: number) => void;
}

export const ShareView: React.FC<ShareViewProps> = ({
  client,
  lang = 'zh',
  onLoadTraffic,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');

  const remaining = getRemainingBytes(client);
  const usagePercent = getUsagePercent(client);
  const healthy = isClientHealthy(client);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    const option = timeRangeOptions.find(o => o.value === range);
    if (option && onLoadTraffic) {
      onLoadTraffic(client.id, option.hours);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden mb-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {t('appName', lang)}
                </h1>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="font-mono text-sm">
                    ID: {client.uuid.slice(0, 8)}...
                  </span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  healthy
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                }`}
              >
                {healthy ? t('active', lang) : t('stopped', lang)}
              </span>
            </div>

            {/* Stats Card - Same as ClientDetail */}
            <div className="space-y-6">
              {/* Usage Bar - Same as ClientDetail */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {t('usage', lang)}
                  </span>
                  <span className="text-gray-900 dark:text-gray-200 font-mono font-bold">
                    {formatBytes(client.usedBytes)}{' '}
                    <span className="text-gray-400">/</span>{' '}
                    {client.limitBytes === -1
                      ? '∞'
                      : formatBytes(client.limitBytes)}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full shadow-lg transition-all duration-500 ${
                      usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${client.limitBytes === -1 ? 5 : usagePercent}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-3">
                  <span className="text-gray-400">{t('remaining', lang)}</span>
                  <span className="text-gray-700 dark:text-gray-300 font-mono font-medium">
                    {client.limitBytes === -1
                      ? t('unlimited', lang)
                      : formatBytes(remaining)}
                  </span>
                </div>
              </div>

              {/* Meta Info - Same as ClientDetail */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700/50">
                  <div className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                    {t('expires', lang)}
                  </div>
                  <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(client.expiryDate)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700/50">
                  <div className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                    {t('nextReset', lang)}
                  </div>
                  <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {client.resetInterval === 'monthly'
                      ? formatDateTime(getNextResetTime(client)!)
                      : t('manual', lang)}
                  </div>
                </div>
              </div>

              {/* Server Config - Same as ClientDetail */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700/50 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Globe size={14} />
                    <span>SNI</span>
                  </div>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {client.sni}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Server size={14} />
                    <span>Reality Port</span>
                  </div>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {client.realityPort}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Server size={14} />
                    <span>Hysteria Port</span>
                  </div>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {client.hysteriaPort}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Chart - Same as ClientDetail */}
          <TrafficChart
            data={client.history || []}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            lang={lang}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800 mt-auto bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="font-mono text-xs tracking-wider uppercase">
            {t('secureLink', lang)}
          </div>
          <div className="mt-2 md:mt-0">
            {t('copyright', lang)}
          </div>
        </div>
      </footer>
    </div>
  );
};
