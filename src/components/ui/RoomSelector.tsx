import { useState } from 'react';
import { PREDEFINED_ROOMS } from '../../utils/constants';
import { Plus } from 'lucide-react';

interface Props {
  value: string;
  onChange: (room: string) => void;
  customRooms?: string[];
  onAddCustomRoom?: (room: string) => void;
}

export function RoomSelector({ value, onChange, customRooms = [], onAddCustomRoom }: Props) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const allRooms = [...PREDEFINED_ROOMS, ...customRooms.filter(r => !PREDEFINED_ROOMS.includes(r as typeof PREDEFINED_ROOMS[number]))];

  function handleAddCustom() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onAddCustomRoom?.(trimmed);
    onChange(trimmed);
    setCustomInput('');
    setShowCustomInput(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allRooms.map(room => (
          <button
            key={room}
            type="button"
            onClick={() => onChange(room)}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
              value === room
                ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
            }`}
          >
            {room}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustomInput(v => !v)}
          className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 flex items-center gap-1"
        >
          <Plus size={14} /> Custom
        </button>
      </div>
      {showCustomInput && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
            placeholder="Room name..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
