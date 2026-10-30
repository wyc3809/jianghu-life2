import type { ReactNode } from 'react';
import './newbie-guide.css';

/** 局部宣紙提示，不遮主體、不接管操作；略過與重看由真存檔管理。 */
export function InkNewbieGuide({ title, children, onDismiss, action }: {
  title: string; children: ReactNode; onDismiss?: () => void; action?: ReactNode;
}) {
  return <aside className="ink-newbie-guide" aria-label="操作指引" aria-live="polite">
    <div><strong>{title}</strong><p>{children}</p></div>
    {action}
    {onDismiss && <button type="button" className="ink-guide-later" onClick={onDismiss} aria-label="略過操作指引">略過</button>}
  </aside>;
}
