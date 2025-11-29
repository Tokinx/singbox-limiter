import { X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { t, type Language } from '../i18n';
import type { Client, UpdateClientRequest } from '../types';
import { formatBytes } from '../types';

interface EditClientModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (id: string, data: UpdateClientRequest) => Promise<void>;
  lang: Language;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  client,
  onClose,
  onSave,
  lang,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    remark: '',
    limitGb: 0,
    tempGb: 0,
    expiryDate: '',
    resetDay: 1,
    realityPort: 443,
    hysteriaPort: 8443,
    sni: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        remark: client.remark || '',
        limitGb: client.limitBytes === -1 ? 0 : Math.round(client.limitBytes / (1024 * 1024 * 1024)),
        tempGb: Math.round((client.tempBytes || 0) / (1024 * 1024 * 1024)),
        expiryDate: client.expiryDate ? client.expiryDate.split('T')[0] : '',
        resetDay: client.resetDay,
        realityPort: client.realityPort,
        hysteriaPort: client.hysteriaPort,
        sni: client.sni,
      });
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const data: UpdateClientRequest = {
      name: formData.name,
      remark: formData.remark,
      limitGb: formData.limitGb,
      tempGb: formData.tempGb,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
      resetDay: Math.min(31, Math.max(1, formData.resetDay)),
      realityPort: formData.realityPort,
      hysteriaPort: formData.hysteriaPort,
      sni: formData.sni,
    };

    try {
      await onSave(client.id, data);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseInt(value)) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded w-full max-w-lg border border-gray-200 dark:border-gray-700 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('editClient', lang)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-5">
          <form id="editForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('clientName', lang)}
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('clientRemark', lang)}
              </label>
              <input
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="备注信息..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('trafficLimit', lang)}
                </label>
                <input
                  name="limitGb"
                  type="number"
                  value={formData.limitGb}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('trafficLimitDesc', lang)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('tempTraffic', lang)}
                </label>
                <input
                  name="tempGb"
                  type="number"
                  value={formData.tempGb}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('tempTrafficDesc', lang)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('expiryDate', lang)}
                </label>
                <input
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('resetDay', lang)}
                </label>
                <input
                  name="resetDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.resetDay}
                  onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('realityPort', lang)}
                </label>
                <input
                  name="realityPort"
                  type="number"
                  min="1"
                  max="65535"
                  value={formData.realityPort}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('hysteriaPort', lang)}
                </label>
                <input
                  name="hysteriaPort"
                  type="number"
                  min="1"
                  max="65535"
                  value={formData.hysteriaPort}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('sni', lang)}
              </label>
              <input
                name="sni"
                type="text"
                value={formData.sni}
                onChange={handleChange}
                placeholder="music.apple.com"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>

            {/* 当前流量使用情况（只读） */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-100 dark:border-gray-700/50">
              <div className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">
                {t('usage', lang)}
              </div>
              <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                {formatBytes(client.usedBytes)} / {client.limitBytes === -1 ? '∞' : formatBytes(client.limitBytes + (client.tempBytes || 0))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-700">
          <button
            form="editForm"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} /> {t('save', lang)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
