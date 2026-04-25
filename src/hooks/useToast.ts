import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const MAX_TOASTS = 3;

/** Toast 通知管理 hook */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => {
      const next = [{ id, type, message }, ...prev];
      return next.slice(0, MAX_TOASTS);
    });
    // 成功 3 秒、錯誤 5 秒後自動移除
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, type === 'success' ? 3000 : 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
