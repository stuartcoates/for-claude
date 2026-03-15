import { useItemStore } from '../store/useItemStore';
import { Dashboard } from '../components/dashboard/Dashboard';

export function DashboardPage() {
  const items = useItemStore(s => s.items);
  return <Dashboard items={items} />;
}
