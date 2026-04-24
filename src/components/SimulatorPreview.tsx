import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, ZoomIn, ZoomOut, Lock } from 'lucide-react';
import { AWPFeature } from '../types';
import { cn } from '../utils';

interface SimulatorPreviewProps {
  features: AWPFeature[];
  sim: {
    balanceCents: number; setBalanceCents: React.Dispatch<React.SetStateAction<number>>;
    lastWinCents: number; currentBetCredits: number; setCurrentBetCredits: (n: number) => void;
    isSpinning: boolean; notifications: {id: string, message: string}[];
    hasSpun: boolean; vfdMessage: string; isVfdPulsing: boolean;
    showDenomPanel: boolean; setShowDenomPanel: (b: boolean) => void;
    previewScale: number; setPreviewScale: (fn: (n: number) => number) => void;
    sbcoFeature: AWPFeature | undefined; currentDenomValue: number; displayFormat: string;
    credits: number; winCredits: number; totalBetAmount: number;
    maxPlayAmount: number; isTiltMismatch: boolean;
    isGrandEligible: boolean; grandJackpotDisplayValue: string; majorJackpotDisplayValue: string;
    miniJackpotValue: string; minorJackpotValue: string; minPlayForGrand: number;
    formatBalance: (cents: number) => string; formatRawAmount: (amount: number) => string;
    recordInteraction: () => void; handlePreviewSpin: () => void; handlePreviewCashout: () => void;
    handleUpdateOption: (id: string, opt: string) => void;
  };
  handleUpdateOption: (id: string, opt: string) => void;
}

