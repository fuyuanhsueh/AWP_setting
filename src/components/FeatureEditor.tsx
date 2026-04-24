import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, X, Plus, Settings, Sparkles, Loader2, Terminal, Monitor, FileText, History, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { AWPFeature } from '../types';
import { DEFAULT_FEATURES, CATEGORY_ORDER } from '../constants';
import { cn, toPascalCaseId } from '../utils';
import { SortableOption } from './SortableOption';

interface FeatureEditorProps {
  feature: AWPFeature;
  features: AWPFeature[];
  onClose: () => void;
  updateFeatureField: (id: string, field: keyof AWPFeature, value: any) => void;
  renameFeatureWithId: (id: string, newNameEn: string) => void;
  setFeatures: React.Dispatch<React.SetStateAction<AWPFeature[]>>;
  handleAddOption: (featureId: string) => void;
  handleRemoveOption: (featureId: string, idx: number) => void;
  handleEditOptionText: (featureId: string, idx: number, text: string) => void;
  handleUpdateOption: (id: string, opt: string) => void;
}

/** 功能編輯 Modal（含 Feature Name → ID 連動、AI 規格產出） */
export function FeatureEditor({
  feature, features, onClose, updateFeatureField, renameFeatureWithId,
  setFeatures, handleAddOption, handleRemoveOption, handleEditOptionText, handleUpdateOption
}: FeatureEditorProps) {
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /** 即時預覽新 ID 與重複檢查（任務 4） */
  const previewId = useMemo(() => toPascalCaseId(feature.nameEn), [feature.nameEn]);
  const isDuplicateId = useMemo(() => features.some(f => f.id === previewId && f.id !== feature.id), [features, previewId, feature.id]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFeatures(prev => prev.map(f => {
      if (f.id === feature.id) {
        const oldIndex = parseInt((active.id as string).split('-')[1]);
        const newIndex = parseInt((over.id as string).split('-')[1]);
        return { ...f, options: arrayMove(f.options, oldIndex, newIndex) };
      }
      return f;
    }));
  };

  const generateAiSpec = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { alert('請先在設定中配置 GEMINI_API_KEY。'); return; }
    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `你是一位資長的 AWP (Amusement with Prizes) 遊戲系統企劃工程師。
請針對以下功能項目產出專業且詳細的「功能描述」、「法規注意事項」以及「軟體技術規格 Markdown」。

要求：
1. description: 正規、詳細，且對非技術人員簡單易懂。
2. legalTip: 包含常見的法規風險或技術實施建議。
3. markdownSpec: 給軟體團隊的技術規格書。需包含：
   - 企劃邏輯與資料結構說明
   - 設定值對應的系統行為 (例如：當選項為 ${feature.options[0]} 時，系統應執行的動作)
   - 邊界條件與異常處理
   - 使用 Markdown 語法，包含標題、列表與程式碼方塊（如有需要）。
4. 語言：繁體中文。
5. 請以 JSON 格式回傳，包含 "description"、"legalTip" 與 "markdownSpec" 欄位。

功能名稱 (中)：${feature.nameZh}
功能名稱 (英)：${feature.nameEn}
功能 ID: ${feature.id}
目前分類：${feature.category}
選項：${feature.options.join(', ')}

範例回傳格式：
{
  "description": "...",
  "legalTip": "...",
  "markdownSpec": "# 技術規格\\n## 邏輯說明..."
}`;
      const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[0]);
        updateFeatureField(feature.id, 'description', aiData.description);
        updateFeatureField(feature.id, 'legalTip', aiData.legalTip);
        updateFeatureField(feature.id, 'markdownSpec', aiData.markdownSpec);
        updateFeatureField(feature.id, 'aiPrompt', prompt);
        setIsImageGenerating(true);
        setTimeout(() => {
          updateFeatureField(feature.id, 'schematicUrl', `https://picsum.photos/seed/${feature.id}/800/600?grayscale`);
          setIsImageGenerating(false);
        }, 1200);
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
      alert('AI 產出失敗，請檢查網路連線或 API Key。');
    } finally { setIsAiGenerating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-bg-card border border-border-main rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border-main flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2"><Edit3 className="w-5 h-5 text-accent-main" />編輯功能設定</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* 分類選擇 */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">功能所屬分類 (將影響 YAML 區塊)</label>
            <select value={feature.category || 'SystemSetup.Configuration'} onChange={(e) => updateFeatureField(feature.id, 'category', e.target.value)}
              className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none text-text-main">
              {CATEGORY_ORDER.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* 模板選擇 */}
          <div className="bg-slate-900/50 border border-border-main rounded-lg p-3 space-y-2">
            <label className="text-[10px] uppercase text-accent-main font-bold tracking-wider flex items-center gap-2"><Settings className="w-3 h-3" />套用功能模板 (快速帶入初始設定)</label>
            <select onChange={(e) => {
              const template = DEFAULT_FEATURES.find(f => f.id === e.target.value);
              if (template) setFeatures(prev => prev.map(f => f.id === feature.id ? { ...f, nameEn: template.nameEn, nameZh: template.nameZh, options: [...template.options], selectedOption: template.selectedOption, description: template.description, legalTip: template.legalTip, type: template.type } : f));
              e.target.value = '';
            }} className="w-full bg-slate-800 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none text-text-main">
              <option value="">選擇模板...</option>
              {DEFAULT_FEATURES.map(f => <option key={f.id} value={f.id}>{f.nameEn} ({f.nameZh})</option>)}
            </select>
          </div>

          {/* 基本資訊 + ID 即時預覽（任務 4） */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 overflow-hidden">
              <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">功能名稱 (中文)</label>
              <input value={feature.nameZh} onChange={(e) => updateFeatureField(feature.id, 'nameZh', e.target.value)}
                className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none" />
            </div>
            <div className="space-y-1.5 overflow-hidden">
              <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">Feature Name (English)</label>
              <input value={feature.nameEn} onChange={(e) => renameFeatureWithId(feature.id, e.target.value)}
                className={cn("w-full bg-slate-900 border rounded-md px-3 py-2 text-sm focus:ring-1 outline-none", isDuplicateId ? "border-red-500 focus:ring-red-500" : "border-border-main focus:ring-accent-main")} />
              {/* ID 即時預覽 */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-text-dim">ID 預覽:</span>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold border", isDuplicateId ? "bg-red-900/20 text-red-400 border-red-500/30" : "bg-slate-800 text-accent-main border-accent-main/20")}>{previewId || '—'}</span>
                {isDuplicateId && <span className="text-[10px] text-red-400 font-bold">⚠ ID 重複</span>}
              </div>
            </div>
          </div>

          {/* 描述與法規 */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider flex items-center gap-2">描述<span className="text-[8px] bg-slate-800 px-1 rounded text-text-dim/50 font-normal italic"># 企劃規格說明</span></label>
                <button onClick={generateAiSpec} disabled={isAiGenerating}
                  className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                    isAiGenerating ? "bg-slate-800 text-text-dim cursor-not-allowed" : "bg-accent-main/10 text-accent-main hover:bg-accent-main hover:text-slate-900 border border-accent-main/20")}>
                  {isAiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isAiGenerating ? "AI 規格產出中..." : "AI 產出規格"}
                </button>
              </div>
              <textarea value={feature.description} onChange={(e) => updateFeatureField(feature.id, 'description', e.target.value)} rows={3} placeholder="點擊「AI 產出規格」按鈕由 AI 自動編寫詳細說明..."
                className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none resize-none min-h-[60px] leading-relaxed" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider flex items-center gap-2">法規提示 / 風險資訊<span className="text-[8px] bg-slate-800 px-1 rounded text-text-dim/50 font-normal italic"># 法律與認證合規參考</span></label>
              <textarea value={feature.legalTip} onChange={(e) => updateFeatureField(feature.id, 'legalTip', e.target.value)} rows={2} placeholder="自動根據功能類別產出合規建議..."
                className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none resize-none text-amber-200/80 italic leading-relaxed" />
            </div>
          </div>

          {/* 類型與預設 */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">YAML 分類 (影響排列位置)</label>
              <select value={feature.category} onChange={(e) => updateFeatureField(feature.id, 'category', e.target.value)}
                className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none">
                <option value="SystemSetup.Configuration">[SystemSetup] Configuration</option>
                <option value="SystemSetup.JackpotSetting">[SystemSetup] JackpotSetting</option>
                <option value="SystemSetup.TimeAdjust">[SystemSetup] TimeAdjust</option>
                <option value="SystemSetup.VolumeSetting">[SystemSetup] VolumeSetting</option>
                <option value="SystemSetup.PasswordSetting">[SystemSetup] PasswordSetting</option>
                <option value="Peripheral.BillAcceptorSetting">[Peripheral] BillAcceptorSetting</option>
                <option value="Peripheral.PrinterSetting">[Peripheral] PrinterSetting</option>
                <option value="Peripheral.MeterSetting">[Peripheral] MeterSetting</option>
              </select>
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">組件配置 (類型 & 快速預設)</label>
              <select value="" onChange={(e) => {
                const presets: Record<string, { type: any, options: string[] }> = {
                  'switch': { type: 'Switch', options: ['OFF', 'ON'] },
                  'combobox_offon': { type: 'Combobox', options: ['OFF', 'ON'] },
                  'combobox_cents': { type: 'Combobox', options: ['$0.01', '$0.02', '$0.05', '$0.10', '$0.20', '$0.25', '$0.50', '$1.00', '$2.00', '$5.00', '$10.00'] },
                  'combobox_dollars': { type: 'Combobox', options: ['$1.00', '$5.00', '$10.00', '$50.00', '$100.00', '$500.00', '$1000.00'] },
                  'combobox_chance': { type: 'Combobox', options: ['Worse', 'Bad', 'Medium', 'Good', 'Best'] },
                  'combobox_jackpot': { type: 'Combobox', options: ['$500.00 ~ $1200.00', '$1000.00 ~ $2500.00', '$1250.00 ~ $3500.00', '$1250.00 ~ $5000.00', '$2500.00 ~ $6250.00', '$3000.00 ~ $7500.00', '$4000.00 ~ $10000.00'] },
                  'combobox_display': { type: 'Combobox', options: ['Dollar', 'Credit'] },
                  'combobox_empty': { type: 'Combobox', options: [] },
                  'spinbox': { type: 'Spinbox', options: [] }, 'textfield': { type: 'Textfield', options: [] },
                  'numberfield': { type: 'Numberfield', options: [] }, 'numberpad': { type: 'Numberpad', options: [] }, 'label': { type: 'Label', options: [] }
                };
                const selected = presets[e.target.value];
                if (selected) setFeatures(prev => prev.map(f => f.id === feature.id ? { ...f, type: selected.type, options: selected.options.length > 0 ? selected.options : f.options, selectedOption: selected.options.length > 0 ? selected.options[0] : f.selectedOption } : f));
              }} className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none text-accent-main font-bold">
                <option value="">選擇類型與預設配置...</option>
                <option value="switch">Switch (開關)</option>
                <option value="combobox_offon">Combobox (選單) - [OFF, ON]</option>
                <option value="combobox_cents">Combobox (選單) - [分幣預設]</option>
                <option value="combobox_dollars">Combobox (選單) - [金額預設]</option>
                <option value="combobox_chance">Combobox (選單) - [機率預設]</option>
                <option value="combobox_jackpot">Combobox (選單) - [彩金範圍]</option>
                <option value="combobox_display">Combobox (選單) - [顯示格式]</option>
                <option value="combobox_empty">Combobox (選單) - [空選單]</option>
                <option value="spinbox">Spinbox (滾動選單)</option>
                <option value="textfield">Textfield (文字輸入)</option>
                <option value="numberfield">Numberfield (數值輸入)</option>
                <option value="numberpad">Numberpad (數字鍵盤)</option>
                <option value="label">Label (標籤顯示)</option>
              </select>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-text-dim">當前類型:</span>
                <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-accent-main font-bold border border-accent-main/20">{feature.type}</span>
              </div>
            </div>
          </div>

          {/* 選項管理 */}
          <div className="space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">配置選項列表 (可拖拽排序)</label>
              <button onClick={() => handleAddOption(feature.id)} className="text-[10px] flex items-center gap-1 text-accent-main hover:text-emerald-400 font-bold uppercase"><Plus className="w-3 h-3" /> 新增選項</button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={feature.options.map((_, idx) => `opt-${idx}`)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {feature.options.map((opt, idx) => (
                    <SortableOption key={`opt-${idx}`} id={`opt-${idx}`} opt={opt} idx={idx} featureId={feature.id}
                      selectedOption={feature.selectedOption} onEdit={handleEditOptionText} onRemove={handleRemoveOption} onSelect={handleUpdateOption} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* 技術規格 */}
          <div className="space-y-6 pt-4 border-t border-white/5">
            <div className="space-y-3">
              <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider flex items-center gap-2">軟體研發技術規格 (Markdown)<span className="text-[8px] bg-slate-800 px-1 rounded text-text-dim/50 font-normal italic"># 給開發團隊的邏輯定義</span></label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[9px] text-text-dim uppercase font-bold flex items-center gap-1.5 opacity-50"><Sparkles className="w-3 h-3" /> AI Schematic (示意圖)</div>
                  <div className="w-full aspect-square bg-slate-900 border border-border-main rounded-md overflow-hidden relative group">
                    {feature.schematicUrl ? (
                      <>
                        <img src={feature.schematicUrl} alt={`${feature.nameEn} Schematic`} className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:opacity-100 transition-opacity duration-500" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                          <div className="p-3 bg-accent-main/20 rounded-full mb-3 backdrop-blur-sm border border-accent-main/30 group-hover:scale-110 transition-transform"><Terminal className="w-6 h-6 text-accent-main" /></div>
                          <div className="text-[10px] font-black text-accent-main uppercase tracking-widest mb-1 drop-shadow-lg">{feature.id}</div>
                          <div className="text-[14px] font-bold text-white uppercase tracking-tight leading-tight px-4">{feature.nameZh}</div>
                          <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="h-[1px] w-4 bg-accent-main" /><span className="text-[8px] font-mono text-accent-main">TECHNICAL SCHEMATIC v1.0</span><div className="h-[1px] w-4 bg-accent-main" />
                          </div>
                        </div>
                        <button onClick={generateAiSpec} className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity" title="重新產出規格與示意圖"><History className="w-3.5 h-3.5 text-accent-main" /></button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/50">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-border-main flex items-center justify-center mb-3"><Monitor className="w-6 h-6 text-text-dim/30" /></div>
                        <p className="text-[10px] text-text-dim/50 font-medium">點擊上方「AI 產出規格」生成示意圖</p>
                      </div>
                    )}
                    {isImageGenerating && (
                      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-accent-main animate-spin mb-3" /><p className="text-[10px] text-accent-main font-black uppercase tracking-widest animate-pulse">繪製技術示意圖中...</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[9px] text-text-dim uppercase font-bold flex items-center gap-1.5 opacity-50"><Terminal className="w-3 h-3" /> Preview (Markdown Render)</div>
                  <div className="w-full bg-slate-950/50 border border-border-main border-dashed rounded-md px-4 py-3 text-sm min-h-[150px] max-h-[310px] md:max-h-none h-[calc(100%-24px)] overflow-y-auto custom-scrollbar leading-relaxed">
                    {!feature.markdownSpec ? (
                      <div className="h-full flex flex-col items-center justify-center text-text-dim/30 py-12"><FileText className="w-8 h-8 mb-2" /><p className="text-[10px] italic">尚未產出技術規格</p></div>
                    ) : (
                      <article className="prose prose-invert prose-xs max-w-none prose-headings:text-accent-main prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-headings:border-b prose-headings:border-white/5 prose-headings:pb-1 prose-p:text-text-dim prose-li:text-text-dim prose-strong:text-white prose-code:text-accent-main prose-code:bg-accent-main/10 prose-code:px-1 prose-code:rounded">
                        <ReactMarkdown>{feature.markdownSpec}</ReactMarkdown>
                      </article>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {feature.aiPrompt && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider flex items-center gap-2">最後一次 AI 提詞內容<span className="text-[8px] bg-slate-800 px-1 rounded text-text-dim/50 font-normal italic"># Prompt Registry</span></label>
                <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-3 relative group">
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <span className="text-[8px] text-amber-500/50 font-mono">GENERATE_SPEC_v2.1</span>
                    <button onClick={() => { navigator.clipboard.writeText(feature.aiPrompt || ''); alert('AI 提詞已複製！'); }} className="p-1 hover:bg-amber-500/10 rounded transition-colors"><Copy className="w-3 h-3 text-amber-500/50 hover:text-amber-500" /></button>
                  </div>
                  <pre className="text-[10px] font-mono text-amber-500/70 whitespace-pre-wrap leading-tight max-h-[100px] overflow-y-auto custom-scrollbar">{feature.aiPrompt}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-900/50 border-t border-border-main flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-accent-main hover:bg-emerald-400 text-slate-900 rounded-md text-sm font-bold transition-colors">儲存並關閉</button>
        </div>
      </motion.div>
    </div>
  );
}
