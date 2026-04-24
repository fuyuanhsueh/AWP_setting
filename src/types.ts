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
}

export interface RegionalConfig {
  regionName: string;
  features: AWPFeature[];
}
