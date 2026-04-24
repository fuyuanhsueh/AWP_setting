import React from 'react';
import { motion } from 'motion/react';
import { AWPFeature } from '../types';

interface VoucherModalProps {
  voucher: { amount: number; id: string; time: string };
  features: AWPFeature[];
  formatBalance: (cents: number) => string;
  onClose: () => void;
}

/** 票據列印預覽 Modal */
export function VoucherModal({ voucher, features, formatBalance, onClose }: VoucherModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 100 }}
        className="relative w-[340px] bg-white text-slate-900 border shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col p-8 font-mono select-none">
        <div className="absolute -top-1 left-0 right-0 h-1 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
        <div className="text-center font-bold text-lg mb-1">{features.find(f => f.id === 'Location')?.selectedOption || 'AWP CASINO'}</div>
        <div className="text-center text-[10px] mb-4 opacity-70">{features.find(f => f.id === 'Address1')?.selectedOption || 'STREET 123'}<br/>MACHINE #{features.find(f => f.id === 'MachineNumber')?.selectedOption || '001'}</div>
        <div className="border-y-2 border-black border-dashed py-4 mb-4 flex flex-col items-center">
          <div className="text-xs uppercase font-bold tracking-widest mb-2">Cash Ticket</div>
          <div className="text-4xl font-black">{formatBalance(voucher.amount * 100)}</div>
          <div className="text-[10px] mt-2 font-bold mb-4">NOT LEGALLY TENDER</div>
          <div className="flex gap-0.5 h-10 w-full bg-slate-100 p-2">
            {Array.from({length: 40}).map((_, i) => (i % 2 === 0 ? <div key={i} className="flex-1 bg-black" style={{ width: `${Math.random() * 2 + 1}px` }}></div> : <div key={i} className="flex-1 bg-transparent"></div>))}
          </div>
          <div className="text-[9px] mt-1 tracking-[0.4em] font-bold">{voucher.id}</div>
        </div>
        <div className="text-[9px] space-y-1 opacity-70">
          <div className="flex justify-between"><span>DATE:</span><span>{voucher.time}</span></div>
          <div className="flex justify-between"><span>VOUCHER #:</span><span>{voucher.id}</span></div>
          <div className="text-center mt-4 italic font-bold">{features.find(f => f.id === 'VoucherMessage1')?.selectedOption || 'THANK YOU FOR PLAYING!'}</div>
        </div>
        <button onClick={onClose} className="mt-8 w-full bg-slate-900 text-white rounded py-3 text-xs font-bold hover:bg-slate-800 transition-colors uppercase tracking-widest">關閉並回收</button>
      </motion.div>
    </div>
  );
}
