import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Toast } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

/** 右上角 Toast 通知容器 — 視覺設計由網頁美術提供 */
export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            onClick={() => onRemove(toast.id)}
            className={`max-w-sm w-full bg-bg-card rounded-lg border-l-4 px-4 py-3 flex items-center gap-3 shadow-lg cursor-pointer ${
              toast.type === 'success' ? 'border-l-accent-main' : 'border-l-red-500'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-5 h-5 text-accent-main shrink-0" />
              : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            }
            <span className="text-sm text-text-main">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
