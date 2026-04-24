import React from 'react';
import { Save, History, FileJson, Download, Code } from 'lucide-react';
import { cn } from '../utils';

interface HeaderProps {
  regionName: string;
  setRegionName: (n: string) => void;
  isExporting: boolean;
  onSaveSnapshot: () => void;
  onShowSnapshots: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportYaml: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowYaml: () => void;
  onExportYaml: () => void;
}

/** 頂部導航列 */
export function Header({ regionName, setRegionName, isExporting, onSaveSnapshot, onShowSnapshots, onExportJson, onImportJson, onImportYaml, onShowYaml, onExportYaml }: HeaderProps) {
  return (
    <header className="h-16 px-6 flex items-center justify-between bg-bg-card border-b border-border-main sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-accent-main">AWP</span> 配置產生器
        </div>
        <div className="h-4 w-[1px] bg-border-main mx-2" />
        <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest">系統版本 v4.2.0 // 生產環境</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end mr-2">
          <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">當前地區</label>
          <input value={regionName} onChange={(e) => setRegionName(e.target.value)} className="bg-transparent text-right border-none focus:ring-0 text-accent-main font-medium p-0 h-auto" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSaveSnapshot} title="儲存至瀏覽器紀錄" className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-accent-main transition-all"><Save className="w-4 h-4" /></button>
          <button onClick={onShowSnapshots} title="讀取歷史紀錄" className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-accent-main transition-all"><History className="w-4 h-4" /></button>
          <div className="h-6 w-[1px] bg-border-main mx-1" />
          <button onClick={onExportJson} title="導出進度為 JSON" className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-blue-400 transition-all"><FileJson className="w-4 h-4" /></button>
          <label title="從 JSON 匯入進度" className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-blue-400 transition-all cursor-pointer">
            <Download className="w-4 h-4 rotate-180" /><input type="file" accept=".json" onChange={onImportJson} className="hidden" />
          </label>
          <div className="h-6 w-[1px] bg-border-main mx-1" />
          <label title="匯入 YAML 配置" className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-emerald-400 transition-all cursor-pointer">
            <Code className="w-4 h-4 rotate-180" /><input type="file" accept=".yaml,.yml" onChange={onImportYaml} className="hidden" />
          </label>
          <button onClick={onShowYaml} title="檢視生成的 YAML" className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-accent-main transition-all"><Code className="w-4 h-4" /></button>
          <button onClick={onExportYaml} className={cn("px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200", isExporting ? "bg-green-600 text-white" : "bg-accent-main hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-900/20")}>
            {isExporting ? '導出成功！' : '導出 YAML'}
          </button>
        </div>
      </div>
    </header>
  );
}
