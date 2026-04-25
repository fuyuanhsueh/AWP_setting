import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
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
            className={`max-w-sm w-full bg-gray-800/95 backdrop-blur-sm rounded-lg border-l-4 px-4 py-3 flex items-start gap-3 shadow-lg ${
              toast.type === 'success' ? 'border-l-green-500' : 'border-l-red-500'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            }
            <span className="text-gray-100 text-sm flex-1">{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
