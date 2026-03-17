import { useEffect } from 'react';

export type ToastMessage = {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
};

type ToastProps = {
  message: ToastMessage | null;
  onClear: () => void;
};

export function Toast({ message, onClear }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onClear, 3500);
    return () => clearTimeout(id);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className={`toast toast-${message.type}`}>
      <span className="toast-icon">
        {message.type === 'success' && '✅'}
        {message.type === 'error' && '⚠️'}
        {message.type === 'info' && '💕'}
      </span>
      <span>{message.text}</span>
    </div>
  );
}

