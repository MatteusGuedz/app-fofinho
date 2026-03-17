import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Modal } from '../components/ui/Modal';
import { Toast, type ToastMessage } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';

type ConfirmState = {
  open: boolean;
  title?: string;
  body?: string;
  confirmText?: string;
  danger?: boolean;
  resolve?: (value: boolean) => void;
};

type UiContextValue = {
  toastSuccess: (text: string) => void;
  toastError: (text: string) => void;
  toastInfo: (text: string) => void;
  confirm: (opts: {
    title: string;
    body: string;
    confirmText?: string;
    danger?: boolean;
  }) => Promise<boolean>;
};

const UiContext = createContext<UiContextValue | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
  });

  const toastSuccess = useCallback((text: string) => {
    setToast({ id: Date.now(), type: 'success', text });
  }, []);
  const toastError = useCallback((text: string) => {
    setToast({ id: Date.now(), type: 'error', text });
  }, []);
  const toastInfo = useCallback((text: string) => {
    setToast({ id: Date.now(), type: 'info', text });
  }, []);

  const confirm = useCallback(
    (opts: { title: string; body: string; confirmText?: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({
          open: true,
          title: opts.title,
          body: opts.body,
          confirmText: opts.confirmText ?? 'Confirmar',
          danger: opts.danger,
          resolve,
        });
      }),
    [],
  );

  const value = useMemo(
    () => ({ toastSuccess, toastError, toastInfo, confirm }),
    [toastSuccess, toastError, toastInfo, confirm],
  );

  return (
    <UiContext.Provider value={value}>
      {children}
      <Toast message={toast} onClear={() => setToast(null)} />
      <Modal
        open={confirmState.open}
        title={confirmState.title}
        onClose={() => {
          confirmState.resolve?.(false);
          setConfirmState({ open: false });
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                confirmState.resolve?.(false);
                setConfirmState({ open: false });
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className={confirmState.danger ? 'btn-danger' : ''}
              onClick={() => {
                confirmState.resolve?.(true);
                setConfirmState({ open: false });
              }}
            >
              {confirmState.confirmText ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <p style={{ lineHeight: 1.5 }}>{confirmState.body}</p>
      </Modal>
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi deve ser usado dentro de UiProvider');
  return ctx;
}

