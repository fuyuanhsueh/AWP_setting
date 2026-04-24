import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind class 合併工具 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 解析貨幣字串為數值（美元） */
export const parseCurrency = (val: string): number => {
  if (!val) return 0;
  if (val.includes('¢')) return parseFloat(val) / 100;
  const clean = val.split('~')[0].replace(/[$,]/g, '').trim();
  return parseFloat(clean) || 0;
};

/** 格式化餘額（分為單位） */
export const formatBalance = (cents: number, displayFormat: string, currentDenomValue: number, currencySymbol: string) => {
  if (displayFormat === 'Credit') {
    return Math.floor(cents / (currentDenomValue * 100)).toLocaleString();
  }
  return `${currencySymbol}${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** 格式化原始金額 */
export const formatRawAmount = (amount: number, displayFormat: string, currentDenomValue: number, currencySymbol: string) => {
  if (displayFormat === 'Credit') {
    return Math.floor(amount / currentDenomValue).toLocaleString();
  }
  return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** 將中文/UI 值轉為英文 YAML 值 */
export const toEnglishValue = (val: string) => {
  const mapping: Record<string, string> = {
    '開啟': 'true', '關閉': 'false', 'ON': 'true', 'OFF': 'false',
    '簡單': 'Easy', '中等': 'Medium', '困難': 'Hard', '低': 'Low',
    '標準': 'Standard', '高': 'High', '票據': 'Ticket', '人工派彩': 'Handpay',
    '卡片': 'Card', '全部': 'All', '英文': 'English', '西班牙文': 'Spanish',
    '中英雙語': 'Bilingual', '30 分鐘': '30 Minutes', '60 分鐘': '60 Minutes',
    '本地': 'Local', '廣域': 'Wide Area', '無限制': 'Unlimited', '無': 'None'
  };
  return mapping[val] || val;
};

/** 將 UI 顯示值轉為分（cents）字串 */
export const parseToCents = (val: string): string => {
  if (typeof val !== 'string') return String(val);
  const cleaned = val.trim();
  if (cleaned.includes('~')) {
    return cleaned.split('~').map(p => parseToCents(p)).join('~');
  }
  if (cleaned.includes('$')) {
    const numericPart = cleaned.replace(/[$,\s]/g, '');
    if (numericPart === '') return cleaned;
    const num = parseFloat(numericPart);
    return isNaN(num) ? cleaned : String(Math.round(num * 100));
  }
  if (cleaned.includes('¢')) {
    return cleaned.replace(/[¢\s]/g, '');
  }
  return toEnglishValue(cleaned);
};

/** 將 nameEn 轉為 PascalCase ID */
export const toPascalCaseId = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
};
