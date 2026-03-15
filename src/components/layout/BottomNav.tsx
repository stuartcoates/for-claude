import { NavLink, useNavigate } from 'react-router-dom';
import { Package, Plus, BarChart2 } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-stretch safe-area-pb">
      <NavLink
        to="/items"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
          }`
        }
      >
        <Package size={22} strokeWidth={1.5} />
        Items
      </NavLink>

      {/* Add button (center) */}
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={() => navigate('/add')}
          className="w-14 h-14 -mt-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label="Add item"
        >
          <Plus size={28} strokeWidth={2} />
        </button>
      </div>

      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
          }`
        }
      >
        <BarChart2 size={22} strokeWidth={1.5} />
        Dashboard
      </NavLink>
    </nav>
  );
}
