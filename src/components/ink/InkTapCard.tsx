import { useState, type ReactNode } from 'react';
import { GachaSheet } from './InkGachaReveal';

/** 收藏先看簡表，點入才顯示完整資料與原有操作。 */
export function InkTapCard({ title, subtitle, children, leading, detailClassName, closeOnAction = false }: {
  title: string; subtitle?: string; children: ReactNode; leading?: ReactNode; detailClassName?: string; closeOnAction?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return <li className="ink-tap-card-row"><button type="button" className="ink-tap-card-open" aria-label={`查看${title}`} onClick={() => setOpen(true)}>
    {leading}<span><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span><span aria-hidden="true">›</span>
  </button>
    {open && <GachaSheet title={title} onClose={() => setOpen(false)}>
      <div className={detailClassName} onClickCapture={event => {
        if (closeOnAction && (event.target as Element).closest('button')) setOpen(false);
      }}>{children}</div>
    </GachaSheet>}
  </li>;
}
