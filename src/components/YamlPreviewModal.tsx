import React from 'react';
import { motion } from 'motion/react';
import { Code, X, Copy } from 'lucide-react';

interface YamlPreviewModalProps {
  onClose: () => void;
  generateMachineYaml: () => string;
  onExportYaml: () => void;
}

/** YAML 預覽 Modal */
export function YamlPreviewModal({ onClose, generateMachineYaml, onExportYaml }: YamlPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-slate-950 border border-border-main rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-bg-card">
          <div className="flex items-center gap-2"><Code className="w-5 h-5 text-accent-main" /><h3 className="text-sm font-bold uppercase tracking-widest">Engine-Ready YAML Configuration</h3></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-hidden flex flex-col gap-4">
          <div className="flex items-center justify-between text-[10px] text-text-dim">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-accent-main/10 text-accent-main rounded border border-accent-main/20 font-mono">STATUS: VALIDATED</span>
              <span className="font-mono">LAST UPDATED: {new Date().toISOString().split('T')[0]}</span>
            </div>
            <button onClick={() => navigator.clipboard.writeText(generateMachineYaml())} className="flex items-center gap-1 hover:text-white transition-colors"><Copy className="w-3 h-3" /> 複製代碼</button>
          </div>
          <div className="flex-1 bg-black/80 rounded-lg border border-white/5 p-4 overflow-y-auto custom-scrollbar">
            <pre className="text-xs font-mono text-emerald-400/90 leading-relaxed">{generateMachineYaml()}</pre>
          </div>
        </div>
        <div className="p-4 bg-bg-card border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-bold transition-all">關閉</button>
          <button onClick={onExportYaml} className="px-6 py-2 bg-accent-main hover:bg-emerald-400 text-slate-900 rounded-md text-sm font-bold transition-all shadow-lg">下載 .yaml 檔案</button>
        </div>
      </motion.div>
    </div>
  );
}
