import { useSyncExternalStore } from 'react';
import { getLifeSaveError, subscribeLifeSaveStatus } from '@core/life/saveIndexedDb';
import { flushPersist } from '../../store/persistSchedule';

export function InkSaveStatus() {
  const error = useSyncExternalStore(subscribeLifeSaveStatus, getLifeSaveError, () => null);
  if (!error) return null;
  return <aside className="ink-save-warning" role="status">{error} <button type="button" onClick={flushPersist}>重試儲存</button></aside>;
}
