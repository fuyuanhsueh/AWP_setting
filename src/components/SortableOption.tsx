import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '../utils';

interface SortableOptionProps {
  id: string;
  opt: string;
  idx: number;
  featureId: string;
  selectedOption: string;
  onEdit: (featureId: string, idx: number, text: string) => void;
  onRemove: (featureId: string, idx: number) => void;
  onSelect: (featureId: string, opt: string) => void;
}

/** 可拖拽排序的選項列表項目 */
export function SortableOption({ id, opt, idx, featureId, selectedOption, onEdit, onRemove, onSelect }: SortableOptionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 'auto' as any };

  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2 group/opt transition-opacity", isDragging && "opacity-50")}>
      <div {...attributes} {...listeners} className="p-2 text-text-dim hover:text-accent-main cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 flex items-center bg-slate-900 border border-border-main rounded-md overflow-hidden">
        <input value={opt} onChange={(e) => onEdit(featureId, idx, e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-1.5 text-sm outline-none" />
        {selectedOption === opt ? (
          <div className="px-2 text-[8px] font-bold text-accent-main uppercase tracking-tighter bg-accent-main/10 h-full flex items-center">當前選中</div>
        ) : (
          <button onClick={() => onSelect(featureId, opt)} className="px-2 text-[8px] font-bold text-text-dim hover:text-accent-main uppercase tracking-tighter hover:bg-accent-main/10 h-full flex items-center transition-colors border-l border-border-main/30">設為預設</button>
        )}
      </div>
      <button onClick={() => onRemove(featureId, idx)} className="p-2 text-text-dim hover:text-red-400 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
