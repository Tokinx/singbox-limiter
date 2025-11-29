import { Users, AlertCircle, CheckCircle, Clock, Plus } from 'lucide-react';
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
import { t, type Language } from '../i18n';

interface ClientListProps {
  clients: Client[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  lang: Language;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onSelect,
  onAdd,
  lang,
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('activeClients', lang)}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('manageDesc', lang)}
          </p>
        </div>
        <button
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 font-medium"
        >
          <Plus size={18} />
          {t('newClient', lang)}
        </button>
      </div>

      {/* Client Grid */}
      {clients.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
            {t('noClients', lang)}
          </h3>
          <p className="text-gray-400 dark:text-gray-500 mt-1">
            {t('noClientsDesc', lang)}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onSelect={onSelect}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ClientCardProps {
  client: Client;
  onSelect: (id: string) => void;
  lang: Language;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onSelect, lang }) => {
  const healthy = isClientHealthy(client);
  const expired = isExpired(client);
  const overLimit = isOverLimit(client);
  const usagePercent = getUsagePercent(client);
  const remaining = getRemainingBytes(client);

  const statusColor = healthy ? 'text-emerald-500' : 'text-red-500';
  const borderColor = healthy
    ? 'border-gray-200 dark:border-gray-700'
    : 'border-red-200 dark:border-red-900/30';
  const bgHover = healthy
    ? 'hover:border-blue-300 dark:hover:border-blue-700'
    : 'hover:border-red-300 dark:hover:border-red-800';

  const getStatusText = () => {
    if (!client.active) return t('stopped', lang);
    if (expired) return t('expired', lang);
    if (overLimit) return t('overLimit', lang);
    return t('active', lang);
  };

  return (
    <div
      onClick={() => onSelect(client.id)}
      className={`bg-white dark:bg-gray-800 rounded border ${borderColor} p-5 cursor-pointer ${bgHover} hover:shadow-lg transition-all duration-300 group`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
            {client.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
            {client.email || client.uuid.slice(0, 8) + '...'}
          </p>
        </div>
        <div
          className={`${statusColor} bg-gray-50 dark:bg-gray-900/50 p-2 rounded`}
        >
          {healthy ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
        </div>
      </div>

      {/* Traffic Bar */}
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-500 dark:text-gray-400 font-medium">
              {t('usage', lang)}
            </span>
            <span className="text-gray-900 dark:text-gray-200 font-bold">
              {formatBytes(client.usedBytes)}{' '}
              <span className="text-gray-400 font-normal">/</span>{' '}
              {client.limitBytes === -1 ? '∞' : formatBytes(client.limitBytes)}
            </span>
          </div>
          <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                width: `${client.limitBytes === -1 ? 5 : usagePercent}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                healthy
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}
            >
              {getStatusText()}
            </span>
            <span className="text-xs font-medium text-blue-500 dark:text-blue-400">
              {t('remaining', lang)}:{' '}
              {client.limitBytes === -1
                ? t('unlimited', lang)
                : formatBytes(remaining)}
            </span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700/50">
            <span className="block text-gray-400 uppercase font-bold tracking-wider text-[10px] mb-1">
              {t('expires', lang)}
            </span>
            <span className="text-gray-700 dark:text-gray-300 font-semibold truncate">
              {formatDate(client.expiryDate)}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700/50">
            <span className="block text-gray-400 uppercase font-bold tracking-wider text-[10px] mb-1">
              {t('reset', lang)}
            </span>
            <span className="text-gray-700 dark:text-gray-300 font-semibold truncate flex items-center gap-1">
              <Clock size={12} />
              {client.resetInterval === 'monthly'
                ? `${t('day', lang)} ${client.resetDay}`
                : t('manual', lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