/** AWP 機台模擬器預覽面板 */
export function SimulatorPreview({ features, sim, handleUpdateOption }: SimulatorPreviewProps) {
  const {
    balanceCents, setBalanceCents, lastWinCents, currentBetCredits, setCurrentBetCredits,
    isSpinning, notifications, hasSpun, vfdMessage, isVfdPulsing,
    showDenomPanel, setShowDenomPanel, previewScale, setPreviewScale,
    sbcoFeature, currentDenomValue, displayFormat,
    totalBetAmount, maxPlayAmount, isTiltMismatch,
    isGrandEligible, grandJackpotDisplayValue, majorJackpotDisplayValue,
    miniJackpotValue, minorJackpotValue, minPlayForGrand,
    formatBalance, formatRawAmount, recordInteraction,
    handlePreviewSpin, handlePreviewCashout,
  } = sim;

  return (
    <aside className="flex-1 bg-black p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-full h-10 px-4 flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur absolute top-0 z-30">
        <div className="text-[10px] uppercase font-bold tracking-widest text-text-dim/60 flex items-center gap-2"><Monitor className="w-3 h-3" />Terminal Live Preview</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/40 rounded-full border border-white/10 p-0.5">
            <button onClick={() => setPreviewScale(prev => Math.max(0.3, prev - 0.1))} title="縮小" className="p-1 px-2 text-text-dim hover:text-white transition-colors hover:bg-white/5 rounded-full"><ZoomOut className="w-3.5 h-3.5" /></button>
            <div className="w-10 text-center text-[10px] font-mono font-bold text-accent-main">{Math.round(previewScale * 100)}%</div>
            <button onClick={() => setPreviewScale(prev => Math.min(1.5, prev + 0.1))} title="放大" className="p-1 px-2 text-text-dim hover:text-white transition-colors hover:bg-white/5 rounded-full"><ZoomIn className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={() => setPreviewScale(() => 0.7)} className="text-[9px] font-black text-text-dim hover:text-white uppercase transition-colors px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/5">Reset</button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-auto custom-scrollbar flex items-center justify-center p-12 mt-10">
        <div style={{ transform: `scale(${previewScale})` }} className="w-[310px] h-[640px] bg-[#0c0c0c] border-[8px] border-[#1a1a1a] rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.8)] relative flex flex-col transition-transform origin-center">
          {/* 螢幕內容 */}
          <div className="flex-[1.4] m-2 bg-gradient-to-b from-slate-900 via-[#050510] to-black rounded border-2 border-white/5 relative p-3 flex flex-col overflow-hidden">
            {/* 遊戲 Logo */}
            <div className="relative mb-2 group cursor-default h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-accent-main/20 blur-xl rounded-full opacity-50"></div>
              <div className="text-xl text-center font-black text-white italic tracking-tighter relative drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] uppercase break-words px-2 leading-tight">
                <span className="text-accent-main">{features.find(f => f.id === 'game1_name')?.selectedOption?.split(' ')[0] || 'NEON'}</span> <span className="opacity-90">{features.find(f => f.id === 'game1_name')?.selectedOption?.split(' ').slice(1).join(' ') || 'QUEST'}</span>
              </div>
            </div>

            {/* Jackpot 層級 */}
            <div className="space-y-1 mb-3">
              <div className={cn("relative h-9 rounded border flex flex-col justify-center items-center overflow-hidden transition-all duration-500",
                isGrandEligible ? "bg-gradient-to-r from-red-950 to-red-800 border-red-500/50 shadow-[inset_0_0_10px_rgba(255,0,0,0.3)] grayscale-0" : "bg-slate-900 border-white/10 grayscale opacity-60")}>
                <div className={cn("absolute top-0 left-0 px-1 py-0.5 text-[5px] font-black text-white tracking-widest rounded-br-sm border-r border-b transition-colors", isGrandEligible ? "bg-red-600 border-red-400/50" : "bg-slate-700 border-white/10")}>GRAND</div>
                {!isGrandEligible && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 backdrop-blur-[1px]">
                    <div className="flex items-center mb-0.5"><Lock className="w-2.5 h-2.5 text-white" /><span className="ml-1 text-[6px] font-black text-white uppercase tracking-tighter">LOCKED</span></div>
                    <div className="text-[7px] font-black text-white animate-pulse text-center leading-none tracking-tight">BET {formatRawAmount(minPlayForGrand)} TO QUALIFY</div>
                  </div>
                )}
                <div className={cn("text-base font-mono font-bold tracking-wider transition-all", isGrandEligible ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "text-white/20")}>{grandJackpotDisplayValue}</div>
                {isGrandEligible && <div className="absolute -right-2 top-0 bottom-0 w-8 bg-white/10 skew-x-[-20deg] animate-pulse"></div>}
              </div>
              <div className="relative h-7 bg-gradient-to-r from-emerald-950 to-emerald-800 rounded border border-emerald-500/40 flex flex-col justify-center items-center">
                <div className="absolute top-0 left-0 px-1 py-0.5 bg-emerald-600 text-[5px] font-black text-white tracking-widest rounded-br-sm border-r border-b border-emerald-400/50">MAJOR</div>
                <div className="text-xs font-mono font-bold text-emerald-100 tracking-wider transition-all">{majorJackpotDisplayValue}</div>
              </div>
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

            {/* 轉輪 */}
            <div className="flex-1 flex gap-1.5 justify-center mt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-1 max-w-[50px] bg-white/5 rounded border border-white/10 flex flex-col items-center justify-around py-2 shadow-inner">
                  <div className="w-6 h-6 bg-red-600 rounded shadow-[0_0_10px_rgba(220,38,38,0.4)]" />
                  <div className="w-6 h-6 bg-emerald-600 rounded shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                  <div className="w-6 h-6 bg-amber-600 rounded shadow-[0_0_10px_rgba(217,119,6,0.4)]" />
                </div>
              ))}
            </div>

            {/* 資訊列 */}
            <div className="mt-4 flex items-center gap-1">
              <div className="flex-[1.2] bg-black/80 border border-white/10 text-accent-main font-mono px-1 py-0.5 text-[8px] text-center leading-tight">{displayFormat === 'Credit' ? 'CREDIT' : 'CASH'}<br/>{formatBalance(balanceCents)}</div>
              <div className="flex-1 bg-black/80 border border-white/10 text-accent-main font-mono px-1 py-0.5 text-[8px] text-center leading-tight">BET<br/>{displayFormat === 'Credit' ? currentBetCredits : formatBalance(totalBetAmount * 100)}</div>
              <div className="flex-1 bg-black/80 border border-white/10 text-amber-400 font-mono px-1 py-0.5 text-[8px] text-center leading-tight">WIN<br/>{formatBalance(lastWinCents)}</div>
              <button onClick={() => setShowDenomPanel(!showDenomPanel)} className="flex-1 bg-black/80 border border-accent-main/30 text-accent-main font-mono px-1 py-0.5 text-[8px] text-center leading-tight hover:border-accent-main transition-colors">DENOM<br/>{features.find(f => f.id === 'game1_denoms')?.selectedOption || 'N/A'}</button>
            </div>

            {/* 面額選擇面板 */}
            <AnimatePresence>
              {showDenomPanel && (
                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                  className="absolute inset-x-2 bottom-12 bg-slate-900/95 backdrop-blur border border-accent-main/30 rounded-lg p-3 z-20 shadow-2xl">
                  <div className="text-[8px] uppercase font-bold text-accent-main mb-2 tracking-widest text-center border-b border-white/10 pb-1 text-[7px]">Choose Your Denomination</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {features.find(f => f.id === 'game1_denoms')?.options.map((opt, idx) => (
                      <button key={`${opt}-${idx}`} onClick={() => { handleUpdateOption('game1_denoms', opt); setShowDenomPanel(false); }}
                        className={cn("text-[9px] font-mono py-1 rounded border transition-all",
                          features.find(f => f.id === 'game1_denoms')?.selectedOption === opt ? "bg-accent-main text-slate-900 border-accent-main" : "bg-black/40 text-text-dim border-white/10 hover:border-accent-main/50")}>{opt}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 實體插槽區 */}
          <div className="bg-[#111] px-4 py-2 flex justify-between items-center border-t border-white/5 border-b border-black">
            <div className="flex flex-col items-center"><div className="w-12 h-1 bg-blue-500/40 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-400/20 mb-1" /><span className="text-[5px] text-text-dim uppercase font-bold tracking-tighter">Ticket Out</span></div>
            <div className="flex flex-col items-center"><div className="w-12 h-1 bg-blue-500/40 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-400/20 mb-1" /><span className="text-[5px] text-text-dim uppercase font-bold tracking-tighter">Insert Bill / Ticket</span></div>
          </div>

          {/* 按鈕面板 */}
          <div className="bg-[#1a1a1a] p-3 flex flex-col gap-3 relative border-t border-white/10" onMouseMove={recordInteraction} onClick={recordInteraction}>
            <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center">
              <AnimatePresence>
                {notifications.map(n => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 10 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-bg-card/90 backdrop-blur border border-accent-main/50 text-accent-main text-[7px] px-3 py-1 rounded shadow-lg font-bold uppercase tracking-tight mb-1">{n.message}</motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-start pt-1 px-1">
              <div className="flex flex-col gap-2">
                <button onClick={handlePreviewCashout} className={cn("w-8 h-8 rounded-lg bg-slate-900 border-2 border-slate-700 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all group", (sbcoFeature?.enabled && sbcoFeature?.selectedOption === 'ON' && !hasSpun) && "opacity-80")}>
                  <span className={cn("text-[6px] font-black leading-none text-center drop-shadow-[0_0_2px_rgba(244,63,94,0.3)]", (sbcoFeature?.enabled && sbcoFeature?.selectedOption === 'ON' && !hasSpun) ? "text-rose-900" : "text-rose-500")}>CASH<br/>OUT</span>
                </button>
                <button onClick={() => setBalanceCents(prev => prev + 100)} className="w-8 h-8 rounded-lg bg-slate-900 border-2 border-blue-500/50 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all group">
                  <span className="text-[6px] font-black text-blue-400 leading-none text-center drop-shadow-[0_0_2px_rgba(59,130,246,0.3)] tracking-tighter">ADD<br/>{displayFormat === 'Credit' ? (1 / currentDenomValue).toLocaleString() : '$1.00'}</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {[1, 5, 10].map(lines => (
                  <button key={lines} onClick={recordInteraction} className={cn("w-8 h-8 rounded-lg bg-slate-900 border-2 border-slate-700 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all", lines === 5 && "border-blue-500 bg-slate-800")}>
                    <span className={cn("text-[6px] font-black leading-none text-center", lines === 5 ? "text-blue-400" : "text-slate-500")}>PLAY<br/>{lines}<br/>LINES</span>
                  </button>
                ))}
              </div>
              <button onClick={handlePreviewSpin} disabled={isSpinning || isTiltMismatch}
                className={cn("w-14 h-14 rounded-full bg-emerald-800 border-[3px] border-emerald-500 shadow-[4px_4px_0_rgba(0,0,0,0.4),0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center active:translate-y-1 active:shadow-none transition-all",
                  isSpinning && "animate-pulse brightness-125", isTiltMismatch && "opacity-30 grayscale cursor-not-allowed border-slate-700 bg-slate-900")}>
                <span className="text-[10px] font-black text-white italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] tracking-tighter">{isSpinning ? '...' : (isTiltMismatch ? 'ERROR' : 'SPIN')}</span>
              </button>
            </div>

            <div className="mx-auto w-[65%] h-6 bg-black border border-white/5 rounded flex items-center justify-center shadow-inner relative overflow-hidden">
              <div className={cn("text-[7px] font-mono text-center uppercase tracking-widest opacity-80",
                isTiltMismatch ? "text-red-500 font-black animate-[pulse_0.5s_infinite]" : "text-cyan-400",
                (isVfdPulsing || isTiltMismatch) && "animate-pulse")}>{isTiltMismatch ? "TILT: BET CONFIG MISMATCH" : vfdMessage}</div>
            </div>

            <div className="flex justify-center gap-1.5 pb-2">
              {[5, 10, 15, 25, 50].map(val => {
                const isDisabled = isTiltMismatch || (val * currentDenomValue > maxPlayAmount);
                return (
                  <button key={val} disabled={isDisabled} onClick={() => { setCurrentBetCredits(val); recordInteraction(); }}
                    className={cn("w-9 h-9 rounded-lg bg-slate-900 border-2 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all",
                      currentBetCredits === val ? "border-accent-main bg-slate-800 ring-2 ring-accent-main/20" : "border-slate-700",
                      isDisabled && "opacity-30 grayscale cursor-not-allowed border-slate-800")}>
                    <div className="flex flex-col items-center">
                      <span className={cn("text-xs font-black", currentBetCredits === val ? "text-accent-main" : "text-white/80")}>{val}</span>
                      <span className="text-[4px] text-text-dim uppercase font-bold tracking-tighter">Credits</span>
                    </div>
                  </button>
                );
              })}
              <button disabled={isTiltMismatch} onClick={() => {
                const bets = [5, 10, 15, 25, 50];
                const validBets = bets.filter(b => b * currentDenomValue <= maxPlayAmount);
                if (validBets.length > 0) setCurrentBetCredits(Math.max(...validBets));
                recordInteraction();
              }} className={cn("w-9 h-9 rounded-lg bg-slate-900 border-2 border-amber-600 shadow-[2px_2px_0_rgba(0,0,0,0.5)] flex items-center justify-center active:translate-y-0.5 active:shadow-none transition-all", isTiltMismatch && "opacity-30 grayscale cursor-not-allowed")}>
                <span className="text-[6px] font-bold text-amber-500 leading-tight text-center uppercase">Max<br/>Bet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
