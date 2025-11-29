import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Globe,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Github,
  ChevronDown,
} from 'lucide-react';
import type { Client, Theme, CreateClientRequest } from './types';
import {
  ClientList,
  ClientDetail,
  ShareView,
  Login,
  CreateClientModal,
} from './components';
import {
  t,
  type Language,
  getStoredLanguage,
  setStoredLanguage,
} from './i18n';
import {
  authApi,
  clientApi,
  shareApi,
  isAuthenticated,
  copyToClipboard,
} from './services/api';

type View = 'login' | 'dashboard' | 'detail' | 'share';

const App: React.FC = () => {
  // Auth State
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  // App State
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<View>(authenticated ? 'dashboard' : 'login');
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // UI State
  const [toast, setToast] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [theme, setTheme] = useState<Theme>('auto');
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Show Toast
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load Clients
  const loadClients = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const data = await clientApi.getAll();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  // Initialize
  useEffect(() => {
    if (authenticated) {
      loadClients();
      setView('dashboard');
    }
  }, [authenticated, loadClients]);

  // Theme Logic
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hash Router for Share View
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/share/')) {
        const token = hash.slice(8);
        handleShareView(token);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle Share View
  const handleShareView = async (token: string) => {
    try {
      const { client } = await shareApi.getData(token);
      setClients([client]);
      setActiveClientId(client.id);
      setView('share');
    } catch (error) {
      console.error('Failed to load share data:', error);
    }
  };

  // Auth Handlers
  const handleLogin = async (username: string, password: string) => {
    await authApi.login(username, password);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    if (window.confirm(t('logoutConfirm', lang))) {
      authApi.logout();
      setAuthenticated(false);
      setClients([]);
      setView('login');
    }
  };

  // Client Handlers
  const handleSelectClient = async (id: string) => {
    setActiveClientId(id);
    // Load traffic history for selected client
    try {
      const history = await clientApi.getTraffic(id);
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, history } : c))
      );
    } catch (error) {
      console.error('Failed to load traffic:', error);
    }
    setView('detail');
  };

  const handleCreateClient = async (data: CreateClientRequest) => {
    const newClient = await clientApi.create(data);
    setClients((prev) => [...prev, newClient]);
    showToast(t('createSuccess', lang));
  };

  const handleUpdateClient = async (updated: Client) => {
    await clientApi.update(updated.id, {
      active: updated.active,
    });
    setClients((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    showToast(t('updateSuccess', lang));
  };

  const handleDeleteClient = async (id: string) => {
    await clientApi.delete(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    setView('dashboard');
    setActiveClientId(null);
    showToast(t('deleteSuccess', lang));
  };

  const handleResetTraffic = async (id: string) => {
    await clientApi.resetTraffic(id);
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, usedBytes: 0 } : c))
    );
    showToast(t('resetSuccess', lang));
  };

  const handleLoadTraffic = async (id: string, hours: number) => {
    try {
      const history = await clientApi.getTraffic(id, hours);
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, history } : c))
      );
    } catch (error) {
      console.error('Failed to load traffic:', error);
    }
  };

  const handleShare = async (id: string) => {
    try {
      const { shareUrl } = await clientApi.getUrls(id);
      await copyToClipboard(shareUrl);
      showToast(t('shareSuccess', lang));
    } catch (error) {
      console.error('Failed to get share URL:', error);
    }
  };

  // UI Handlers
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
    setShowLangDropdown(false);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setShowThemeDropdown(false);
  };

  // Render Login
  if (view === 'login') {
    return <Login onLogin={handleLogin} lang={lang} />;
  }

  // Render Share View
  if (view === 'share' && activeClientId) {
    const client = clients.find((c) => c.id === activeClientId);
    if (!client) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-500 dark:text-gray-400">
            Client not found
          </div>
        </div>
      );
    }
    return <ShareView client={client} lang={lang} onLoadTraffic={handleLoadTraffic} />;
  }

  // Render Main App
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-blue-600 text-white px-6 py-3 rounded shadow-xl shadow-blue-500/20 animate-fade-in font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              setView('dashboard');
              setActiveClientId(null);
            }}
          >
            <div className="bg-blue-600 p-2 rounded group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/30">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight hidden md:block text-gray-900 dark:text-white">
              SingBox<span className="text-blue-500">Limiter</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Dropdown */}
            <div className="relative" ref={themeDropdownRef}>
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="flex items-center gap-1.5 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                title={t('theme', lang)}
              >
                {theme === 'auto' && <Monitor size={18} />}
                {theme === 'light' && <Sun size={18} />}
                {theme === 'dark' && <Moon size={18} />}
                <ChevronDown size={14} className={`transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showThemeDropdown && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 z-50">
                  <button
                    onClick={() => handleThemeChange('auto')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${theme === 'auto' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <Monitor size={16} />
                    {lang === 'zh' ? '跟随系统' : 'Auto'}
                  </button>
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <Sun size={16} />
                    {lang === 'zh' ? '浅色' : 'Light'}
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <Moon size={16} />
                    {lang === 'zh' ? '深色' : 'Dark'}
                  </button>
                </div>
              )}
            </div>

            {/* Language Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded"
              >
                <Globe size={16} />
                {lang === 'zh' ? '中文' : 'EN'}
                <ChevronDown size={14} className={`transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 z-50">
                  <button
                    onClick={() => handleLanguageChange('zh')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${lang === 'zh' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${lang === 'en' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    English
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title={t('logout', lang)}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {loading && view === 'dashboard' ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : view === 'dashboard' ? (
            <ClientList
              clients={clients}
              onSelect={handleSelectClient}
              onAdd={() => setShowCreateModal(true)}
              lang={lang}
            />
          ) : view === 'detail' && activeClientId ? (
            <ClientDetail
              client={clients.find((c) => c.id === activeClientId)!}
              onBack={() => {
                setView('dashboard');
                setActiveClientId(null);
              }}
              onUpdate={handleUpdateClient}
              onDelete={handleDeleteClient}
              onShare={handleShare}
              onResetTraffic={handleResetTraffic}
              onLoadTraffic={handleLoadTraffic}
              lang={lang}
            />
          ) : null}
        </div>

        {/* Create Modal */}
        <CreateClientModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateClient}
          lang={lang}
        />
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800 mt-auto bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <div>{t('copyright', lang)}</div>
          <a
            href="https://github.com/your-repo/singbox-limiter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-blue-500 transition-colors mt-2 md:mt-0"
          >
            <Github size={16} />
            {t('github', lang)}
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
