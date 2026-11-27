import { TITLE_SLOT_LIMIT } from '@core/life/titles';
import './title-collection.css';

export function InkOnlineTitles({ titles }: { titles?: string[] }) {
  if (!titles?.length) return null;
  return <ul className="ink-online-titles" aria-label="已裝備稱號">
    {titles.slice(0, TITLE_SLOT_LIMIT).map((title, index) => <li key={`${index}-${title}`}>{title}</li>)}
  </ul>;
}
