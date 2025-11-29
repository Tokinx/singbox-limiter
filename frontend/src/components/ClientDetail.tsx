import { useState } from "react";
import { ArrowLeft, Share2, Copy, Trash2, Power, RotateCcw, Check, Globe, Server, Edit } from "lucide-react";
import type { Client, UpdateClientRequest } from "../types";
import {
  formatBytes,
  formatDate,
  formatDateTime,
  getUsagePercent,
  getRemainingBytes,
  getNextResetTime,
  getTotalLimitBytes,
  generateRealityUri,
  generateHy2Uri,
  isClientHealthy,
} from "../types";
import { TrafficChart, type TimeRange, timeRangeOptions } from "./Charts";
import { t, type Language } from "../i18n";
import { copyToClipboard } from "../services/api";

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
  onUpdate: (updated: Client) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  onResetTraffic: (id: string) => void;
  onLoadTraffic?: (id: string, hours: number) => void;
  onEdit?: (client: Client) => void;
  lang: Language;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({
  client,
  onBack,
  onUpdate,
  onDelete,
  onShare,
  onResetTraffic,
  onLoadTraffic,
  onEdit,
  lang,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");

  const handleCopy = async (text: string, type: string) => {
    await copyToClipboard(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleStatus = () => {
    onUpdate({ ...client, active: !client.active });
  };

  const handleReset = () => {
    if (window.confirm(t("resetConfirm", lang))) {
      onResetTraffic(client.id);
    }
  };

  const handleDelete = () => {
    if (window.confirm(t("deleteConfirm", lang))) {
      onDelete(client.id);
    }
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    const option = timeRangeOptions.find((o) => o.value === range);
    if (option && onLoadTraffic) {
      onLoadTraffic(client.id, option.hours);
    }
  };

  const remaining = getRemainingBytes(client);
  const usagePercent = getUsagePercent(client);
  const healthy = isClientHealthy(client);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 font-medium transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          {t("back", lang)}
        </button>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => onEdit?.(client)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 font-medium transition-all shadow-sm"
          >
            <Edit size={18} />
            {t("editClient", lang)}
          </button>
          <button
            onClick={() => onShare(client.id)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 font-medium transition-all shadow-sm"
          >
            <Share2 size={18} />
            {t("sharePage", lang)}
          </button>
          <button
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-all shadow-sm border ${
              client.active
                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-500/20"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-500/20"
            }`}
          >
            <Power size={18} />
            {client.active ? t("disable", lang) : t("enable", lang)}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats Card */}
        <div className="col-span-1 bg-white dark:bg-gray-800 rounded p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                healthy
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
              }`}
            >
              {healthy ? t("active", lang) : t("stopped", lang)}
            </span>
          </div>

          <div className="space-y-6">
            {/* Usage Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400 font-medium">{t("usage", lang)}</span>
                <span className="text-gray-900 dark:text-gray-200 font-mono font-bold">
                  {formatBytes(client.usedBytes)} <span className="text-gray-400">/</span>{" "}
                  {getTotalLimitBytes(client) === -1 ? "∞" : formatBytes(getTotalLimitBytes(client))}
                  {client.tempBytes > 0 && (
                    <span className="text-blue-500 text-xs ml-1">
                      (+{formatBytes(client.tempBytes)} {t("tempTraffic", lang).split(' ')[0]})
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full shadow-lg transition-all duration-500 ${
                    usagePercent > 90 ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{
                    width: `${getTotalLimitBytes(client) === -1 ? 5 : usagePercent}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-3">
                <span className="text-gray-400">{t("remaining", lang)}</span>
                <span className="text-gray-700 dark:text-gray-300 font-mono font-medium">
                  {getTotalLimitBytes(client) === -1 ? t("unlimited", lang) : formatBytes(remaining)}
                </span>
              </div>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700/50">
                <div className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">
                  {t("expires", lang)}
                </div>
                <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  {formatDate(client.expiryDate)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700/50">
                <div className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">{t("nextReset", lang)}</div>
                <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                  {client.resetInterval === "monthly"
                    ? formatDateTime(getNextResetTime(client)!)
                    : t("manual", lang)}
                </div>
              </div>
            </div>

            {/* Server Config */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700/50 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Globe size={14} />
                  <span>SNI</span>
                </div>
                <span className="font-mono text-gray-700 dark:text-gray-300">{client.sni}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Server size={14} />
                  <span>Reality Port</span>
                </div>
                <span className="font-mono text-gray-700 dark:text-gray-300">{client.realityPort}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Server size={14} />
                  <span>Hysteria Port</span>
                </div>
                <span className="font-mono text-gray-700 dark:text-gray-300">{client.hysteriaPort}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={16} /> {t("resetTraffic", lang)}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-500/20 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Connection Strings */}
          <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white">{t("protocols", lang)}</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {[
                {
                  label: "REALITY (Vision)",
                  fn: generateRealityUri,
                  id: "reality",
                },
                { label: "Hysteria 2", fn: generateHy2Uri, id: "hy2" },
              ].map((proto) => (
                <div key={proto.id} className="p-4 flex flex-col md:flex-row gap-3 items-center">
                  <div className="md:w-32 font-mono text-sm font-bold text-gray-500 dark:text-gray-400">
                    {proto.label}
                  </div>
                  <div className="flex-1 w-full relative group">
                    <input
                      readOnly
                      value={proto.fn(client)}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-4 py-3 text-xs text-gray-600 dark:text-gray-300 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <button
                        onClick={() => handleCopy(proto.fn(client), proto.id)}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded text-gray-400 hover:text-blue-500 transition-all"
                        title={t("copy", lang)}
                      >
                        {copied === proto.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Charts Section */}
          <TrafficChart
            data={client.history || []}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
};
