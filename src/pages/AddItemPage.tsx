import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraCapture } from '../components/camera/CameraCapture';
import { ItemForm } from '../components/items/ItemForm';
import { useItemStore } from '../store/useItemStore';
import { useAppStore } from '../store/useAppStore';
import type { NewItem } from '../types';
import { MapPin, X } from 'lucide-react';

export function AddItemPage() {
  const navigate = useNavigate();
  const addItem = useItemStore(s => s.addItem);
  const activeRoom = useAppStore(s => s.activeRoom);
  const setActiveRoom = useAppStore(s => s.setActiveRoom);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  async function handleSubmit(item: NewItem) {
    await addItem(item);
    navigate('/items', { replace: true });
  }

  function handleSkipPhoto() {
    setPhotoDataUrl('');
  }

  if (!photoDataUrl && photoDataUrl !== '') {
    return (
      <div className="px-4 pt-6 space-y-6">
        {/* Active room context banner */}
        {activeRoom && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <MapPin size={15} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="text-sm text-indigo-700 dark:text-indigo-300 flex-1">
              Adding to: <strong>{activeRoom}</strong>
            </span>
            <button
              onClick={() => setActiveRoom(null)}
              className="text-indigo-400 hover:text-indigo-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <CameraCapture onCapture={setPhotoDataUrl} label="Take Photo" />

        <div className="text-center">
          <button
            onClick={handleSkipPhoto}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline"
          >
            Skip photo for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <ItemForm
      initialPhotoDataUrl={photoDataUrl ?? ''}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      submitLabel="Save Item"
    />
  );
}
