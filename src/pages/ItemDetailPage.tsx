import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { AuditItem } from '../types';
import { getItem } from '../db/operations';
import { ItemDetail } from '../components/items/ItemDetail';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<AuditItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getItem(id).then(found => {
      if (!found) { navigate('/items', { replace: true }); return; }
      setItem(found);
      setLoading(false);
    });
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) return null;
  return <ItemDetail item={item} />;
}
