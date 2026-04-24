import { useState, useMemo, useEffect, useCallback } from 'react';
import { AWPFeature } from '../types';
import { DEFAULT_FEATURES, DEPENDENCY_MAP } from '../constants';
import { parseCurrency, toPascalCaseId } from '../utils';

/** 功能管理 hook：包含 features 狀態、CRUD、依賴連動 */
export function useFeatures() {
  const [features, setFeatures] = useState<AWPFeature[]>(DEFAULT_FEATURES);
  const [regionName, setRegionName] = useState('預設地區');
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

  const enabledFeatures = useMemo(() => features.filter(f => f.enabled), [features]);
  const activeFeature = useMemo(() => features.find(f => f.id === editingFeatureId) || null, [features, editingFeatureId]);

  /** 檢查某功能是否因父功能關閉而被 disable */
  const isDisabledByDependency = useCallback((feature: AWPFeature): string | null => {
    const parentId = feature.dependsOn || DEPENDENCY_MAP[feature.id];
    if (!parentId) return null;
    const parent = features.find(f => f.id === parentId);
    if (!parent) return null;
    // 父功能未啟用，或父功能是 Switch 且選項為 OFF
    if (!parent.enabled) return parent.nameEn;
    if (parent.type === 'Switch' && parent.selectedOption === 'OFF') return parent.nameEn;
    return null;
  }, [features]);

  const handleToggleFeature = useCallback((id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  }, []);

  const handleUpdateOption = useCallback((id: string, option: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, selectedOption: option } : f));
  }, []);

  const handleAddFeature = useCallback(() => {
    const newId = `feature_${Date.now()}`;
    const newFeature: AWPFeature = {
      id: newId, nameEn: 'New Feature', nameZh: '新功能項目',
      enabled: true, options: ['選項 1'], selectedOption: '選項 1',
      type: 'Spinbox', description: '請輸入功能描述。',
      legalTip: '請輸入此功能的法規提示。', category: 'SystemSetup.Configuration'
    };
    setFeatures(prev => [...prev, newFeature]);
    setEditingFeatureId(newId);
  }, []);

  const handleRemoveFeature = useCallback((id: string) => {
    setFeatures(prev => prev.filter(f => f.id !== id));
    setEditingFeatureId(prev => prev === id ? null : prev);
  }, []);

  const updateFeatureField = useCallback((id: string, field: keyof AWPFeature, value: any) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  }, []);

  /** 修改 nameEn 時連動更新 ID（任務 4） */
  const renameFeatureWithId = useCallback((id: string, newNameEn: string) => {
    const newId = toPascalCaseId(newNameEn);
    if (!newId) return;
    // 防重複 ID 檢查
    const isDuplicate = features.some(f => f.id === newId && f.id !== id);
    if (isDuplicate) return; // 不更新，由 UI 顯示警告
    setFeatures(prev => prev.map(f => {
      if (f.id === id) return { ...f, nameEn: newNameEn, id: newId };
      // 同步更新其他 feature 的 dependsOn 引用
      if (f.dependsOn === id) return { ...f, dependsOn: newId };
      return f;
    }));
    // 更新 editingFeatureId
    setEditingFeatureId(prev => prev === id ? newId : prev);
  }, [features]);

  const handleAddOption = useCallback((featureId: string) => {
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      const newOption = `選項 ${f.options.length + 1}`;
      return { ...f, options: [...f.options, newOption] };
    }));
  }, []);

  const handleRemoveOption = useCallback((featureId: string, optionIndex: number) => {
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      const newOptions = f.options.filter((_, i) => i !== optionIndex);
      const newSelected = newOptions.includes(f.selectedOption) ? f.selectedOption : (newOptions[0] || '');
      return { ...f, options: newOptions, selectedOption: newSelected };
    }));
  }, []);

  const handleEditOptionText = useCallback((featureId: string, index: number, newText: string) => {
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      const newOptions = [...f.options];
      const oldText = newOptions[index];
      newOptions[index] = newText;
      return { ...f, options: newOptions, selectedOption: f.selectedOption === oldText ? newText : f.selectedOption };
    }));
  }, []);

  return {
    features, setFeatures, regionName, setRegionName,
    editingFeatureId, setEditingFeatureId,
    enabledFeatures, activeFeature,
    isDisabledByDependency,
    handleToggleFeature, handleUpdateOption, handleAddFeature,
    handleRemoveFeature, updateFeatureField, renameFeatureWithId,
    handleAddOption, handleRemoveOption, handleEditOptionText,
  };
}
