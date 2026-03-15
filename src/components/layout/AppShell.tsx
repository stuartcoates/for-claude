import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAppStore } from '../../store/useAppStore';
import { Moon, Sun, ChevronLeft } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/items': 'Inventory',
  '/dashboard': 'Dashboard',
  '/add': 'Add Item',
};

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const darkMode = useAppStore(s => s.darkMode);
  const toggleDarkMode = useAppStore(s => s.toggleDarkMode);

  const isDetailPage = location.pathname.startsWith('/items/') && location.pathname !== '/items';
  const title = isDetailPage ? 'Item Detail' : (PAGE_TITLES[location.pathname] ?? '');
  const showBack = isDetailPage;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex items-center px-4 h-14 gap-3">
        {showBack && (
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-500 dark:text-gray-400">
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="font-semibold text-gray-900 dark:text-gray-100 text-lg flex-1">{title}</h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
