import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, X, Clock, Trash2 } from 'lucide-react';
import { Snapshot } from '../types';

interface SnapshotPanelProps {
  snapshots: Snapshot[];
  onClose: () => void;
  onLoad: (snap: Snapshot) => void;
  onDelete: (id: string) => void;
}

/** 快照歷史紀錄 Modal */
export function SnapshotPanel({ snapshots, onClose, onLoad, onDelete }: SnapshotPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-bg-card border border-border-main rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-border-main flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2"><History className="w-5 h-5 text-accent-main" />配置歷史紀錄</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {snapshots.length === 0 ? (
            <div className="text-center py-12 text-text-dim"><Clock className="w-12 h-12 mx-auto mb-4 opacity-20" /><p className="text-sm">尚無儲存的配置。</p></div>
          ) : snapshots.map((snap) => (
            <div key={snap.id} className="bg-slate-900 border border-border-main rounded-lg p-4 flex items-center justify-between group">
              <div className="space-y-1">
                <div className="text-sm font-bold text-text-main">{snap.name}</div>
                <div className="text-[10px] text-text-dim flex items-center gap-2"><Clock className="w-3 h-3" /> {snap.timestamp}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onLoad(snap)} className="px-3 py-1.5 bg-accent-main hover:bg-emerald-400 text-slate-900 rounded text-[10px] font-bold uppercase transition-colors">還原</button>
                <button onClick={() => onDelete(snap.id)} className="p-2 text-text-dim hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
