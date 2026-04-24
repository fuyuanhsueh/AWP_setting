export interface AWPFeature {
  id: string;
  nameEn: string;
  nameZh: string;
  enabled: boolean;
  options: string[];
  selectedOption: string;
  description: string;
  markdownSpec?: string;
  aiPrompt?: string;
  schematicUrl?: string;
  legalTip: string;
  type: 'Switch' | 'Spinbox' | 'Combobox' | 'Textfield' | 'Numberfield' | 'Numberpad' | 'Label';
  category: string;
  /** 依賴的父功能 ID，父功能關閉時此功能自動 disable */
  dependsOn?: string;
}

export interface RegionalConfig {
  regionName: string;
  features: AWPFeature[];
}

export interface Snapshot {
  id: string;
  name: string;
  timestamp: string;
  regionName: string;
  features: AWPFeature[];
}
