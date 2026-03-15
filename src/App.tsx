import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AddItemPage } from './pages/AddItemPage';
import { ItemsPage } from './pages/ItemsPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { useItemStore } from './store/useItemStore';
import { useAppStore } from './store/useAppStore';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/items" replace /> },
      { path: 'items', element: <ItemsPage /> },
      { path: 'items/:id', element: <ItemDetailPage /> },
      { path: 'add', element: <AddItemPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
    ],
  },
]);

function AppInitializer() {
  const loadItems = useItemStore(s => s.loadItems);
  const darkMode = useAppStore(s => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return <RouterProvider router={router} />;
}

export default AppInitializer;
