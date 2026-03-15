import { useState } from 'react';
import type { AuditItem, NewItem, Category, Disposition, PreciousnessLevel } from '../../types';
import { CATEGORIES } from '../../utils/constants';
import { PhotoPreview } from '../camera/PhotoPreview';
import { PreciousnessScale } from '../ui/PreciousnessScale';
import { DispositionSelector } from '../ui/DispositionChip';
import { RoomSelector } from '../ui/RoomSelector';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  initialPhotoDataUrl: string;
  initialData?: Partial<AuditItem>;
  onSubmit: (item: NewItem) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function ItemForm({ initialPhotoDataUrl, initialData, onSubmit, onCancel, submitLabel = 'Save Item' }: Props) {
  const activeRoom = useAppStore(s => s.activeRoom);
  const [customRooms, setCustomRooms] = useState<string[]>([]);

  const [photo, setPhoto] = useState(initialPhotoDataUrl);
  const [name, setName] = useState(initialData?.name ?? '');
  const [room, setRoom] = useState(initialData?.room ?? activeRoom ?? '');
  const [category, setCategory] = useState<Category | ''>(initialData?.category ?? '');
  const [preciousness, setPreciousness] = useState<PreciousnessLevel | null>(initialData?.preciousness ?? null);
  const [disposition, setDisposition] = useState<Disposition | null>(initialData?.disposition ?? null);
  const [estimatedValue, setEstimatedValue] = useState<string>(initialData?.estimatedValue != null ? String(initialData.estimatedValue) : '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const canSubmit = name.trim() && room && category && preciousness && disposition;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      room,
      category: category as Category,
      preciousness: preciousness!,
      disposition: disposition!,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
      notes: notes.trim(),
      photoDataUrl: photo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-6">
        {/* Photo */}
        <section>
          <PhotoPreview dataUrl={photo} onRetake={setPhoto} />
        </section>

        {/* Name */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Item Name <span className="text-red-500">*</span></label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Le Creuset Dutch Oven"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
          />
        </section>

        {/* Room */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Room / Location <span className="text-red-500">*</span></label>
          <RoomSelector
            value={room}
            onChange={setRoom}
            customRooms={customRooms}
            onAddCustomRoom={r => setCustomRooms(prev => [...prev, r])}
          />
        </section>

        {/* Category */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  category === cat
                    ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Preciousness */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Preciousness <span className="text-red-500">*</span></label>
          <PreciousnessScale value={preciousness} onChange={setPreciousness} />
        </section>

        {/* Disposition */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Disposition <span className="text-red-500">*</span></label>
          <DispositionSelector value={disposition} onChange={setDisposition} />
        </section>

        {/* Estimated Value */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estimated Value <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={estimatedValue}
              onChange={e => setEstimatedValue(e.target.value)}
              placeholder="0"
              className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </section>

        {/* Notes */}
        <section>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Context, provenance, who to give it to..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </section>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-shrink-0">
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
