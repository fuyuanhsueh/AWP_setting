import { useState, useCallback } from 'react';
import { AWPFeature, Snapshot } from '../types';

/** 快照管理 hook */
export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    const saved = localStorage.getItem('awp_snapshots');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSnapshots, setShowSnapshots] = useState(false);

  const saveSnapshot = useCallback((regionName: string, features: AWPFeature[]) => {
    const newSnapshot: Snapshot = {
      id: `snap_${Date.now()}`,
      name: `${regionName} 配置存檔`,
      timestamp: new Date().toLocaleString(),
      regionName,
      features: JSON.parse(JSON.stringify(features))
    };
    setSnapshots(prev => {
      const updated = [newSnapshot, ...prev];
      localStorage.setItem('awp_snapshots', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loadSnapshot = useCallback((snap: Snapshot, setFeatures: (f: AWPFeature[]) => void, setRegionName: (n: string) => void) => {
    setFeatures(JSON.parse(JSON.stringify(snap.features)));
    setRegionName(snap.regionName);
    setShowSnapshots(false);
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('awp_snapshots', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { snapshots, setSnapshots, showSnapshots, setShowSnapshots, saveSnapshot, loadSnapshot, deleteSnapshot };
}
