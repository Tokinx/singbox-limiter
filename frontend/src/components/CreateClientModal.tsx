import { X, Plus } from 'lucide-react';
import { useState } from 'react';
import { t, type Language } from '../i18n';
import type { CreateClientRequest } from '../types';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateClientRequest) => Promise<void>;
  lang: Language;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  lang,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const limitGb = parseInt(formData.get('limit') as string) || 0;
    const expiryDateVal = formData.get('expiryDate') as string;
    const resetDayVal = parseInt(formData.get('resetDay') as string) || 1;

    const data: CreateClientRequest = {
      name,
      email: email || undefined,
      limitBytes: limitGb === 0 ? -1 : limitGb * 1024 * 1024 * 1024,
      expiryDate: expiryDateVal ? new Date(expiryDateVal).toISOString() : null,
      resetInterval: 'monthly',
      resetDay: Math.min(31, Math.max(1, resetDayVal)),
    };

    try {
      await onCreate(data);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('newClient', lang)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto p-6">
          <form id="createForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('clientName', lang)}
              </label>
              <input
                name="name"
                required
                autoFocus
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="e.g. Alice Mobile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('clientEmail', lang)}
              </label>
              <input
                name="email"
                type="email"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('trafficLimit', lang)}
              </label>
              <input
                name="limit"
                type="number"
                defaultValue="0"
                min="0"
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('trafficLimitDesc', lang)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('expiryDate', lang)}
                </label>
                <input
                  name="expiryDate"
                  type="date"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('resetDay', lang)}
                </label>
                <input
                  name="resetDay"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue="1"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
          <button
            form="createForm"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={18} /> {t('create', lang)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
