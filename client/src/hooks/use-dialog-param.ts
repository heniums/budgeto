import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface DialogParam {
  /** Current param value: an item id, 'new', or null when absent. */
  value: string | null;
  /** True when the param is present. */
  isOpen: boolean;
  /** Writes the param (default 'new'), preserving all other params. */
  open: (value?: string) => void;
  /**
   * Removes the param, preserving all other params. Pass { replace: true }
   * when closing programmatically (e.g. a stale id) so the correction
   * replaces the current history entry instead of adding one Back can
   * revisit.
   */
  close: (options?: { replace?: boolean }) => void;
}

/**
 * Syncs a single dialog's identity into the URL query string so any open
 * dialog is addressable: loading `?key=<id>` (or `?key=new`) reopens it.
 * Opening and closing push history entries, so browser Back closes the dialog.
 */
export function useDialogParam(key: string): DialogParam {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key);

  const open = useCallback(
    (next?: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(key, next ?? 'new');
      setSearchParams(params);
    },
    [key, searchParams, setSearchParams],
  );

  const close = useCallback(
    (options?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams);
      if (!params.has(key)) {
        return;
      }
      params.delete(key);
      setSearchParams(params, { replace: options?.replace ?? false });
    },
    [key, searchParams, setSearchParams],
  );

  return { value, isOpen: value !== null, open, close };
}
