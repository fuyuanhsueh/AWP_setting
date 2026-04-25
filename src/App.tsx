/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { CATEGORY_ORDER } from './constants';
import { useFeatures, useSimulator, useSnapshots, useYamlExport, useToast } from './hooks';
import { Header, SortableFeature, FeatureEditor, YamlPreviewModal, SnapshotPanel, SimulatorPreview, VoucherModal, ToastContainer } from './components';
import { cn } from './utils';

/** AWP 配置產生器主元件 — 負責組裝 layout 與協調各模組 */
export default function App() {
  const feat = useFeatures();
  const sim = useSimulator(feat.features);
  const snap = useSnapshots();
  const toast = useToast();
  const yamlExport = useYamlExport(feat.features, feat.setFeatures, feat.regionName, feat.setRegionName, snap.snapshots, snap.setSnapshots, toast.addToast);

  const [isExporting, setIsExporting] = useState(false);
  const [showYamlModal, setShowYamlModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /** 處理功能列表拖拽排序 */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const oldIndex = feat.features.findIndex(f => f.id === activeId);
    const newIndex = feat.features.findIndex(f => f.id === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      if (feat.features[oldIndex].category === feat.features[newIndex].category) {
        feat.setFeatures(prev => arrayMove(prev, oldIndex, newIndex));
      } else {
        feat.setFeatures(prev => {
          const updated = [...prev];
          const item = { ...updated[oldIndex], category: updated[newIndex].category };
          updated.splice(oldIndex, 1);
          updated.splice(newIndex, 0, item);
          return updated;
        });
      }
    }
  };

  /** 匯出 YAML 並顯示成功動畫 */
  const handleExportYaml = () => {
    yamlExport.exportYaml();
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-accent-main/30">
      <Header
        regionName={feat.regionName} setRegionName={feat.setRegionName}
        isExporting={isExporting}
        onSaveSnapshot={() => snap.saveSnapshot(feat.regionName, feat.features)}
        onShowSnapshots={() => snap.setShowSnapshots(true)}
        onExportJson={yamlExport.exportJson} onImportJson={yamlExport.importJson}
        onImportYaml={yamlExport.importYaml} onShowYaml={() => setShowYamlModal(true)}
        onExportYaml={handleExportYaml}
      />

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(100vh-64px)]">
        {/* 左側面板：功能配置列表 */}
        <section className="p-6 border-r border-border-main overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-text-dim flex items-center gap-2">
              <span>地區特定配置</span><span className="h-3 w-[1px] bg-border-main" /><span className="text-accent-main">州別: {feat.regionName}</span>
            </div>
            <button onClick={feat.handleAddFeature} className="text-[10px] flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-border-main transition-colors uppercase font-bold tracking-wider">
              <Plus className="w-3 h-3" />新增功能
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {CATEGORY_ORDER.map(cat => {
                const catFeatures = feat.features.filter(f => f.category === cat);
                if (catFeatures.length === 0) return null;
                return (
                  <div key={cat} className="mb-6 last:mb-0">
                    <div className="mt-8 mb-3 first:mt-2 flex items-center gap-3 select-none">
                      <div className="h-[1px] w-6 bg-accent-main/30" />
                      <span className="text-[11px] font-black text-accent-main uppercase tracking-[0.2em] whitespace-nowrap">{cat.replace('.', '] ').replace(/^/, '[')}</span>
                      <div className="h-[1px] flex-1 bg-border-main/30" />
                    </div>
                    <SortableContext items={catFeatures.map(f => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-col gap-2">
                        {catFeatures.map(feature => (
                          <SortableFeature key={feature.id} feature={feature}
                            onToggle={feat.handleToggleFeature} onEdit={feat.setEditingFeatureId}
                            onRemove={feat.handleRemoveFeature} onUpdateOption={(id, opt) => { feat.handleUpdateOption(id, opt); sim.addNotification(`已更新設定 [${feature.nameZh}]: ${opt}`); }}
                            disabledByParent={feat.isDisabledByDependency(feature)} />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
              {/* 未分類項目 */}
              {(() => {
                const otherFeatures = feat.features.filter(f => !CATEGORY_ORDER.includes(f.category || ''));
                if (otherFeatures.length === 0) return null;
                return (
                  <div className="mb-6">
                    <div className="mt-8 mb-3 flex items-center gap-3 select-none">
                      <div className="h-[1px] w-6 bg-slate-500/30" />
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">[OTHER] 未分類項目</span>
                      <div className="h-[1px] flex-1 bg-border-main/30" />
                    </div>
                    <SortableContext items={otherFeatures.map(f => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-col gap-2">
                        {otherFeatures.map(feature => (
                          <SortableFeature key={feature.id} feature={feature}
                            onToggle={feat.handleToggleFeature} onEdit={feat.setEditingFeatureId}
                            onRemove={feat.handleRemoveFeature} onUpdateOption={(id, opt) => { feat.handleUpdateOption(id, opt); sim.addNotification(`已更新設定 [${feature.nameZh}]: ${opt}`); }}
                            disabledByParent={feat.isDisabledByDependency(feature)} />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })()}
            </DndContext>
          </div>
        </section>

        {/* 右側面板：模擬器預覽 */}
        <div className="flex flex-col h-full overflow-hidden bg-bg-deep border-l border-border-main">
          <SimulatorPreview features={feat.features} sim={{ ...sim, handleUpdateOption: feat.handleUpdateOption }} handleUpdateOption={feat.handleUpdateOption} />
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showYamlModal && <YamlPreviewModal onClose={() => setShowYamlModal(false)} generateMachineYaml={yamlExport.generateMachineYaml} onExportYaml={handleExportYaml} />}
      </AnimatePresence>
      <AnimatePresence>
        {feat.activeFeature && (
          <FeatureEditor feature={feat.activeFeature} features={feat.features} onClose={() => feat.setEditingFeatureId(null)}
            updateFeatureField={feat.updateFeatureField} renameFeatureWithId={feat.renameFeatureWithId}
            setFeatures={feat.setFeatures} handleAddOption={feat.handleAddOption}
            handleRemoveOption={feat.handleRemoveOption} handleEditOptionText={feat.handleEditOptionText}
            handleUpdateOption={feat.handleUpdateOption} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {snap.showSnapshots && <SnapshotPanel snapshots={snap.snapshots} onClose={() => snap.setShowSnapshots(false)}
          onLoad={(s) => snap.loadSnapshot(s, feat.setFeatures, feat.setRegionName)} onDelete={snap.deleteSnapshot} />}
      </AnimatePresence>
      <AnimatePresence>
        {sim.activeVoucher && <VoucherModal voucher={sim.activeVoucher} features={feat.features} formatBalance={sim.formatBalance} onClose={() => sim.setActiveVoucher(null)} />}
      </AnimatePresence>

      {/* Toast 通知 */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
