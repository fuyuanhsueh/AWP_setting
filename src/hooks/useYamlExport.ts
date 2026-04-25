import { useCallback } from 'react';
import { AWPFeature, Snapshot } from '../types';
import { DEFAULT_FEATURES } from '../constants';
import { parseToCents, toEnglishValue, parseCurrency } from '../utils';
import yaml from 'js-yaml';

/** 偵測是否在 Electron 環境中 */
const electronAPI = (window as any).electronAPI as {
  saveFile: (content: string, defaultName: string, filters: any[]) => Promise<boolean>;
  openFile: (filters: any[]) => Promise<string | null>;
} | undefined;

/** 瀏覽器 fallback：blob 下載 */
const browserDownload = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/** YAML/JSON 匯出匯入 hook */
export function useYamlExport(
  features: AWPFeature[],
  setFeatures: (f: AWPFeature[]) => void,
  regionName: string,
  setRegionName: (n: string) => void,
  snapshots: Snapshot[],
  setSnapshots: (s: Snapshot[]) => void,
) {
  /** YAML 匯入時將值轉回 UI 顯示格式 */
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
        if (id.includes('bets') || id.includes('denoms')) return String(val);
        return (val / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      }
      if (typeof val === 'string' && val.includes('~')) {
        return val.split('~').map(v => toDisplayValue(v.trim().includes('$') ? v.trim() : Number(v.trim()), id)).join(' ~ ');
      }
    }
    return String(val);
  };

  /** 解析 YAML 內容字串為 features */
  const parseYamlContent = useCallback((content: string) => {
    const data = yaml.load(content) as any;
    if (!data || typeof data !== 'object') throw new Error('無效的 YAML 格式');

    const importedFeatures: AWPFeature[] = [];

    const processEntryList = (section: any, category: string) => {
      if (!section.EntryList) return;
      const entryOrder = [...(section.EntryOrder || []), ...(section.EntryOrderLeft || []), ...(section.EntryOrderRight || [])];
      const allIds = Object.keys(section.EntryList);
      const orderedIds = [...new Set([...entryOrder, ...allIds])];
      orderedIds.forEach(id => {
        if (!section.EntryList[id]) return;
        const item = section.EntryList[id];
        const existing = features.find(f => f.id === id) || DEFAULT_FEATURES.find(f => f.id === id);
        importedFeatures.push({
          id, nameEn: existing?.nameEn || id.replace(/([A-Z])/g, ' $1').trim(),
          nameZh: existing?.nameZh || id, enabled: true,
          type: (item.type as any) || (existing?.type) || 'Label',
          options: Array.isArray(item.value_list) ? item.value_list.map((v: any) => toDisplayValue(v, id)) : (item.type === 'Switch' || existing?.type === 'Switch' ? ['OFF', 'ON'] : (existing?.options || [])),
          selectedOption: toDisplayValue(item.default !== undefined ? item.default : existing?.selectedOption, id),
          description: existing?.description || '從 YAML 匯入的功能項目。',
          legalTip: existing?.legalTip || '自動解析之法規參考。',
          category, dependsOn: existing?.dependsOn,
        });
      });
    };

    const traverse = (obj: any, path: string[] = []) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
      const currentPath = path.join('.');
      if (obj.EntryList) processEntryList(obj, currentPath);
      const flatSections = ['SystemSetup.PerGameName', 'SystemSetup.PerGameBetList', 'SystemSetup.PerGameDenomList'];
      if (flatSections.includes(currentPath)) {
        Object.entries(obj).forEach(([key, val]) => {
          if (typeof val !== 'object' || Array.isArray(val)) {
            const suffixMap: Record<string, string> = { 'PerGameName': 'name', 'PerGameBetList': 'bets', 'PerGameDenomList': 'denoms' };
            const suffix = suffixMap[currentPath.split('.').pop()!];
            const featureId = `${key}_${suffix}`;
            const existing = features.find(f => f.id === featureId) || DEFAULT_FEATURES.find(f => f.id === featureId);
            importedFeatures.push({
              id: featureId, nameEn: existing?.nameEn || featureId, nameZh: existing?.nameZh || featureId,
              enabled: true, type: existing?.type || (Array.isArray(val) ? 'Combobox' : 'Textfield'),
              options: Array.isArray(val) ? (val as any[]).map(v => String(v)) : [String(val)],
              selectedOption: Array.isArray(val) ? String(val[0]) : String(val),
              description: existing?.description || '已自動解讀 YAML 結構之遊戲配置。',
              legalTip: existing?.legalTip || '', category: currentPath,
            });
          }
        });
      }
      Object.entries(obj).forEach(([key, val]) => {
        if (key !== 'EntryList' && !key.startsWith('EntryOrder') && key !== 'EntryOrderLeft' && key !== 'EntryOrderRight') {
          traverse(val, [...path, key]);
        }
      });
    };

    traverse(data);

    if (data.SystemSetup?.CurrentEnableGame !== undefined) {
      const existing = features.find(f => f.id === 'CurrentEnableGame') || DEFAULT_FEATURES.find(f => f.id === 'CurrentEnableGame');
      if (existing) importedFeatures.push({ ...existing, selectedOption: String(data.SystemSetup.CurrentEnableGame), category: 'SystemSetup.Configuration' });
    }

    const finalFeatures = importedFeatures.reduce((acc: AWPFeature[], curr) => {
      if (!acc.find(f => f.id === curr.id)) acc.push(curr);
      return acc;
    }, []);
    if (finalFeatures.length === 0) throw new Error('YAML 中未找到任何有效的配置項目 (EntryList)');
    return finalFeatures;
  }, [features]);

  /** 匯入 YAML — Electron 用 dialog，瀏覽器用 file input */
  const importYaml = useCallback((e?: React.ChangeEvent<HTMLInputElement>) => {
    if (electronAPI) {
      electronAPI.openFile([{ name: 'YAML', extensions: ['yaml', 'yml'] }]).then(content => {
        if (!content) return;
        try {
          const finalFeatures = parseYamlContent(content);
          setFeatures(finalFeatures);
          alert(`匯入成功！共導入 ${finalFeatures.length} 個配置項目。`);
        } catch (err) {
          alert('YAML 匯入失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
        }
      });
      return;
    }
    // 瀏覽器 fallback
    if (!e) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const finalFeatures = parseYamlContent(event.target?.result as string);
        setFeatures(finalFeatures);
        alert(`匯入成功！共導入 ${finalFeatures.length} 個配置項目。`);
      } catch (err) {
        alert('YAML 匯入失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [parseYamlContent, setFeatures]);

  /** 產生 YAML 字串 */
  const generateMachineYaml = useCallback(() => {
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
            section += `      game${i}: "${feature.selectedOption}"\n`;
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
      if (['TotalInMeterRate', 'TotalOutMeterRate', 'TotalPlayMeterRate', 'TotalWinMeterRate'].includes(f.id)) {
        block += `${indent}  depends_on: SeparateMeterRate\n`;
      }
      if (f.id === 'CashoutLimitAmount') {
        block += `${indent}  min_value: 100\n${indent}  max_value: 100000\n${indent}  min_precision: 2\n${indent}  depends_on: CashoutLimit\n`;
      }
      if (f.id === 'PlayScore') block += `${indent}  depends_on: ScoreBox\n`;
      if (f.id === 'HandCountAmount') block += `${indent}  depends_on: HandCount\n`;
      if (f.id === 'ChanceLevel') block += `${indent}  hidden_index: 2\n`;
      if (['MaxPlay', 'MinPlay', 'CashInUnit', 'MeterRate', 'CoinInUnit', 'PulseBillInUnit', 'KeyInOutMode', 'KeyInUnit', 'TotalInMeterRate', 'TotalOutMeterRate', 'TotalPlayMeterRate', 'TotalWinMeterRate', 'CashOutUnit', 'CashoutLimitAmount', 'CreditDenom', 'HandCountAmount', 'AwardLimitAmount', 'BalanceLimitAmount', 'JpMinMaxInfo', 'JpMinBetForJp', 'GrandJpInitValue', 'MajorJpInitValue', 'MinorJpInitValue'].includes(f.id)) {
        block += `${indent}  cash_related: true\n`;
      }
      return block;
    };

    let y = `# ==========================================\n# AllSettings_Integrated.yaml\n# 整合所有設定頁 YAML，依功能分區清楚標示\n#\n# 結構：\n#   SystemSetup:\n#     Configuration\n#     JackpotSetting\n#     TimeAdjust\n#     VolumeSetting\n#     PasswordSetting\n#   Peripheral:\n#     BillAcceptorSetting\n#     PrinterSetting\n#       VoucherTemplate (SubPage)\n#     MeterSetting\n# ==========================================\n\n`;

    y += `SystemSetup:\n`;
    const configFeatures = features.filter(f => f.category === 'SystemSetup.Configuration' && f.id !== 'CurrentEnableGame');
    y += `  Configuration:\n    # 本次新增設定，暫時不使用，放在左邊列表最下方\n    EntryOrderLeft:\n`;
    configFeatures.slice(0, 12).forEach(f => { y += `      - ${f.id}\n`; });
    y += `    EntryOrderRight:\n`;
    configFeatures.slice(12, 24).forEach(f => { y += `      - ${f.id}\n`; });
    y += `    EntryList:\n`;
    configFeatures.forEach(f => { y += getFeatureYamlBlock(f); });

    const jpFeatures = features.filter(f => f.category === 'SystemSetup.JackpotSetting');
    y += `\n  # ==========================================\n  # [SystemSetup] JackpotSetting\n  # ==========================================\n  JackpotSetting:\n    EntryOrder:\n`;
    jpFeatures.forEach(f => { y += `      - ${f.id}\n`; });
    y += `    EntryList:\n`;
    jpFeatures.forEach(f => { y += getFeatureYamlBlock(f); });

    const timeFeatures = features.filter(f => f.category === 'SystemSetup.TimeAdjust');
    y += `\n  # ==========================================\n  # [SystemSetup] TimeAdjust\n  # ==========================================\n  TimeAdjust:\n    EntryList:\n`;
    timeFeatures.forEach(f => { y += getFeatureYamlBlock(f); });

    const volFeatures = features.filter(f => f.category === 'SystemSetup.VolumeSetting');
    y += `\n  # ==========================================\n  # [SystemSetup] VolumeSetting\n  # ==========================================\n  VolumeSetting:\n    EntryList:\n`;
    volFeatures.forEach(f => { y += getFeatureYamlBlock(f); });

    const passFeatures = features.filter(f => f.category === 'SystemSetup.PasswordSetting');
    y += `\n  # ==========================================\n  # [SystemSetup] PasswordSetting\n  # ==========================================\n  PasswordSetting:\n    EntryList:\n`;
    passFeatures.forEach(f => { y += getFeatureYamlBlock(f); });

    const currentEnableGame2 = currentEnableGame;
    y += `\n  # ==========================================\n  # [SystemSetup] CurrentEnableGame\n  # ==========================================\n  CurrentEnableGame: ${currentEnableGame2}\n`;
    y += `\n  # ==========================================\n  # [SystemSetup] PerGameName\n  # ==========================================\n  PerGameName:\n${generatePerGameSection('PerGameName', 'name', false)}`;
    y += `\n  # ==========================================\n  # [SystemSetup] PerGameBetList\n  # ==========================================\n  PerGameBetList:\n${generatePerGameSection('PerGameBetList', 'bets', true)}`;
    y += `\n  # ==========================================\n  # [SystemSetup] PerGameDenomList\n  # ==========================================\n  PerGameDenomList:\n${generatePerGameSection('PerGameDenomList', 'denoms', true)}`;

    y += `\n# ==========================================\n# Peripheral\n# ==========================================\nPeripheral:\n`;
    const billFeatures = features.filter(f => f.category === 'Peripheral.BillAcceptorSetting');
    y += `  BillAcceptorSetting:\n    EntryList:\n`;
    billFeatures.forEach(f => { y += getFeatureYamlBlock(f); });

    const printerFeatures = features.filter(f => f.category === 'Peripheral.PrinterSetting' && !['Location', 'Address1', 'Address2', 'Address3', 'PhoneNumber', 'FaxNumber', 'MachineNumber', 'VoucherMessage1', 'VoucherMessage2', 'AssetNumber'].includes(f.id));
    const voucherFeatures = features.filter(f => f.category === 'Peripheral.PrinterSetting' && ['Location', 'Address1', 'Address2', 'Address3', 'PhoneNumber', 'FaxNumber', 'MachineNumber', 'VoucherMessage1', 'VoucherMessage2', 'AssetNumber'].includes(f.id));
    y += `\n  # ==========================================\n  # [Peripheral] PrinterSetting\n  # ==========================================\n  PrinterSetting:\n    EntryList:\n`;
    printerFeatures.forEach(f => { y += getFeatureYamlBlock(f); });
    y += `\n    # ------------------------------------------\n    # [Peripheral > PrinterSetting] VoucherTemplate (SubPage)\n    # ------------------------------------------\n    VoucherTemplate:\n      Title: "i18n:Peripheral.PrinterSetting.VoucherTemplate.Title"\n      EntryOrder:\n`;
    voucherFeatures.forEach(f => { y += `        - ${f.id}\n`; });
    y += `      EntryList:\n`;
    voucherFeatures.forEach(f => { y += getFeatureYamlBlock(f, '        '); });

    const meterFeatures = features.filter(f => f.category === 'Peripheral.MeterSetting');
    y += `\n  # ==========================================\n  # [Peripheral] MeterSetting\n  # ==========================================\n  MeterSetting:\n    EntryList:\n`;
    meterFeatures.forEach(f => { y += getFeatureYamlBlock(f); });

    return y;
  }, [features]);

  /** 匯出 YAML 檔案 — Electron 用 dialog，瀏覽器用 blob */
  const exportYaml = useCallback(async () => {
    const yamlStr = generateMachineYaml();
    const filename = `awp_config_${regionName.toLowerCase().replace(/\s+/g, '_')}.yaml`;
    if (electronAPI) {
      await electronAPI.saveFile(yamlStr, filename, [{ name: 'YAML', extensions: ['yaml', 'yml'] }]);
    } else {
      browserDownload(yamlStr, filename, 'text/yaml');
    }
  }, [generateMachineYaml, regionName]);

  /** 匯出 JSON — Electron 用 dialog，瀏覽器用 blob */
  const exportJson = useCallback(async () => {
    const data = { version: "4.2.0", metadata: { exportedAt: new Date().toISOString(), appName: "AWP 配置產生器", environment: "生產環境" }, regionName, features, snapshots };
    const content = JSON.stringify(data, null, 2);
    const filename = `awp_config_full_${regionName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    if (electronAPI) {
      await electronAPI.saveFile(content, filename, [{ name: 'JSON', extensions: ['json'] }]);
    } else {
      browserDownload(content, filename, 'application/json');
    }
  }, [regionName, features, snapshots]);

  /** 匯入 JSON — Electron 用 dialog，瀏覽器用 file input */
  const importJson = useCallback((e?: React.ChangeEvent<HTMLInputElement>) => {
    const processJsonContent = (content: string) => {
      try {
        const data = JSON.parse(content);
        const featuresToLoad = data.features || (data.config && data.config.features);
        const regionToLoad = data.regionName || (data.config && data.config.regionName);
        if (featuresToLoad && Array.isArray(featuresToLoad)) {
          setFeatures(featuresToLoad);
          if (regionToLoad) setRegionName(regionToLoad);
          if (data.snapshots && Array.isArray(data.snapshots)) {
            setSnapshots(data.snapshots);
            localStorage.setItem('awp_snapshots', JSON.stringify(data.snapshots));
          }
          alert('成功載入配置項目！已恢復所有功能設定與清單順序。');
        } else {
          alert('JSON 格式錯誤：無法找到有效的功能數據。');
        }
      } catch { alert('解析 JSON 檔案失敗，請確保這是正確的 AWP 備份檔案。'); }
    };

    if (electronAPI) {
      electronAPI.openFile([{ name: 'JSON', extensions: ['json'] }]).then(content => {
        if (content) processJsonContent(content);
      });
      return;
    }
    // 瀏覽器 fallback
    if (!e) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => processJsonContent(event.target?.result as string);
    reader.readAsText(file);
    e.target.value = '';
  }, [setFeatures, setRegionName, setSnapshots]);

  return { importYaml, generateMachineYaml, exportYaml, exportJson, importJson };
}
