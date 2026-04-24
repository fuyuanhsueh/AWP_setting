/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Settings, 
  Info, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Monitor, 
  FileJson,
  ChevronRight,
  ShieldAlert,
  X,
  Edit3,
  GripVertical,
  Save,
  History,
  Clock,
  Lock,
  Code,
  Copy,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  Terminal,
  MessageSquare,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DEFAULT_FEATURES } from './constants';
import { AWPFeature } from './types';
import yaml from 'js-yaml';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Snapshot {
  id: string;
  name: string;
  timestamp: string;
  regionName: string;
  features: AWPFeature[];
}

interface SortableOptionProps {
  id: string;
  opt: string;
  idx: number;
  featureId: string;
  selectedOption: string;
  onEdit: (featureId: string, idx: number, text: string) => void;
  onRemove: (featureId: string, idx: number) => void;
  onSelect: (featureId: string, opt: string) => void;
  key?: React.Key;
}

function SortableOption({ id, opt, idx, featureId, selectedOption, onEdit, onRemove, onSelect }: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "flex items-center gap-2 group/opt transition-opacity",
        isDragging && "opacity-50"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="p-2 text-text-dim hover:text-accent-main cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 flex items-center bg-slate-900 border border-border-main rounded-md overflow-hidden">
        <input 
          value={opt}
          onChange={(e) => onEdit(featureId, idx, e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-1.5 text-sm outline-none"
        />
        {selectedOption === opt ? (
          <div className="px-2 text-[8px] font-bold text-accent-main uppercase tracking-tighter bg-accent-main/10 h-full flex items-center">當前選中</div>
        ) : (
          <button 
            onClick={() => onSelect(featureId, opt)}
            className="px-2 text-[8px] font-bold text-text-dim hover:text-accent-main uppercase tracking-tighter hover:bg-accent-main/10 h-full flex items-center transition-colors border-l border-border-main/30"
          >
            設為預設
          </button>
        )}
      </div>
      <button 
        onClick={() => onRemove(featureId, idx)}
        className="p-2 text-text-dim hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

interface SortableFeatureProps {
  feature: AWPFeature;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateOption: (id: string, opt: string) => void;
  key?: React.Key;
}

function SortableFeature({ feature, onToggle, onEdit, onRemove, onUpdateOption }: SortableFeatureProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "flex items-center bg-bg-card border border-border-main p-2 px-4 rounded-md transition-all group",
        !feature.enabled && "opacity-50 grayscale-[0.5]",
        isDragging && "opacity-50 border-accent-main shadow-lg"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="mr-3 text-text-dim hover:text-text-main cursor-grab active:cursor-grabbing p-1"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="mr-4">
        <input 
          type="checkbox"
          checked={feature.enabled}
          onChange={() => onToggle(feature.id)}
          className="w-4 h-4 rounded border-border-main bg-slate-900 text-accent-main focus:ring-accent-main focus:ring-offset-slate-900 cursor-pointer"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-main truncate">{feature.nameEn}</span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onEdit(feature.id)}
              className="text-text-dim hover:text-accent-main transition-colors flex-shrink-0 p-1"
            >
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
            <button
              key={`${feature.id}-opt-${idx}`}
              onClick={() => onUpdateOption(feature.id, opt)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold transition-all uppercase tracking-wider whitespace-nowrap",
                feature.selectedOption === opt
                  ? "bg-accent-main text-slate-900"
                  : "bg-slate-700 text-text-dim hover:text-text-main"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
        <button 
          onClick={() => onRemove(feature.id)}
          className="p-1.5 text-text-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

const CATEGORY_ORDER = [
  'SystemSetup.Configuration',
  'SystemSetup.JackpotSetting',
  'SystemSetup.TimeAdjust',
  'SystemSetup.VolumeSetting',
  'SystemSetup.PasswordSetting',
  'SystemSetup.PerGameName',
  'SystemSetup.PerGameBetList',
  'SystemSetup.PerGameDenomList',
  'Peripheral.BillAcceptorSetting',
  'Peripheral.PrinterSetting',
  'Peripheral.PrinterSetting.VoucherTemplate',
  'Peripheral.MeterSetting'
];

export default function App() {
  const [features, setFeatures] = useState<AWPFeature[]>(DEFAULT_FEATURES);
  const [regionName, setRegionName] = useState('預設地區');
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    const saved = localStorage.getItem('awp_snapshots');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showDenomPanel, setShowDenomPanel] = useState(false);
  
  // AWP Simulator States
  const [balanceCents, setBalanceCents] = useState(50000); // Start with $500.00
  const [lastWinCents, setLastWinCents] = useState(0);
  const [currentBetCredits, setCurrentBetCredits] = useState(5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const [activeVoucher, setActiveVoucher] = useState<{ amount: number, id: string, time: string } | null>(null);
  
  // SBCO States
  const [hasSpun, setHasSpun] = useState(false);
  const [vfdMessage, setVfdMessage] = useState('Insert Bill To Play');
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [isVfdPulsing, setIsVfdPulsing] = useState(true);
  const [showYamlModal, setShowYamlModal] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.7);

  const addNotification = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const sbcoFeature = useMemo(() => features.find(f => f.id === 'SpinBeforeCashout'), [features]);

  // Handle interactions to reset idle timer
  const recordInteraction = () => {
    setLastInteractionTime(Date.now());
  };

  const handlePreviewSpin = () => {
    if (isSpinning) return;
    recordInteraction();

    const betCents = totalBetAmount * 100;
    if (balanceCents < betCents) {
      setVfdMessage('INSUFFICIENT FUNDS');
      return;
    }

    setIsSpinning(true);
    setBalanceCents(prev => prev - betCents);
    setVfdMessage('GOOD LUCK!');
    
    // Simulate spin delay
    setTimeout(() => {
      setHasSpun(true);
      setIsSpinning(false);
      
      // Simple RNG win logic based on Chance Level
      const chanceLevel = features.find(f => f.id === 'ChanceLevel')?.selectedOption || 'Medium';
      const odds: Record<string, number> = { 'Worse': 0.1, 'Bad': 0.2, 'Medium': 0.3, 'Good': 0.4, 'Best': 0.5 };
      const winChance = odds[chanceLevel] || 0.3;
      
      if (Math.random() < winChance) {
        // Random win multiple of bet
        const multiples = [2, 3, 5, 10, 20];
        const multiplier = multiples[Math.floor(Math.random() * multiples.length)];
        const winAmount = betCents * multiplier;
        setBalanceCents(prev => prev + winAmount);
        setLastWinCents(winAmount);
        setVfdMessage(`BIG WIN: ${formatBalance(winAmount)}`);
      } else {
        setLastWinCents(0);
        setVfdMessage('TRY AGAIN');
      }
      
      setTimeout(() => setVfdMessage('INSERT BILL TO PLAY'), 2000);
    }, 1500);
  };

  const handlePreviewCashout = () => {
    recordInteraction();
    const isSbcoEnabled = sbcoFeature?.enabled && sbcoFeature?.selectedOption === 'ON';

    if (isSbcoEnabled && !hasSpun) {
      setVfdMessage('SPIN BEFORE CASHOUT!');
      setIsVfdPulsing(true);
      setTimeout(() => setVfdMessage('PLAY 1 SPIN TO CASH OUT'), 2500);
      return;
    }

    if (balanceCents <= 0) {
      setVfdMessage('NO ZERO BALANCE CASHOUT');
      return;
    }

    // Check Cashout Limit
    const isLimitEnabled = features.find(f => f.id === 'CashoutLimit')?.selectedOption === 'ON';
    const limitAmount = parseCurrency(features.find(f => f.id === 'CashoutLimitAmount')?.selectedOption || '10') * 100;
    
    if (isLimitEnabled && balanceCents > limitAmount) {
      setVfdMessage('LIMIT EXCEEDED: CALL ATTENDANT');
      addNotification('觸發出金上限提示：請呼叫服務人員處理溢出金額。');
      return;
    }
    
    // Check Collect Mode
    const collectMode = features.find(f => f.id === 'CollectMode')?.selectedOption || 'Printer';
    if (collectMode === 'Attendant') {
      setVfdMessage('CALLING ATTENDANT...');
      addNotification('當前為服務員收款模式：已發送人工結帳請求。');
      return;
    }

    setVfdMessage('PRINTING VOUCHER...');
    const amountToCashout = balanceCents;
    setBalanceCents(0);
    setHasSpun(false);
    
    setTimeout(() => {
      setVfdMessage('PLEASE TAKE VOUCHER');
      setActiveVoucher({
        amount: amountToCashout / 100,
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        time: new Date().toLocaleString()
      });
      setTimeout(() => setVfdMessage('INSERT BILL TO PLAY'), 5000);
    }, 2000);
  };

  // Idle reset effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastInteractionTime > 5000 && hasSpun) {
        setHasSpun(false);
        setVfdMessage('IDLE RESET: SPIN AGAIN');
        setTimeout(() => setVfdMessage('INSERT BILL TO PLAY'), 3000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastInteractionTime, hasSpun]);

  const parseCurrency = (val: string): number => {
    if (!val) return 0;
    if (val.includes('¢')) return parseFloat(val) / 100;
    const clean = val.split('~')[0].replace(/[$,]/g, '').trim();
    return parseFloat(clean) || 0;
  };

  const currentDenomValue = useMemo(() => {
    const denomStr = features.find(f => f.id === 'game1_denoms')?.selectedOption || '$1.00';
    return parseCurrency(denomStr);
  }, [features]);

  const credits = useMemo(() => {
    return Math.floor(balanceCents / (currentDenomValue * 100));
  }, [balanceCents, currentDenomValue]);

  const winCredits = useMemo(() => {
    return Math.floor(lastWinCents / (currentDenomValue * 100));
  }, [lastWinCents, currentDenomValue]);

  const displayFormat = useMemo(() => {
    return features.find(f => f.id === 'DisplayFormat')?.selectedOption || 'Dollar';
  }, [features]);

  const formatBalance = (cents: number) => {
    if (displayFormat === 'Credit') {
      return Math.floor(cents / (currentDenomValue * 100)).toLocaleString();
    }
    const symbol = features.find(f => f.id === 'CurrencySymbol')?.selectedOption || '$';
    return `${symbol}${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatRawAmount = (amount: number) => {
    if (displayFormat === 'Credit') {
      return Math.floor(amount / currentDenomValue).toLocaleString();
    }
    const symbol = features.find(f => f.id === 'CurrencySymbol')?.selectedOption || '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalBetAmount = useMemo(() => {
    return currentBetCredits * currentDenomValue;
  }, [currentBetCredits, currentDenomValue]);

  const maxPlayAmount = useMemo(() => {
    const maxPlayStr = features.find(f => f.id === 'MaxPlay')?.selectedOption || '$5.00';
    return parseCurrency(maxPlayStr);
  }, [features]);

  const minPlayAmount = useMemo(() => {
    const minPlayStr = features.find(f => f.id === 'MinPlay')?.selectedOption || '$0.00';
    return parseCurrency(minPlayStr);
  }, [features]);

  const isTiltMismatch = useMemo(() => {
    return minPlayAmount > maxPlayAmount;
  }, [minPlayAmount, maxPlayAmount]);

  useEffect(() => {
    if (!isTiltMismatch && totalBetAmount > maxPlayAmount) {
      // Find the highest valid bet credits
      const bets = [5, 10, 15, 25, 50];
      const validBets = bets.filter(b => b * currentDenomValue <= maxPlayAmount);
      if (validBets.length > 0) {
        setCurrentBetCredits(Math.max(...validBets));
      } else if (bets.length > 0) {
        // Fallback to minimal if none valid (shouldn't happen with standard AWP math)
        setCurrentBetCredits(bets[0]);
      }
    }
  }, [maxPlayAmount, currentDenomValue, totalBetAmount, isTiltMismatch]);

  const minPlayForGrandFeature = useMemo(() => features.find(f => f.id === 'JpMinBetForJp'), [features]);
  
  const minPlayForGrand = useMemo(() => {
    const minPlayStr = minPlayForGrandFeature?.selectedOption || '$0.25';
    return parseCurrency(minPlayStr);
  }, [minPlayForGrandFeature]);

  const isGrandEligible = useMemo(() => {
    if (minPlayForGrandFeature && !minPlayForGrandFeature.enabled) return true;
    return totalBetAmount >= minPlayForGrand;
  }, [totalBetAmount, minPlayForGrand, minPlayForGrandFeature]);

  const grandJackpotDisplayValue = useMemo(() => {
    const grandRangeFeature = features.find(f => f.id === 'JpMinMaxInfo');
    const rangeStr = grandRangeFeature?.selectedOption || '$1000.00 ~ $2000.00';
    const minVal = parseCurrency(rangeStr);
    return formatRawAmount(minVal);
  }, [features, displayFormat, currentDenomValue]);

  const majorJackpotDisplayValue = useMemo(() => {
    const majorRangeFeature = features.find(f => f.id === 'JpMinMaxInfo_Major');
    const rangeStr = majorRangeFeature?.selectedOption || '$500.00 ~ $1500.00';
    const minVal = parseCurrency(rangeStr);
    return formatRawAmount(minVal);
  }, [features, displayFormat, currentDenomValue]);

  const miniJackpotValue = useMemo(() => {
    const value = 1000 * currentDenomValue;
    return formatRawAmount(value);
  }, [currentDenomValue, displayFormat]);

  const minorJackpotValue = useMemo(() => {
    const value = 5000 * currentDenomValue;
    return formatRawAmount(value);
  }, [currentDenomValue, displayFormat]);

  const enabledFeatures = useMemo(() => features.filter(f => f.enabled), [features]);
  const activeFeature = useMemo(() => features.find(f => f.id === editingFeatureId) || null, [features, editingFeatureId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleFeature = (id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const handleUpdateOption = (id: string, option: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, selectedOption: option } : f));
    
    // Feedback for settings changes
    const feature = features.find(f => f.id === id);
    if (feature) {
      addNotification(`已更新設定 [${feature.nameZh}]: ${option}`);
    }
  };

  const handleAddFeature = () => {
    const newId = `feature_${Date.now()}`;
    const newFeature: AWPFeature = {
      id: newId,
      nameEn: 'New Feature',
      nameZh: '新功能項目',
      enabled: true,
      options: ['選項 1'],
      selectedOption: '選項 1',
      type: 'Spinbox',
      description: '請輸入功能描述。',
      legalTip: '請輸入此功能的法規提示。',
      category: 'SystemSetup.Configuration'
    };
    setFeatures(prev => [...prev, newFeature]);
    setEditingFeatureId(newId);
  };

  const handleRemoveFeature = (id: string) => {
    setFeatures(prev => prev.filter(f => f.id !== id));
    if (editingFeatureId === id) setEditingFeatureId(null);
  };

  const updateFeatureField = (id: string, field: keyof AWPFeature, value: any) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const importYaml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = yaml.load(content) as any;
        if (!data || typeof data !== 'object') {
          throw new Error('無效的 YAML 格式');
        }

        const importedFeatures: AWPFeature[] = [];

        // Helper to format values back to UI strings
        const toDisplayValue = (val: any, id: string): string => {
          if (val === true || val === 'true') return 'ON';
          if (val === false || val === 'false') return 'OFF';
          
          const cashRelatedIds = [
            'MaxPlay', 'MinPlay', 'CashInUnit', 'MeterRate', 'CoinInUnit', 'PulseBillInUnit', 
            'KeyInOutMode', 'KeyInUnit', 'TotalInMeterRate', 'TotalOutMeterRate', 
            'TotalPlayMeterRate', 'TotalWinMeterRate', 'CashOutUnit', 'CashoutLimitAmount', 
            'CreditDenom', 'HandCountAmount', 'AwardLimitAmount', 'BalanceLimitAmount', 
            'JpMinMaxInfo', 'JpMinMaxInfo_Major', 'JpMinMaxInfo_Minor', 'JpMinBetForJp', 'GrandJpInitValue', 'MajorJpInitValue', 'MinorJpInitValue'
          ];
          
          if (cashRelatedIds.includes(id) || id.includes('denoms') || id.includes('bets')) {
            if (typeof val === 'number') {
              // Bets and Denoms are in cents but usually displayed as just numbers or $
              if (id.includes('bets') || id.includes('denoms')) return String(val);
              return (val / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            }
            if (typeof val === 'string' && val.includes('~')) {
              return val.split('~').map(v => toDisplayValue(v.trim().includes('$') ? v.trim() : Number(v.trim()), id)).join(' ~ ');
            }
          }
          
          return String(val);
        };

        const processEntryList = (section: any, category: string) => {
          if (!section.EntryList) return;
          
          const entryOrder = [...(section.EntryOrder || []), ...(section.EntryOrderLeft || []), ...(section.EntryOrderRight || [])];
          const allIds = Object.keys(section.EntryList);
          const orderedIds = [...new Set([...entryOrder, ...allIds])];

          orderedIds.forEach(id => {
            if (!section.EntryList[id]) return;
            const item = section.EntryList[id];
            
            // Try to find existing feature to preserve info
            const existing = features.find(f => f.id === id) || DEFAULT_FEATURES.find(f => f.id === id);
            
            const feature: AWPFeature = {
              id,
              nameEn: existing?.nameEn || id.replace(/([A-Z])/g, ' $1').trim(),
              nameZh: existing?.nameZh || id,
              enabled: true,
              type: (item.type as any) || (existing?.type) || 'Label',
              options: Array.isArray(item.value_list) 
                ? item.value_list.map((v: any) => toDisplayValue(v, id)) 
                : (item.type === 'Switch' || existing?.type === 'Switch' ? ['OFF', 'ON'] : (existing?.options || [])),
              selectedOption: toDisplayValue(item.default !== undefined ? item.default : existing?.selectedOption, id),
              description: existing?.description || '從 YAML 匯入的功能項目。',
              legalTip: existing?.legalTip || '自動解析之法規參考。',
              category: category
            };
            
            importedFeatures.push(feature);
          });
        };

        // Deep traversal
        const traverse = (obj: any, path: string[] = []) => {
          if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
          
          const currentPath = path.join('.');
          
          // Check for EntryList sections
          if (obj.EntryList) {
            processEntryList(obj, currentPath);
          } 
          
          // Check for flat sections like PerGameName
          const flatSections = ['SystemSetup.PerGameName', 'SystemSetup.PerGameBetList', 'SystemSetup.PerGameDenomList'];
          if (flatSections.includes(currentPath)) {
             Object.entries(obj).forEach(([key, val]) => {
                if (typeof val !== 'object' || Array.isArray(val)) {
                  const suffixMap: Record<string, string> = { 'PerGameName': 'name', 'PerGameBetList': 'bets', 'PerGameDenomList': 'denoms' };
                  const suffix = suffixMap[currentPath.split('.').pop()!];
                  const featureId = `${key}_${suffix}`;
                  
                  const existing = features.find(f => f.id === featureId) || DEFAULT_FEATURES.find(f => f.id === featureId);
                  
                  importedFeatures.push({
                    id: featureId,
                    nameEn: existing?.nameEn || featureId,
                    nameZh: existing?.nameZh || featureId,
                    enabled: true,
                    type: existing?.type || (Array.isArray(val) ? 'Combobox' : 'Textfield'),
                    options: Array.isArray(val) ? (val as any[]).map(v => String(v)) : [String(val)],
                    selectedOption: Array.isArray(val) ? String(val[0]) : String(val),
                    description: existing?.description || '已自動解讀 YAML 結構之遊戲配置。',
                    legalTip: existing?.legalTip || '',
                    category: currentPath
                  });
                }
             });
          }

          // Recursive call for sub-keys
          Object.entries(obj).forEach(([key, val]) => {
            if (key !== 'EntryList' && !key.startsWith('EntryOrder') && key !== 'EntryOrderLeft' && key !== 'EntryOrderRight') {
              traverse(val, [...path, key]);
            }
          });
        };

        traverse(data);

        // CurrentEnableGame special handling
        if (data.SystemSetup?.CurrentEnableGame !== undefined) {
           const existing = features.find(f => f.id === 'CurrentEnableGame') || DEFAULT_FEATURES.find(f => f.id === 'CurrentEnableGame');
           if (existing) {
             importedFeatures.push({
               ...existing,
               selectedOption: String(data.SystemSetup.CurrentEnableGame),
               category: 'SystemSetup.Configuration'
             });
           }
        }

        // Deduplicate and fallback to default features for missing ones if desired?
        // Actually, user wants YAML to DRIVE the list.
        const finalFeatures = importedFeatures.reduce((acc: AWPFeature[], curr) => {
          if (!acc.find(f => f.id === curr.id)) acc.push(curr);
          return acc;
        }, []);

        if (finalFeatures.length === 0) {
          throw new Error('YAML 中未找到任何有效的配置項目 (EntryList)');
        }

        setFeatures(finalFeatures);
        alert(`匯入成功！共導入 ${finalFeatures.length} 個配置項目。`);
      } catch (err) {
        console.error(err);
        alert('YAML 匯入失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const generateAiSpec = async (feature: AWPFeature) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      alert('請先在設定中配置 GEMINI_API_KEY。');
      return;
    }

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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = response.text || "";
      
      // Extract JSON from potentially markdown-fenced text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[0]);
        updateFeatureField(feature.id, 'description', aiData.description);
        updateFeatureField(feature.id, 'legalTip', aiData.legalTip);
        updateFeatureField(feature.id, 'markdownSpec', aiData.markdownSpec);
        updateFeatureField(feature.id, 'aiPrompt', prompt);
        
        // Simulate schematic generation
        setIsImageGenerating(true);
        setTimeout(() => {
          updateFeatureField(feature.id, 'schematicUrl', `https://picsum.photos/seed/${feature.id}/800/600?grayscale`);
          setIsImageGenerating(false);
        }, 1200);
      }
    } catch (error) {
      console.error('AI Generation failed:', error);
      alert('AI 產出失敗，請檢查網路連線或 API Key。');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAddOption = (featureId: string) => {
    setFeatures(prev => prev.map(f => {
      if (f.id === featureId) {
        const newOption = `選項 ${f.options.length + 1}`;
        return { ...f, options: [...f.options, newOption] };
      }
      return f;
    }));
  };

  const handleRemoveOption = (featureId: string, optionIndex: number) => {
    setFeatures(prev => prev.map(f => {
      if (f.id === featureId) {
        const newOptions = f.options.filter((_, i) => i !== optionIndex);
        let newSelected = f.selectedOption;
        if (!newOptions.includes(f.selectedOption)) {
          newSelected = newOptions[0] || '';
        }
        return { ...f, options: newOptions, selectedOption: newSelected };
      }
      return f;
    }));
  };

  const handleEditOptionText = (featureId: string, index: number, newText: string) => {
    setFeatures(prev => prev.map(f => {
      if (f.id === featureId) {
        const newOptions = [...f.options];
        const oldText = newOptions[index];
        newOptions[index] = newText;
        let newSelected = f.selectedOption;
        if (f.selectedOption === oldText) {
          newSelected = newText;
        }
        return { ...f, options: newOptions, selectedOption: newSelected };
      }
      return f;
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    if (editingFeatureId) {
      setFeatures(prev => prev.map(f => {
        if (f.id === editingFeatureId) {
          const oldIndex = parseInt((active.id as string).split('-')[1]);
          const newIndex = parseInt((over.id as string).split('-')[1]);
          return { ...f, options: arrayMove(f.options, oldIndex, newIndex) };
        }
        return f;
      }));
    } else {
      const activeId = active.id as string;
      const overId = over.id as string;
      
      const oldIndex = features.findIndex(f => f.id === activeId);
      const newIndex = features.findIndex(f => f.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // If they are in the same category, just move them
        if (features[oldIndex].category === features[newIndex].category) {
          setFeatures(prev => arrayMove(prev, oldIndex, newIndex));
        } else {
          // If moved to a different category, update the category of the dragged item
          const updatedFeatures = [...features];
          const item = { ...updatedFeatures[oldIndex], category: updatedFeatures[newIndex].category };
          updatedFeatures.splice(oldIndex, 1);
          updatedFeatures.splice(newIndex, 0, item);
          setFeatures(updatedFeatures);
        }
      }
    }
  };

  const saveSnapshot = () => {
    const newSnapshot: Snapshot = {
      id: `snap_${Date.now()}`,
      name: `${regionName} 配置存檔`,
      timestamp: new Date().toLocaleString(),
      regionName,
      features: JSON.parse(JSON.stringify(features))
    };
    const updated = [newSnapshot, ...snapshots];
    setSnapshots(updated);
    localStorage.setItem('awp_snapshots', JSON.stringify(updated));
  };

  const loadSnapshot = (snap: Snapshot) => {
    setFeatures(JSON.parse(JSON.stringify(snap.features)));
    setRegionName(snap.regionName);
    setShowSnapshots(false);
  };

  const deleteSnapshot = (id: string) => {
    const updated = snapshots.filter(s => s.id !== id);
    setSnapshots(updated);
    localStorage.setItem('awp_snapshots', JSON.stringify(updated));
  };

  const exportJson = () => {
    const data = {
      version: "4.2.0",
      metadata: {
        exportedAt: new Date().toISOString(),
        appName: "AWP 配置產生器",
        environment: "生產環境"
      },
      regionName,
      features,
      snapshots // Include history in the export as a full backup
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `awp_config_full_${regionName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Comprehensive check for config data
        const featuresToLoad = data.features || (data.config && data.config.features);
        const regionToLoad = data.regionName || (data.config && data.config.regionName);
        
        if (featuresToLoad && Array.isArray(featuresToLoad)) {
          setFeatures(featuresToLoad);
          if (regionToLoad) setRegionName(regionToLoad);
          
          // Optionally load snapshots if present in the backup
          if (data.snapshots && Array.isArray(data.snapshots)) {
            setSnapshots(data.snapshots);
            localStorage.setItem('awp_snapshots', JSON.stringify(data.snapshots));
          }

          alert('成功載入配置項目！已恢復所有功能設定與清單順序。');
        } else {
          alert('JSON 格式錯誤：無法找到有效的功能數據。');
        }
      } catch (err) {
        alert('解析 JSON 檔案失敗，請確保這是正確的 AWP 備份檔案。');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const toEnglishValue = (val: string) => {
    const mapping: Record<string, string> = {
      '開啟': 'true',
      '關閉': 'false',
      'ON': 'true',
      'OFF': 'false',
      '簡單': 'Easy',
      '中等': 'Medium',
      '困難': 'Hard',
      '低': 'Low',
      '標準': 'Standard',
      '高': 'High',
      '票據': 'Ticket',
      '人工派彩': 'Handpay',
      '卡片': 'Card',
      '全部': 'All',
      '英文': 'English',
      '西班牙文': 'Spanish',
      '中英雙語': 'Bilingual',
      '30 分鐘': '30 Minutes',
      '60 分鐘': '60 Minutes',
      '本地': 'Local',
      '廣域': 'Wide Area',
      '無限制': 'Unlimited',
      '無': 'None'
    };
    return mapping[val] || val;
  };

  const parseToCents = (val: string): string => {
    if (typeof val !== 'string') return String(val);
    const cleaned = val.trim();

    // Preserve ranges but convert both sides to cents
    if (cleaned.includes('~')) {
      return cleaned.split('~').map(p => parseToCents(p)).join('~');
    }

    if (cleaned.includes('$')) {
      const numericPart = cleaned.replace(/[$,\s]/g, '');
      if (numericPart === '') return cleaned; // It's just the symbol, return as is
      const num = parseFloat(numericPart);
      return isNaN(num) ? cleaned : String(Math.round(num * 100));
    }
    if (cleaned.includes('¢')) {
      return cleaned.replace(/[¢\s]/g, '');
    }
    return toEnglishValue(cleaned);
  };

  const getYamlVal = (id: string, field: 'default' | 'value_list' | 'type') => {
    const feature = features.find(f => f.id === id);
    if (!feature) {
      if (field === 'default') return '0';
      if (field === 'type') return 'Label';
      return '[]';
    }

    if (field === 'type') return feature.type;

    if (id.startsWith('JpMinMaxInfo')) {
      if (field === 'default') {
        return parseToCents(feature.selectedOption);
      }
      return feature.options.map(opt => `\n          - ${parseToCents(opt)}`).join('');
    }

    if (field === 'default') {
      const val = parseToCents(feature.selectedOption);
      return (isNaN(Number(val)) || val === '') && !['true', 'false'].includes(val) ? `"${val}"` : val;
    }
    
    return `[${feature.options.map(opt => {
      const val = parseToCents(opt);
      return (isNaN(Number(val)) || val === '') && !['true', 'false'].includes(val) ? `"${val}"` : val;
    }).join(', ')}]`;
  };

  const generateMachineYaml = () => {
    const currentEnableGameSub = features.find(f => f.id === 'CurrentEnableGame');
    const currentEnableGame = currentEnableGameSub ? parseInt(currentEnableGameSub.selectedOption) : 5;

    const generatePerGameSection = (key: string, featureSuffix: string, isList: boolean) => {
      let section = `    ${key}:\n`;
      for (let i = 1; i <= currentEnableGame; i++) {
        const feature = features.find(f => f.id === `game${i}_${featureSuffix}`);
        if (feature) {
          if (isList) {
            const listStr = `[${feature.options.map(opt => {
              const val = parseToCents(opt);
              return (isNaN(Number(val)) || val === '') && !['true', 'false'].includes(val) ? `"${val}"` : val;
            }).join(', ')}]`;
            section += `      game${i}: ${listStr}\n`;
          } else {
            const val = feature.selectedOption;
            section += `      game${i}: "${val}"\n`;
          }
        }
      }
      return section;
    };

    const getFeatureYamlBlock = (f: AWPFeature, indent: string = '      ') => {
      let block = `${indent}${f.id}:\n`;
      block += `${indent}  display_name: "i18n:${f.category}.${f.id}"\n`;
      block += `${indent}  type: ${f.type}\n`;
      
      const defaultVal = parseToCents(f.selectedOption);
      const formattedDefault = (isNaN(Number(defaultVal)) || defaultVal === '') && !['true', 'false'].includes(defaultVal) ? `"${defaultVal}"` : defaultVal;
      block += `${indent}  default: ${formattedDefault}\n`;

      if (f.options && f.options.length > 0) {
        if (f.id.startsWith('JpMinMaxInfo')) {
          block += `${indent}  value_list:${f.options.map(opt => `\n${indent}    - ${parseToCents(opt)}`).join('')}\n`;
        } else {
          const listStr = `[${f.options.map(opt => {
            const val = parseToCents(opt);
            return (isNaN(Number(val)) || val === '') && !['true', 'false'].includes(val) ? `"${val}"` : val;
          }).join(', ')}]`;
          block += `${indent}  value_list: ${listStr}\n`;
        }
      }
      
      // Special fields for specific items to maintain original structure
      if (f.id === 'CoinInEnable' || f.id === 'SeparateMeterRate') {
        // These already have default in core block
      }
      if (['TotalInMeterRate', 'TotalOutMeterRate', 'TotalPlayMeterRate', 'TotalWinMeterRate'].includes(f.id)) {
        block += `${indent}  depends_on: SeparateMeterRate\n`;
      }
      if (f.id === 'CashoutLimitAmount') {
        block += `${indent}  min_value: 100\n`;
        block += `${indent}  max_value: 100000\n`;
        block += `${indent}  min_precision: 2\n`;
        block += `${indent}  depends_on: CashoutLimit\n`;
      }
      if (f.id === 'PlayScore') block += `${indent}  depends_on: ScoreBox\n`;
      if (f.id === 'HandCountAmount') block += `${indent}  depends_on: HandCount\n`;
      if (f.id === 'ChanceLevel') block += `${indent}  hidden_index: 2\n`;
      
      if (['MaxPlay', 'MinPlay', 'CashInUnit', 'MeterRate', 'CoinInUnit', 'PulseBillInUnit', 'KeyInOutMode', 'KeyInUnit', 'TotalInMeterRate', 'TotalOutMeterRate', 'TotalPlayMeterRate', 'TotalWinMeterRate', 'CashOutUnit', 'CashoutLimitAmount', 'CreditDenom', 'HandCountAmount', 'AwardLimitAmount', 'BalanceLimitAmount', 'JpMinMaxInfo', 'JpMinBetForJp', 'GrandJpInitValue', 'MajorJpInitValue', 'MinorJpInitValue'].includes(f.id)) {
        block += `${indent}  cash_related: true\n`;
      }

      return block;
    };

    const categories = [
      'SystemSetup.Configuration',
      'SystemSetup.JackpotSetting',
      'SystemSetup.TimeAdjust',
      'SystemSetup.VolumeSetting',
      'SystemSetup.PasswordSetting',
      'Peripheral.BillAcceptorSetting',
      'Peripheral.PrinterSetting',
      'Peripheral.MeterSetting'
    ];

    let yaml = `# ==========================================
# AllSettings_Integrated.yaml
# 整合所有設定頁 YAML，依功能分區清楚標示
#
# 結構：
#   SystemSetup:
#     Configuration
#     JackpotSetting
#     TimeAdjust
#     VolumeSetting
#     PasswordSetting
#   Peripheral:
#     BillAcceptorSetting
#     PrinterSetting
#       VoucherTemplate (SubPage)
#     MeterSetting
# ==========================================

`;

    // SystemSetup
    yaml += `SystemSetup:\n`;
    
    // Configuration
    const configFeatures = features.filter(f => f.category === 'SystemSetup.Configuration' && f.id !== 'CurrentEnableGame');
    yaml += `  Configuration:\n`;
    yaml += `    # 本次新增設定，暫時不使用，放在左邊列表最下方\n`;
    yaml += `    EntryOrderLeft:\n`;
    configFeatures.slice(0, 12).forEach(f => {
      yaml += `      - ${f.id}\n`;
    });
    yaml += `    EntryOrderRight:\n`;
    configFeatures.slice(12, 24).forEach(f => {
      yaml += `      - ${f.id}\n`;
    });
    yaml += `    EntryList:\n`;
    configFeatures.forEach(f => {
      yaml += getFeatureYamlBlock(f);
    });

    // JackpotSetting
    const jpFeatures = features.filter(f => f.category === 'SystemSetup.JackpotSetting');
    yaml += `\n  # ==========================================\n  # [SystemSetup] JackpotSetting\n  # ==========================================\n`;
    yaml += `  JackpotSetting:\n`;
    yaml += `    EntryOrder:\n`;
    jpFeatures.forEach(f => {
      yaml += `      - ${f.id}\n`;
    });
    yaml += `    EntryList:\n`;
    jpFeatures.forEach(f => {
      yaml += getFeatureYamlBlock(f);
    });

    // TimeAdjust
    const timeFeatures = features.filter(f => f.category === 'SystemSetup.TimeAdjust');
    yaml += `\n  # ==========================================\n  # [SystemSetup] TimeAdjust\n  # ==========================================\n`;
    yaml += `  TimeAdjust:\n`;
    yaml += `    EntryList:\n`;
    timeFeatures.forEach(f => {
      yaml += getFeatureYamlBlock(f);
    });

    // VolumeSetting
    const volFeatures = features.filter(f => f.category === 'SystemSetup.VolumeSetting');
    yaml += `\n  # ==========================================\n  # [SystemSetup] VolumeSetting\n  # ==========================================\n`;
    yaml += `  VolumeSetting:\n`;
    yaml += `    EntryList:\n`;
    volFeatures.forEach(f => {
      yaml += getFeatureYamlBlock(f);
    });

    // PasswordSetting
    const passFeatures = features.filter(f => f.category === 'SystemSetup.PasswordSetting');
    yaml += `\n  # ==========================================\n  # [SystemSetup] PasswordSetting\n  # ==========================================\n`;
    yaml += `  PasswordSetting:\n`;
    yaml += `    EntryList:\n`;
    passFeatures.forEach(f => {
      yaml += getFeatureYamlBlock(f);
    });

    // Special items
    yaml += `\n  # ==========================================\n  # [SystemSetup] CurrentEnableGame\n  # ==========================================\n`;
    yaml += `  CurrentEnableGame: ${currentEnableGame}\n`;
    yaml += `\n  # ==========================================\n  # [SystemSetup] PerGameName\n  # ==========================================\n`;
    yaml += `  PerGameName:\n${generatePerGameSection('PerGameName', 'name', false)}`;
    yaml += `\n  # ==========================================\n  # [SystemSetup] PerGameBetList\n  # ==========================================\n`;
    yaml += `  PerGameBetList:\n${generatePerGameSection('PerGameBetList', 'bets', true)}`;
    yaml += `\n  # ==========================================\n  # [SystemSetup] PerGameDenomList\n  # ==========================================\n`;
    yaml += `  PerGameDenomList:\n${generatePerGameSection('PerGameDenomList', 'denoms', true)}`;

    // Peripheral
    yaml += `\n# ==========================================\n# Peripheral\n# ==========================================\nPeripheral:\n`;
    
    // BillAcceptorSetting
    const billFeatures = features.filter(f => f.category === 'Peripheral.BillAcceptorSetting');
    yaml += `  BillAcceptorSetting:\n`;
    yaml += `    EntryList:\n`;
    billFeatures.forEach(f => {
      yaml += getFeatureYamlBlock(f);
    });

    // PrinterSetting
    const printerFeatures = features.filter(f => f.category === 'Peripheral.PrinterSetting' && !['Location', 'Address1', 'Address2', 'Address3', 'PhoneNumber', 'FaxNumber', 'MachineNumber', 'VoucherMessage1', 'VoucherMessage2', 'AssetNumber'].includes(f.id));
    const voucherFeatures = features.filter(f => f.category === 'Peripheral.PrinterSetting' && ['Location', 'Address1', 'Address2', 'Address3', 'PhoneNumber', 'FaxNumber', 'MachineNumber', 'VoucherMessage1', 'VoucherMessage2', 'AssetNumber'].includes(f.id));
    
    yaml += `\n  # ==========================================\n  # [Peripheral] PrinterSetting\n  # ==========================================\n`;
    yaml += `  PrinterSetting:\n`;
    yaml += `    EntryList:\n`;
    printerFeatures.forEach(f => {
      yaml += getFeatureYamlBlock(f);
    });
    
    yaml += `\n    # ------------------------------------------\n    # [Peripheral > PrinterSetting] VoucherTemplate (SubPage)\n    # ------------------------------------------\n`;
    yaml += `    VoucherTemplate:\n`;
    yaml += `      Title: "i18n:Peripheral.PrinterSetting.VoucherTemplate.Title"\n`;
    yaml += `      EntryOrder:\n`;
    voucherFeatures.forEach(f => {
      yaml += `        - ${f.id}\n`;
    });
    yaml += `      EntryList:\n`;
    voucherFeatures.forEach(f => {
      yaml += getFeatureYamlBlock(f, '        ');
    });

    // MeterSetting
    const meterFeatures = features.filter(f => f.category === 'Peripheral.MeterSetting');
    yaml += `\n  # ==========================================\n  # [Peripheral] MeterSetting\n  # ==========================================\n`;
    yaml += `  MeterSetting:\n`;
    yaml += `    EntryList:\n`;
    meterFeatures.forEach(f => {
      yaml += getFeatureYamlBlock(f);
    });

    return yaml;
  };

  const exportYaml = () => {
    const yamlStr = generateMachineYaml();
    
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `awp_config_${regionName.toLowerCase().replace(/\s+/g, '_')}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-accent-main/30">
      {/* Header */}
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
            <input 
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              className="bg-transparent text-right border-none focus:ring-0 text-accent-main font-medium p-0 h-auto"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={saveSnapshot}
              title="儲存至瀏覽器紀錄"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-accent-main transition-all"
            >
              <Save className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowSnapshots(true)}
              title="讀取歷史紀錄"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-accent-main transition-all"
            >
              <History className="w-4 h-4" />
            </button>
            <div className="h-6 w-[1px] bg-border-main mx-1" />
            
            {/* JSON Save/Load */}
            <button 
              onClick={exportJson}
              title="導出進度為 JSON"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-blue-400 transition-all"
            >
              <FileJson className="w-4 h-4" />
            </button>
            <label 
              title="從 JSON 匯入進度"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-blue-400 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 rotate-180" />
              <input 
                type="file" 
                accept=".json" 
                onChange={importJson} 
                className="hidden" 
              />
            </label>

            <div className="h-6 w-[1px] bg-border-main mx-1" />
            
            {/* YAML Save/Load */}
            <label 
              title="匯入 YAML 配置"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-emerald-400 transition-all cursor-pointer"
            >
              <Code className="w-4 h-4 rotate-180" />
              <input 
                type="file" 
                accept=".yaml,.yml" 
                onChange={importYaml} 
                className="hidden" 
              />
            </label>
            <button 
              onClick={() => setShowYamlModal(true)}
              title="檢視生成的 YAML"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-border-main rounded-md text-text-dim hover:text-accent-main transition-all"
            >
              <Code className="w-4 h-4" />
            </button>
            <button 
              onClick={exportYaml}
              className={cn(
                "px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200",
                isExporting 
                  ? "bg-green-600 text-white" 
                  : "bg-accent-main hover:bg-emerald-400 text-slate-900 shadow-lg shadow-emerald-900/20"
              )}
            >
              {isExporting ? '導出成功！' : '導出 YAML'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(100vh-64px)]">
        {/* Left Panel: Configuration */}
        <section className="p-6 border-r border-border-main overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-text-dim flex items-center gap-2">
              <span>地區特定配置</span>
              <span className="h-3 w-[1px] bg-border-main" />
              <span className="text-accent-main">州別: {regionName}</span>
            </div>
            <button 
              onClick={handleAddFeature}
              className="text-[10px] flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-border-main transition-colors uppercase font-bold tracking-wider"
            >
              <Plus className="w-3 h-3" />
              新增功能
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {CATEGORY_ORDER.map(cat => {
                const catFeatures = features.filter(f => f.category === cat);
                if (catFeatures.length === 0) return null;

                return (
                  <div key={cat} className="mb-6 last:mb-0">
                    <div className="mt-8 mb-3 first:mt-2 flex items-center gap-3 select-none">
                       <div className="h-[1px] w-6 bg-accent-main/30" />
                       <span className="text-[11px] font-black text-accent-main uppercase tracking-[0.2em] whitespace-nowrap">
                         {cat.replace('.', '] ').replace(/^/, '[')}
                       </span>
                       <div className="h-[1px] flex-1 bg-border-main/30" />
                    </div>
                    
                    <SortableContext 
                      items={catFeatures.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-2">
                        {catFeatures.map((feature) => (
                          <SortableFeature 
                            key={feature.id}
                            feature={feature}
                            onToggle={handleToggleFeature}
                            onEdit={setEditingFeatureId}
                            onRemove={handleRemoveFeature}
                            onUpdateOption={handleUpdateOption}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
              
              {/* Items with unknown categories */}
              {(() => {
                const otherFeatures = features.filter(f => !CATEGORY_ORDER.includes(f.category || ''));
                if (otherFeatures.length === 0) return null;
                return (
                  <div className="mb-6">
                    <div className="mt-8 mb-3 flex items-center gap-3 select-none">
                       <div className="h-[1px] w-6 bg-slate-500/30" />
                       <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                         [OTHER] 未分類項目
                       </span>
                       <div className="h-[1px] flex-1 bg-border-main/30" />
                    </div>
                    <SortableContext 
                      items={otherFeatures.map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-2">
                        {otherFeatures.map((feature) => (
                          <SortableFeature 
                            key={feature.id}
                            feature={feature}
                            onToggle={handleToggleFeature}
                            onEdit={setEditingFeatureId}
                            onRemove={handleRemoveFeature}
                            onUpdateOption={handleUpdateOption}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })()}
            </DndContext>
          </div>
        </section>

        {/* Right Panel: Preview */}
        <div className="flex flex-col h-full overflow-hidden bg-bg-deep border-l border-border-main">
          {/* Top: Live Preview (Scaled) */}
          <aside className="flex-1 bg-black p-4 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-full h-10 px-4 flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur absolute top-0 z-30">
              <div className="text-[10px] uppercase font-bold tracking-widest text-text-dim/60 flex items-center gap-2">
                <Monitor className="w-3 h-3" />
                Terminal Live Preview
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-black/40 rounded-full border border-white/10 p-0.5">
                  <button 
                    onClick={() => setPreviewScale(prev => Math.max(0.3, prev - 0.1))}
                    title="縮小"
                    className="p-1 px-2 text-text-dim hover:text-white transition-colors hover:bg-white/5 rounded-full"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-10 text-center text-[10px] font-mono font-bold text-accent-main">
                    {Math.round(previewScale * 100)}%
                  </div>
                  <button 
                    onClick={() => setPreviewScale(prev => Math.min(1.5, prev + 0.1))}
                    title="放大"
                    className="p-1 px-2 text-text-dim hover:text-white transition-colors hover:bg-white/5 rounded-full"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button 
                  onClick={() => setPreviewScale(0.7)}
                  className="text-[9px] font-black text-text-dim hover:text-white uppercase transition-colors px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/5"
                >
                  Reset
                </button>
              </div>
            </div>
            
            <div className="flex-1 w-full overflow-auto custom-scrollbar flex items-center justify-center p-12 mt-10">
              {/* Machine Mockup */}
              <div 
                style={{ transform: `scale(${previewScale})` }}
                className="w-[310px] h-[640px] bg-[#0c0c0c] border-[8px] border-[#1a1a1a] rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.8)] relative flex flex-col transition-transform origin-center"
              >
              {/* Screen Content */}
              <div className="flex-[1.4] m-2 bg-gradient-to-b from-slate-900 via-[#050510] to-black rounded border-2 border-white/5 relative p-3 flex flex-col overflow-hidden">
                {/* Game Logo */}
                <div className="relative mb-2 group cursor-default h-12 flex items-center justify-center">
                  <div className="absolute inset-0 bg-accent-main/20 blur-xl rounded-full opacity-50"></div>
                  <div className="text-xl text-center font-black text-white italic tracking-tighter relative drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] uppercase break-words px-2 leading-tight">
                    <span className="text-accent-main">{features.find(f => f.id === 'game1_name')?.selectedOption?.split(' ')[0] || 'NEON'}</span> <span className="opacity-90">{features.find(f => f.id === 'game1_name')?.selectedOption?.split(' ').slice(1).join(' ') || 'QUEST'}</span>
                  </div>
                </div>

                {/* Jackpot Tiers */}
                <div className="space-y-1 mb-3">
                  {/* Grand - Progressive */}
                  <div className={cn(
                    "relative h-9 rounded border flex flex-col justify-center items-center overflow-hidden transition-all duration-500",
                    isGrandEligible 
                      ? "bg-gradient-to-r from-red-950 to-red-800 border-red-500/50 shadow-[inset_0_0_10px_rgba(255,0,0,0.3)] grayscale-0"
                      : "bg-slate-900 border-white/10 grayscale opacity-60"
                  )}>
                    <div className={cn(
                      "absolute top-0 left-0 px-1 py-0.5 text-[5px] font-black text-white tracking-widest rounded-br-sm border-r border-b transition-colors",
                      isGrandEligible ? "bg-red-600 border-red-400/50" : "bg-slate-700 border-white/10"
                    )}>GRAND</div>
                    
                    {!isGrandEligible && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 backdrop-blur-[1px]">
                        <div className="flex items-center mb-0.5">
                          <Lock className="w-2.5 h-2.5 text-white" />
                          <span className="ml-1 text-[6px] font-black text-white uppercase tracking-tighter">LOCKED</span>
                        </div>
                        <div className="text-[7px] font-black text-white animate-pulse text-center leading-none tracking-tight">
                          BET {formatRawAmount(minPlayForGrand)} TO QUALIFY
                        </div>
                      </div>
                    )}

                    <div className={cn(
                      "text-base font-mono font-bold tracking-wider transition-all",
                      isGrandEligible ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "text-white/20"
                    )}>{grandJackpotDisplayValue}</div>
                    
                    {isGrandEligible && <div className="absolute -right-2 top-0 bottom-0 w-8 bg-white/10 skew-x-[-20deg] animate-pulse"></div>}
                  </div>

                  {/* Major - Progressive */}
                  <div className="relative h-7 bg-gradient-to-r from-emerald-950 to-emerald-800 rounded border border-emerald-500/40 flex flex-col justify-center items-center">
                    <div className="absolute top-0 left-0 px-1 py-0.5 bg-emerald-600 text-[5px] font-black text-white tracking-widest rounded-br-sm border-r border-b border-emerald-400/50">MAJOR</div>
                    <div className="text-xs font-mono font-bold text-emerald-100 tracking-wider transition-all">{majorJackpotDisplayValue}</div>
                  </div>

                  {/* Minor & Mini - Fixed (Scaled by Denom) */}
                  <div className="grid grid-cols-2 gap-1">
                    <div className="relative h-7 bg-gradient-to-r from-blue-950 to-blue-800 rounded border border-blue-500/40 flex flex-col justify-center items-center">
                      <div className="absolute top-0 left-0 px-1 py-0.5 bg-blue-600 text-[5px] font-black text-white tracking-widest rounded-br-sm border-r border-b border-blue-400/50">MINOR</div>
                      <div className="text-[10px] font-mono font-bold text-blue-100 tracking-tight">{minorJackpotValue}</div>
                    </div>
                    <div className="relative h-7 bg-gradient-to-r from-orange-950 to-orange-800 rounded border border-orange-500/40 flex flex-col justify-center items-center">
                      <div className="absolute top-0 left-0 px-1 py-0.5 bg-orange-600 text-[5px] font-black text-white tracking-widest rounded-br-sm border-r border-b border-orange-400/50">MINI</div>
                      <div className="text-[10px] font-mono font-bold text-orange-100 tracking-tight">{miniJackpotValue}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex gap-1.5 justify-center mt-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex-1 max-w-[50px] bg-white/5 rounded border border-white/10 flex flex-col items-center justify-around py-2 shadow-inner">
                      <div className="w-6 h-6 bg-red-600 rounded shadow-[0_0_10px_rgba(220,38,38,0.4)]" />
                      <div className="w-6 h-6 bg-emerald-600 rounded shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                      <div className="w-6 h-6 bg-amber-600 rounded shadow-[0_0_10px_rgba(217,119,6,0.4)]" />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-1">
                  <div className="flex-[1.2] bg-black/80 border border-white/10 text-accent-main font-mono px-1 py-0.5 text-[8px] text-center leading-tight">
                    {displayFormat === 'Credit' ? 'CREDIT' : 'CASH'}<br/>
                    {formatBalance(balanceCents)}
                  </div>
                  <div className="flex-1 bg-black/80 border border-white/10 text-accent-main font-mono px-1 py-0.5 text-[8px] text-center leading-tight">
                    BET<br/>
                    {displayFormat === 'Credit' ? currentBetCredits : formatBalance(totalBetAmount * 100)}
                  </div>
                  <div className="flex-1 bg-black/80 border border-white/10 text-amber-400 font-mono px-1 py-0.5 text-[8px] text-center leading-tight">
                    WIN<br/>
                    {formatBalance(lastWinCents)}
                  </div>
                  <button 
                    onClick={() => setShowDenomPanel(!showDenomPanel)}
                    className="flex-1 bg-black/80 border border-accent-main/30 text-accent-main font-mono px-1 py-0.5 text-[8px] text-center leading-tight hover:border-accent-main transition-colors"
                  >
                    DENOM<br/>{features.find(f => f.id === 'game1_denoms')?.selectedOption || 'N/A'}
                  </button>
                </div>

                {/* Multi-Denom Panel Overlay */}
                <AnimatePresence>
                  {showDenomPanel && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      className="absolute inset-x-2 bottom-12 bg-slate-900/95 backdrop-blur border border-accent-main/30 rounded-lg p-3 z-20 shadow-2xl"
                    >
                      <div className="text-[8px] uppercase font-bold text-accent-main mb-2 tracking-widest text-center border-b border-white/10 pb-1 text-[7px]">Choose Your Denomination</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {features.find(f => f.id === 'game1_denoms')?.options.map((opt, idx) => (
                          <button
                            key={`${opt}-${idx}`}
                            onClick={() => {
                              handleUpdateOption('game1_denoms', opt);
                              setShowDenomPanel(false);
                            }}
                            className={cn(
                              "text-[9px] font-mono py-1 rounded border transition-all",
                              features.find(f => f.id === 'game1_denoms')?.selectedOption === opt
                                ? "bg-accent-main text-slate-900 border-accent-main"
                                : "bg-black/40 text-text-dim border-white/10 hover:border-accent-main/50"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Physical Slots Area */}
              <div className="bg-[#111] px-4 py-2 flex justify-between items-center border-t border-white/5 border-b border-black">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-1 bg-blue-500/40 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-400/20 mb-1" />
                  <span className="text-[5px] text-text-dim uppercase font-bold tracking-tighter">Ticket Out</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-1 bg-blue-500/40 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-400/20 mb-1" />
                  <span className="text-[5px] text-text-dim uppercase font-bold tracking-tighter">Insert Bill / Ticket</span>
                </div>
              </div>

              {/* Physical Button Deck */}
              <div 
                className="bg-[#1a1a1a] p-3 flex flex-col gap-3 relative border-t border-white/10"
                onMouseMove={recordInteraction}
                onClick={recordInteraction}
              >
                {/* Notice Popups */}
                <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center">
                  <AnimatePresence>
                    {notifications.map(n => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 10 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-bg-card/90 backdrop-blur border border-accent-main/50 text-accent-main text-[7px] px-3 py-1 rounded shadow-lg font-bold uppercase tracking-tight mb-1"
                      >
                        {n.message}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Header Row Buttons: Service, Cashout, Lines, Spin */}
                <div className="flex justify-between items-start pt-1 px-1">
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handlePreviewCashout}
                      className={cn(
                        "w-8 h-8 rounded-lg bg-slate-900 border-2 border-slate-700 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all group",
                        (sbcoFeature?.enabled && sbcoFeature?.selectedOption === 'ON' && !hasSpun) && "opacity-80"
                      )}
                    >
                      <span className={cn(
                        "text-[6px] font-black leading-none text-center drop-shadow-[0_0_2px_rgba(244,63,94,0.3)]",
                        (sbcoFeature?.enabled && sbcoFeature?.selectedOption === 'ON' && !hasSpun) ? "text-rose-900" : "text-rose-500"
                      )}>CASH<br/>OUT</span>
                    </button>
                    <button 
                      onClick={() => setBalanceCents(prev => prev + 100)} // Add $1
                      className="w-8 h-8 rounded-lg bg-slate-900 border-2 border-blue-500/50 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all group"
                    >
                      <span className="text-[6px] font-black text-blue-400 leading-none text-center drop-shadow-[0_0_2px_rgba(59,130,246,0.3)] tracking-tighter">
                        ADD<br/>
                        {displayFormat === 'Credit' ? (1 / currentDenomValue).toLocaleString() : '$1.00'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    {[1, 5, 10].map(lines => (
                      <button 
                        key={lines} 
                        onClick={recordInteraction}
                        className={cn(
                        "w-8 h-8 rounded-lg bg-slate-900 border-2 border-slate-700 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all",
                        lines === 5 && "border-blue-500 bg-slate-800"
                      )}>
                        <span className={cn(
                          "text-[6px] font-black leading-none text-center",
                          lines === 5 ? "text-blue-400" : "text-slate-500"
                        )}>PLAY<br/>{lines}<br/>LINES</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handlePreviewSpin}
                    disabled={isSpinning || isTiltMismatch}
                    className={cn(
                      "w-14 h-14 rounded-full bg-emerald-800 border-[3px] border-emerald-500 shadow-[4px_4px_0_rgba(0,0,0,0.4),0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center active:translate-y-1 active:shadow-none transition-all",
                      isSpinning && "animate-pulse brightness-125",
                      isTiltMismatch && "opacity-30 grayscale cursor-not-allowed border-slate-700 bg-slate-900"
                    )}
                  >
                    <span className="text-[10px] font-black text-white italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] tracking-tighter">
                      {isSpinning ? '...' : (isTiltMismatch ? 'ERROR' : 'SPIN')}
                    </span>
                  </button>
                </div>

                {/* Auxiliary Message Display (VFD) */}
                <div className="mx-auto w-[65%] h-6 bg-black border border-white/5 rounded flex items-center justify-center shadow-inner relative overflow-hidden">
                  {/* VFD Message or TILT */}
                  <div className={cn(
                    "text-[7px] font-mono text-center uppercase tracking-widest opacity-80",
                    isTiltMismatch ? "text-red-500 font-black animate-[pulse_0.5s_infinite]" : "text-cyan-400",
                    (isVfdPulsing || isTiltMismatch) && "animate-pulse"
                  )}>
                    {isTiltMismatch ? "TILT: BET CONFIG MISMATCH" : vfdMessage}
                  </div>
                </div>

                {/* Betting Controls Row */}
                <div className="flex justify-center gap-1.5 pb-2">
                  {[5, 10, 15, 25, 50].map(val => {
                    const isDisabled = isTiltMismatch || (val * currentDenomValue > maxPlayAmount);
                    return (
                      <button 
                        key={val} 
                        disabled={isDisabled}
                        onClick={() => {
                          setCurrentBetCredits(val);
                          recordInteraction();
                        }}
                        className={cn(
                          "w-9 h-9 rounded-lg bg-slate-900 border-2 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all",
                          currentBetCredits === val ? "border-accent-main bg-slate-800 ring-2 ring-accent-main/20" : "border-slate-700",
                          isDisabled && "opacity-30 grayscale cursor-not-allowed border-slate-800"
                        )}
                      >
                        <div className="flex flex-col items-center">
                          <span className={cn("text-xs font-black", currentBetCredits === val ? "text-accent-main" : "text-white/80")}>{val}</span>
                          <span className="text-[4px] text-text-dim uppercase font-bold tracking-tighter">Credits</span>
                        </div>
                      </button>
                    );
                  })}
                  <button 
                    disabled={isTiltMismatch}
                    onClick={() => {
                      const bets = [5, 10, 15, 25, 50];
                      const validBets = bets.filter(b => b * currentDenomValue <= maxPlayAmount);
                      if (validBets.length > 0) {
                        setCurrentBetCredits(Math.max(...validBets));
                      }
                      recordInteraction();
                    }}
                    className={cn(
                      "w-9 h-9 rounded-lg bg-slate-900 border-2 border-amber-600 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all",
                      isTiltMismatch && "opacity-30 grayscale cursor-not-allowed"
                    )}
                  >
                    <span className="text-[6px] font-bold text-amber-500 leading-tight text-center uppercase">Max<br/>Bet</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        </div>
      </main>

      {/* YAML Preview Modal */}
      <AnimatePresence>
        {showYamlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowYamlModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-950 border border-border-main rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-bg-card">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-accent-main" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Engine-Ready YAML Configuration</h3>
                </div>
                <button 
                  onClick={() => setShowYamlModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-hidden flex flex-col gap-4">
                <div className="flex items-center justify-between text-[10px] text-text-dim">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-accent-main/10 text-accent-main rounded border border-accent-main/20 font-mono">STATUS: VALIDATED</span>
                    <span className="font-mono">LAST UPDATED: {new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const yamlContent = generateMachineYaml();
                      navigator.clipboard.writeText(yamlContent);
                    }}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Copy className="w-3 h-3" /> 複製代碼
                  </button>
                </div>

                <div className="flex-1 bg-black/80 rounded-lg border border-white/5 p-4 overflow-y-auto custom-scrollbar">
                  <pre className="text-xs font-mono text-emerald-400/90 leading-relaxed">
                    {generateMachineYaml()}
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-bg-card border-t border-white/5 flex justify-end gap-3">
                <button 
                  onClick={() => setShowYamlModal(false)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-bold transition-all"
                >
                  關閉
                </button>
                <button 
                  onClick={exportYaml}
                  className="px-6 py-2 bg-accent-main hover:bg-emerald-400 text-slate-900 rounded-md text-sm font-bold transition-all shadow-lg"
                >
                  下載 .yaml 檔案
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feature Editor Modal */}
      <AnimatePresence>
        {activeFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingFeatureId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-bg-card border border-border-main rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border-main flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-accent-main" />
                  編輯功能設定
                </h3>
                <button 
                  onClick={() => setEditingFeatureId(null)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">功能所屬分類 (將影響 YAML 區塊)</label>
                  <select 
                    value={activeFeature.category || 'SystemSetup.Configuration'}
                    onChange={(e) => updateFeatureField(activeFeature.id, 'category', e.target.value)}
                    className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none text-text-main"
                  >
                    {CATEGORY_ORDER.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Template Selector */}
                <div className="bg-slate-900/50 border border-border-main rounded-lg p-3 space-y-2">
                  <label className="text-[10px] uppercase text-accent-main font-bold tracking-wider flex items-center gap-2">
                    <Settings className="w-3 h-3" />
                    套用功能模板 (快速帶入初始設定)
                  </label>
                  <select 
                    onChange={(e) => {
                      const templateId = e.target.value;
                      if (!templateId) return;
                      const template = DEFAULT_FEATURES.find(f => f.id === templateId);
                      if (template) {
                        setFeatures(prev => prev.map(f => f.id === activeFeature.id ? { 
                          ...f, 
                          nameEn: template.nameEn,
                          nameZh: template.nameZh,
                          options: [...template.options],
                          selectedOption: template.selectedOption,
                          description: template.description,
                          legalTip: template.legalTip,
                          type: template.type
                        } : f));
                      }
                      e.target.value = ''; // Reset
                    }}
                    className="w-full bg-slate-800 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none text-text-main"
                  >
                    <option value="">選擇模板...</option>
                    {DEFAULT_FEATURES.map(f => (
                      <option key={f.id} value={f.id}>{f.nameEn} ({f.nameZh})</option>
                    ))}
                  </select>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 overflow-hidden">
                    <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">功能名稱 (中文)</label>
                    <input 
                      value={activeFeature.nameZh}
                      onChange={(e) => updateFeatureField(activeFeature.id, 'nameZh', e.target.value)}
                      className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 overflow-hidden">
                    <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">Feature Name (English)</label>
                    <input 
                      value={activeFeature.nameEn}
                      onChange={(e) => updateFeatureField(activeFeature.id, 'nameEn', e.target.value)}
                      className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider flex items-center gap-2">
                        描述
                        <span className="text-[8px] bg-slate-800 px-1 rounded text-text-dim/50 font-normal italic"># 企劃規格說明</span>
                      </label>
                      <button 
                        onClick={() => generateAiSpec(activeFeature)}
                        disabled={isAiGenerating}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                          isAiGenerating 
                            ? "bg-slate-800 text-text-dim cursor-not-allowed" 
                            : "bg-accent-main/10 text-accent-main hover:bg-accent-main hover:text-slate-900 border border-accent-main/20"
                        )}
                      >
                        {isAiGenerating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {isAiGenerating ? "AI 規格產出中..." : "AI 產出規格"}
                      </button>
                    </div>
                    <textarea 
                      value={activeFeature.description}
                      onChange={(e) => updateFeatureField(activeFeature.id, 'description', e.target.value)}
                      rows={3}
                      placeholder="點擊「AI 產出規格」按鈕由 AI 自動編寫詳細說明..."
                      className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none resize-none min-h-[60px] leading-relaxed"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider flex items-center gap-2">
                      法規提示 / 風險資訊
                      <span className="text-[8px] bg-slate-800 px-1 rounded text-text-dim/50 font-normal italic"># 法律與認證合規參考</span>
                    </label>
                    <textarea 
                      value={activeFeature.legalTip}
                      onChange={(e) => updateFeatureField(activeFeature.id, 'legalTip', e.target.value)}
                      rows={2}
                      placeholder="自動根據功能類別產出合規建議..."
                      className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none resize-none text-amber-200/80 italic leading-relaxed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">YAML 分類 (影響排列位置)</label>
                    <select 
                      value={activeFeature.category}
                      onChange={(e) => updateFeatureField(activeFeature.id, 'category', e.target.value)}
                      className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none"
                    >
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
                    <select 
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        
                        const presets: Record<string, { type: any, options: string[] }> = {
                          'switch': { type: 'Switch', options: ['OFF', 'ON'] },
                          'combobox_offon': { type: 'Combobox', options: ['OFF', 'ON'] },
                          'combobox_cents': { type: 'Combobox', options: ['$0.01', '$0.02', '$0.05', '$0.10', '$0.20', '$0.25', '$0.50', '$1.00', '$2.00', '$5.00', '$10.00'] },
                          'combobox_dollars': { type: 'Combobox', options: ['$1.00', '$5.00', '$10.00', '$50.00', '$100.00', '$500.00', '$1000.00'] },
                          'combobox_chance': { type: 'Combobox', options: ['Worse', 'Bad', 'Medium', 'Good', 'Best'] },
                          'combobox_jackpot': { type: 'Combobox', options: ['$500.00 ~ $1200.00', '$1000.00 ~ $2500.00', '$1250.00 ~ $3500.00', '$1250.00 ~ $5000.00', '$2500.00 ~ $6250.00', '$3000.00 ~ $7500.00', '$4000.00 ~ $10000.00'] },
                          'combobox_display': { type: 'Combobox', options: ['Dollar', 'Credit'] },
                          'combobox_empty': { type: 'Combobox', options: [] },
                          'spinbox': { type: 'Spinbox', options: [] },
                          'textfield': { type: 'Textfield', options: [] },
                          'numberfield': { type: 'Numberfield', options: [] },
                          'numberpad': { type: 'Numberpad', options: [] },
                          'label': { type: 'Label', options: [] }
                        };

                        const selected = presets[val];
                        if (selected) {
                          setFeatures(prev => prev.map(f => f.id === activeFeature.id ? { 
                            ...f, 
                            type: selected.type,
                            options: selected.options.length > 0 ? selected.options : f.options,
                            selectedOption: selected.options.length > 0 ? selected.options[0] : f.selectedOption
                          } : f));
                        }
                      }}
                      className="w-full bg-slate-900 border border-border-main rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-accent-main outline-none text-accent-main font-bold"
                    >
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
                       <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-accent-main font-bold border border-accent-main/20">{activeFeature.type}</span>
                    </div>
                  </div>
                </div>

                {/* Options Management */}
                <div className="space-y-3 pb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider">配置選項列表 (可拖拽排序)</label>
                    <button 
                      onClick={() => handleAddOption(activeFeature.id)}
                      className="text-[10px] flex items-center gap-1 text-accent-main hover:text-emerald-400 font-bold uppercase"
                    >
                      <Plus className="w-3 h-3" /> 新增選項
                    </button>
                  </div>
                  
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={activeFeature.options.map((_, idx) => `opt-${idx}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {activeFeature.options.map((opt, idx) => (
                          <SortableOption 
                            key={`opt-${idx}`}
                            id={`opt-${idx}`}
                            opt={opt}
                            idx={idx}
                            featureId={activeFeature.id}
                            selectedOption={activeFeature.selectedOption}
                            onEdit={handleEditOptionText}
                            onRemove={handleRemoveOption}
                            onSelect={handleUpdateOption}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>

                <div className="space-y-6 pt-4 border-t border-white/5">
                  {/* Software Specification Section */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider flex items-center gap-2">
                       軟體研發技術規格 (Markdown)
                       <span className="text-[8px] bg-slate-800 px-1 rounded text-text-dim/50 font-normal italic"># 給開發團隊的邏輯定義</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Side: AI Schematic Display */}
                      <div className="space-y-2">
                        <div className="text-[9px] text-text-dim uppercase font-bold flex items-center gap-1.5 opacity-50">
                          <Sparkles className="w-3 h-3" /> AI Schematic (示意圖)
                        </div>
                        <div className="w-full aspect-square bg-slate-900 border border-border-main rounded-md overflow-hidden relative group">
                          {activeFeature.schematicUrl ? (
                            <>
                              <img 
                                src={activeFeature.schematicUrl} 
                                alt={`${activeFeature.nameEn} Schematic`}
                                className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:opacity-100 transition-opacity duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                <div className="p-3 bg-accent-main/20 rounded-full mb-3 backdrop-blur-sm border border-accent-main/30 group-hover:scale-110 transition-transform">
                                  <Terminal className="w-6 h-6 text-accent-main" />
                                </div>
                                <div className="text-[10px] font-black text-accent-main uppercase tracking-widest mb-1 drop-shadow-lg">{activeFeature.id}</div>
                                <div className="text-[14px] font-bold text-white uppercase tracking-tight leading-tight px-4">{activeFeature.nameZh}</div>
                                <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <div className="h-[1px] w-4 bg-accent-main" />
                                   <span className="text-[8px] font-mono text-accent-main">TECHNICAL SCHEMATIC v1.0</span>
                                   <div className="h-[1px] w-4 bg-accent-main" />
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => generateAiSpec(activeFeature)}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="重新產出規格與示意圖"
                              >
                                <History className="w-3.5 h-3.5 text-accent-main" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/50">
                              <div className="w-12 h-12 rounded-full border-2 border-dashed border-border-main flex items-center justify-center mb-3">
                                <Monitor className="w-6 h-6 text-text-dim/30" />
                              </div>
                              <p className="text-[10px] text-text-dim/50 font-medium">點擊上方「AI 產出規格」生成示意圖</p>
                            </div>
                          )}
                          
                          {isImageGenerating && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                              <Loader2 className="w-8 h-8 text-accent-main animate-spin mb-3" />
                              <p className="text-[10px] text-accent-main font-black uppercase tracking-widest animate-pulse">繪製技術示意圖中...</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Markdown Preview */}
                      <div className="space-y-2">
                        <div className="text-[9px] text-text-dim uppercase font-bold flex items-center gap-1.5 opacity-50">
                          <Terminal className="w-3 h-3" /> Preview (Markdown Render)
                        </div>
                        <div className="w-full bg-slate-950/50 border border-border-main border-dashed rounded-md px-4 py-3 text-sm min-h-[150px] max-h-[310px] md:max-h-none h-[calc(100%-24px)] overflow-y-auto custom-scrollbar leading-relaxed">
                          {!activeFeature.markdownSpec ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-dim/30 py-12">
                              <FileText className="w-8 h-8 mb-2" />
                              <p className="text-[10px] italic">尚未產出技術規格</p>
                            </div>
                          ) : (
                            <article className="prose prose-invert prose-xs max-w-none prose-headings:text-accent-main prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-headings:border-b prose-headings:border-white/5 prose-headings:pb-1 prose-p:text-text-dim prose-li:text-text-dim prose-strong:text-white prose-code:text-accent-main prose-code:bg-accent-main/10 prose-code:px-1 prose-code:rounded">
                              <ReactMarkdown>{activeFeature.markdownSpec}</ReactMarkdown>
                            </article>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Prompt Display (Sticky Note Style) */}
                  {activeFeature.aiPrompt && (
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase text-text-dim font-bold tracking-wider flex items-center gap-2">
                         最後一次 AI 提詞內容
                         <span className="text-[8px] bg-slate-800 px-1 rounded text-text-dim/50 font-normal italic"># Prompt Registry</span>
                       </label>
                       <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-3 relative group">
                          <div className="absolute top-2 right-2 flex items-center gap-2">
                            <span className="text-[8px] text-amber-500/50 font-mono">GENERATE_SPEC_v2.1</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(activeFeature.aiPrompt || '');
                                alert('AI 提詞已複製！');
                              }}
                              className="p-1 hover:bg-amber-500/10 rounded transition-colors"
                            >
                              <Copy className="w-3 h-3 text-amber-500/50 hover:text-amber-500" />
                            </button>
                          </div>
                          <pre className="text-[10px] font-mono text-amber-500/70 whitespace-pre-wrap leading-tight max-h-[100px] overflow-y-auto custom-scrollbar">
                            {activeFeature.aiPrompt}
                          </pre>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-900/50 border-t border-border-main flex justify-end">
                <button 
                  onClick={() => setEditingFeatureId(null)}
                  className="px-6 py-2 bg-accent-main hover:bg-emerald-400 text-slate-900 rounded-md text-sm font-bold transition-colors"
                >
                  儲存並關閉
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Snapshots Modal */}
      <AnimatePresence>
        {showSnapshots && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSnapshots(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-bg-card border border-border-main rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-border-main flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-accent-main" />
                  配置歷史紀錄
                </h3>
                <button 
                  onClick={() => setShowSnapshots(false)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                {snapshots.length === 0 ? (
                  <div className="text-center py-12 text-text-dim">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">尚無儲存的配置。</p>
                  </div>
                ) : (
                  snapshots.map((snap) => (
                    <div key={snap.id} className="bg-slate-900 border border-border-main rounded-lg p-4 flex items-center justify-between group">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-text-main">{snap.name}</div>
                        <div className="text-[10px] text-text-dim flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {snap.timestamp}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => loadSnapshot(snap)}
                          className="px-3 py-1.5 bg-accent-main hover:bg-emerald-400 text-slate-900 rounded text-[10px] font-bold uppercase transition-colors"
                        >
                          還原
                        </button>
                        <button 
                          onClick={() => deleteSnapshot(snap.id)}
                          className="p-2 text-text-dim hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Voucher Modal */}
      <AnimatePresence>
        {activeVoucher && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVoucher(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="relative w-[340px] bg-white text-slate-900 border shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col p-8 font-mono select-none"
            >
              {/* Printer Jagged Edge Decoration */}
              <div className="absolute -top-1 left-0 right-0 h-1 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
              
              <div className="text-center font-bold text-lg mb-1">{features.find(f => f.id === 'Location')?.selectedOption || 'AWP CASINO'}</div>
              <div className="text-center text-[10px] mb-4 opacity-70">
                {features.find(f => f.id === 'Address1')?.selectedOption || 'STREET 123'}<br/>
                MACHINE #{features.find(f => f.id === 'MachineNumber')?.selectedOption || '001'}
              </div>
              
              <div className="border-y-2 border-black border-dashed py-4 mb-4 flex flex-col items-center">
                <div className="text-xs uppercase font-bold tracking-widest mb-2">Cash Ticket</div>
                <div className="text-4xl font-black">{formatBalance(activeVoucher.amount * 100)}</div>
                <div className="text-[10px] mt-2 font-bold mb-4">NOT LEGALLY TENDER</div>
                
                {/* Barcode Mockup */}
                <div className="flex gap-0.5 h-10 w-full bg-slate-100 p-2">
                   {Array.from({length: 40}).map((_, i) => ( i % 2 === 0 ? <div key={i} className="flex-1 bg-black" style={{ width: `${Math.random() * 2 + 1}px` }}></div> : <div key={i} className="flex-1 bg-transparent"></div> ))}
                </div>
                <div className="text-[9px] mt-1 tracking-[0.4em] font-bold">{activeVoucher.id}</div>
              </div>
              
              <div className="text-[9px] space-y-1 opacity-70">
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{activeVoucher.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>VOUCHER #:</span>
                  <span>{activeVoucher.id}</span>
                </div>
                <div className="text-center mt-4 italic font-bold">
                  {features.find(f => f.id === 'VoucherMessage1')?.selectedOption || 'THANK YOU FOR PLAYING!'}
                </div>
              </div>
              
              <button 
                onClick={() => setActiveVoucher(null)}
                className="mt-8 w-full bg-slate-900 text-white rounded py-3 text-xs font-bold hover:bg-slate-800 transition-colors uppercase tracking-widest"
              >
                關閉並回收
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
