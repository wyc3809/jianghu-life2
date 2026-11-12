import { useLayoutEffect, useRef, type ComponentPropsWithoutRef } from 'react';

type Props = ComponentPropsWithoutRef<'dialog'> & { onDismiss?: () => void };

/** 共用原生彈窗：隔開背景操作，關閉後返回原入口；不代玩家確認獎勵或換裝。 */
export function InkModal({ children, onDismiss, className = '', ...props }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return <dialog {...props} ref={ref} className={`ink-native-modal ${className}`}
    aria-modal="true" onCancel={event => { event.preventDefault(); onDismiss?.(); }}>
    {children}
  </dialog>;
}
