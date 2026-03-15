import { RefreshCw } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';

interface Props {
  dataUrl: string;
  onRetake: (dataUrl: string) => void;
}

export function PhotoPreview({ dataUrl, onRetake }: Props) {
  const { inputRef, trigger, handleChange } = useCamera(onRetake);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-900" style={{ aspectRatio: '4/3' }}>
      <img src={dataUrl} alt="Item photo" className="w-full h-full object-cover" />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={trigger}
        className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium hover:bg-black/80 transition-colors"
      >
        <RefreshCw size={12} />
        Retake
      </button>
    </div>
  );
}
