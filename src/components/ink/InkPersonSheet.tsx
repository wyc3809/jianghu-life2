import { createContext, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './person-screen.css';
import { inkArtUrl } from '../../ui/inkAssets';

export const InkPersonNativeContext = createContext(false);

/** 底部冊頁：原生焦點圍欄，關閉復原入口焦點，內容按各區自行捲動。 */
export function InkPersonSheet({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!, previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<dialog ref={ref} className={`ink-person-sheet ${className}`} aria-label={title}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h2>{title}</h2><button type="button" aria-label={`關閉${title}`} onClick={onClose}><img src={inkArtUrl('art/parchment-ui/icon-close.webp')} alt="" width="24" height="24" />收起</button></header>
    {children}
  </dialog>, document.body);
}
