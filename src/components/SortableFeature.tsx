import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit3, Trash2, ShieldAlert } from 'lucide-react';
import { AWPFeature } from '../types';
import { cn } from '../utils';

interface SortableFeatureProps {
  feature: AWPFeature;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateOption: (id: string, opt: string) => void;
  /** 若因依賴被 disable，顯示父功能名稱 */
  disabledByParent?: string | null;
}

/** 可拖拽排序的功能列表項目（含依賴連動提示） */
export function SortableFeature({ feature, onToggle, onEdit, onRemove, onUpdateOption, disabledByParent }: SortableFeatureProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: feature.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 'auto' as any };
  const isDepDisabled = !!disabledByParent;

  return (
    <div ref={setNodeRef} style={style} className={cn(
      "flex items-center bg-bg-card border border-border-main p-2 px-4 rounded-md transition-all group relative",
      !feature.enabled && "opacity-50 grayscale-[0.5]",
      isDepDisabled && "opacity-40 grayscale pointer-events-none",
      isDragging && "opacity-50 border-accent-main shadow-lg"
    )}>
      {/* 依賴 disable 提示 */}
      {isDepDisabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-md z-10">
          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            需先啟用 {disabledByParent}
          </div>
        </div>
      )}
      <div {...attributes} {...listeners} className="mr-3 text-text-dim hover:text-text-main cursor-grab active:cursor-grabbing p-1">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="mr-4">
        <input type="checkbox" checked={feature.enabled} onChange={() => onToggle(feature.id)}
          className="w-4 h-4 rounded border-border-main bg-slate-900 text-accent-main focus:ring-accent-main focus:ring-offset-slate-900 cursor-pointer" />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-main truncate">{feature.nameEn}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(feature.id)} className="text-text-dim hover:text-accent-main transition-colors flex-shrink-0 p-1">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold bg-bg-deep text-accent-main/60 px-1.5 py-0.5 rounded border border-border-main/50 flex-shrink-0 group-hover:text-accent-main group-hover:border-accent-main/30 transition-all">
              {feature.selectedOption}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <div className="flex gap-1 overflow-x-auto max-w-[200px] no-scrollbar">
          {feature.options.map((opt, idx) => (
            <button key={`${feature.id}-opt-${idx}`} onClick={() => onUpdateOption(feature.id, opt)}
              className={cn("px-2 py-0.5 rounded text-[10px] font-bold transition-all uppercase tracking-wider whitespace-nowrap",
                feature.selectedOption === opt ? "bg-accent-main text-slate-900" : "bg-slate-700 text-text-dim hover:text-text-main"
              )}>{opt}</button>
          ))}
        </div>
        <button onClick={() => onRemove(feature.id)} className="p-1.5 text-text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
