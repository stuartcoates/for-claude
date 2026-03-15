import { Camera } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';

interface Props {
  onCapture: (dataUrl: string) => void;
  label?: string;
}

export function CameraCapture({ onCapture, label = 'Take Photo' }: Props) {
  const { inputRef, trigger, handleChange } = useCamera(onCapture);

  return (
    <>
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
        className="w-full flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors bg-gray-50 dark:bg-gray-800/50 active:bg-gray-100"
      >
        <Camera size={40} strokeWidth={1.5} />
        <span className="text-sm font-medium">{label}</span>
      </button>
    </>
  );
}
