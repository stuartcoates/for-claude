import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuditItem, NewItem } from '../../types';
import { useItemStore } from '../../store/useItemStore';
import { ItemForm } from './ItemForm';
import { DispositionChip } from '../ui/DispositionChip';
import { getPreciousnessLabel, formatCurrency, formatDate } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Pencil, Trash2, MapPin, Tag, Star, DollarSign, Calendar } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface Props {
  item: AuditItem;
}

export function ItemDetail({ item }: Props) {
  const navigate = useNavigate();
  const updateItem = useItemStore(s => s.updateItem);
  const deleteItem = useItemStore(s => s.deleteItem);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleUpdate(data: NewItem) {
    await updateItem(item.id, data);
    setEditing(false);
  }

  async function handleDelete() {
    await deleteItem(item.id);
    navigate('/items', { replace: true });
  }

  if (editing) {
    return (
      <ItemForm
        initialPhotoDataUrl={item.photoDataUrl}
        initialData={item}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
        submitLabel="Save Changes"
      />
    );
  }

  return (
    <div className="flex flex-col">
      {/* Photo */}
      {item.photoDataUrl && (
        <div className="w-full bg-gray-900" style={{ aspectRatio: '4/3' }}>
          <img src={item.photoDataUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 py-5 space-y-5">
        {/* Name + disposition */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{item.name}</h1>
          <DispositionChip value={item.disposition} size="md" />
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetaRow icon={<MapPin size={15} />} label="Room" value={item.room} />
          <MetaRow icon={<Tag size={15} />} label="Category" value={item.category} />
          <MetaRow icon={<Star size={15} />} label="Preciousness" value={getPreciousnessLabel(item.preciousness)} />
          <MetaRow icon={<DollarSign size={15} />} label="Est. Value" value={formatCurrency(item.estimatedValue)} />
          <MetaRow icon={<Calendar size={15} />} label="Added" value={formatDate(item.createdAt)} />
        </div>

        {/* Notes */}
        {item.notes && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</p>
            <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => setEditing(true)} className="flex-1 gap-2">
            <Pencil size={16} /> Edit
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)} size="md">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Item">
        <div className="p-4 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Are you sure you want to delete <strong>"{item.name}"</strong>? This cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p>
      </div>
    </div>
  );
}
