import { useState, useMemo, useEffect, useCallback } from 'react';
import { AWPFeature } from '../types';
import { parseCurrency, formatBalance as fmtBal, formatRawAmount as fmtRaw } from '../utils';

/** 模擬器 hook：管理 AWP 機台預覽的所有狀態 */
export function useSimulator(features: AWPFeature[]) {
  const [balanceCents, setBalanceCents] = useState(50000);
  const [lastWinCents, setLastWinCents] = useState(0);
  const [currentBetCredits, setCurrentBetCredits] = useState(5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const [activeVoucher, setActiveVoucher] = useState<{ amount: number, id: string, time: string } | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [vfdMessage, setVfdMessage] = useState('Insert Bill To Play');
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [isVfdPulsing, setIsVfdPulsing] = useState(true);
  const [showDenomPanel, setShowDenomPanel] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.7);

  const addNotification = useCallback((message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  }, []);

  const recordInteraction = useCallback(() => setLastInteractionTime(Date.now()), []);

  const sbcoFeature = useMemo(() => features.find(f => f.id === 'SpinBeforeCashout'), [features]);
  const currentDenomValue = useMemo(() => {
    const denomStr = features.find(f => f.id === 'game1_denoms')?.selectedOption || '$1.00';
    return parseCurrency(denomStr);
  }, [features]);
  const displayFormat = useMemo(() => features.find(f => f.id === 'DisplayFormat')?.selectedOption || 'Dollar', [features]);
  const currencySymbol = useMemo(() => features.find(f => f.id === 'CurrencySymbol')?.selectedOption || '$', [features]);

  const formatBalance = useCallback((cents: number) => fmtBal(cents, displayFormat, currentDenomValue, currencySymbol), [displayFormat, currentDenomValue, currencySymbol]);
  const formatRawAmount = useCallback((amount: number) => fmtRaw(amount, displayFormat, currentDenomValue, currencySymbol), [displayFormat, currentDenomValue, currencySymbol]);

  const credits = useMemo(() => Math.floor(balanceCents / (currentDenomValue * 100)), [balanceCents, currentDenomValue]);
  const winCredits = useMemo(() => Math.floor(lastWinCents / (currentDenomValue * 100)), [lastWinCents, currentDenomValue]);
  const totalBetAmount = useMemo(() => currentBetCredits * currentDenomValue, [currentBetCredits, currentDenomValue]);
  const maxPlayAmount = useMemo(() => parseCurrency(features.find(f => f.id === 'MaxPlay')?.selectedOption || '$5.00'), [features]);
  const minPlayAmount = useMemo(() => parseCurrency(features.find(f => f.id === 'MinPlay')?.selectedOption || '$0.00'), [features]);
  const isTiltMismatch = useMemo(() => minPlayAmount > maxPlayAmount, [minPlayAmount, maxPlayAmount]);

  const minPlayForGrandFeature = useMemo(() => features.find(f => f.id === 'JpMinBetForJp'), [features]);
  const minPlayForGrand = useMemo(() => parseCurrency(minPlayForGrandFeature?.selectedOption || '$0.25'), [minPlayForGrandFeature]);
  const isGrandEligible = useMemo(() => {
    if (minPlayForGrandFeature && !minPlayForGrandFeature.enabled) return true;
    return totalBetAmount >= minPlayForGrand;
  }, [totalBetAmount, minPlayForGrand, minPlayForGrandFeature]);

  const grandJackpotDisplayValue = useMemo(() => {
    const rangeStr = features.find(f => f.id === 'JpMinMaxInfo')?.selectedOption || '$1000.00 ~ $2000.00';
    return formatRawAmount(parseCurrency(rangeStr));
  }, [features, formatRawAmount]);
  const majorJackpotDisplayValue = useMemo(() => {
    const rangeStr = features.find(f => f.id === 'JpMinMaxInfo_Major')?.selectedOption || '$500.00 ~ $1500.00';
    return formatRawAmount(parseCurrency(rangeStr));
  }, [features, formatRawAmount]);
  const miniJackpotValue = useMemo(() => formatRawAmount(1000 * currentDenomValue), [currentDenomValue, formatRawAmount]);
  const minorJackpotValue = useMemo(() => formatRawAmount(5000 * currentDenomValue), [currentDenomValue, formatRawAmount]);

  // 自動調整投注額
  useEffect(() => {
    if (!isTiltMismatch && totalBetAmount > maxPlayAmount) {
      const bets = [5, 10, 15, 25, 50];
      const validBets = bets.filter(b => b * currentDenomValue <= maxPlayAmount);
      if (validBets.length > 0) setCurrentBetCredits(Math.max(...validBets));
      else if (bets.length > 0) setCurrentBetCredits(bets[0]);
    }
  }, [maxPlayAmount, currentDenomValue, totalBetAmount, isTiltMismatch]);

  // 閒置重置
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastInteractionTime > 5000 && hasSpun) {
        setHasSpun(false);
        setVfdMessage('IDLE RESET: SPIN AGAIN');
        setTimeout(() => setVfdMessage('INSERT BILL TO PLAY'), 3000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastInteractionTime, hasSpun]);

  const handlePreviewSpin = useCallback(() => {
    if (isSpinning) return;
    recordInteraction();
    const betCents = totalBetAmount * 100;
    if (balanceCents < betCents) { setVfdMessage('INSUFFICIENT FUNDS'); return; }
    setIsSpinning(true);
    setBalanceCents(prev => prev - betCents);
    setVfdMessage('GOOD LUCK!');
    setTimeout(() => {
      setHasSpun(true);
      setIsSpinning(false);
      const chanceLevel = features.find(f => f.id === 'ChanceLevel')?.selectedOption || 'Medium';
      const odds: Record<string, number> = { 'Worse': 0.1, 'Bad': 0.2, 'Medium': 0.3, 'Good': 0.4, 'Best': 0.5 };
      if (Math.random() < (odds[chanceLevel] || 0.3)) {
        const multiplier = [2, 3, 5, 10, 20][Math.floor(Math.random() * 5)];
        const winAmount = betCents * multiplier;
        setBalanceCents(prev => prev + winAmount);
        setLastWinCents(winAmount);
        setVfdMessage(`BIG WIN: ${fmtBal(winAmount, displayFormat, currentDenomValue, currencySymbol)}`);
      } else {
        setLastWinCents(0);
        setVfdMessage('TRY AGAIN');
      }
      setTimeout(() => setVfdMessage('INSERT BILL TO PLAY'), 2000);
    }, 1500);
  }, [isSpinning, totalBetAmount, balanceCents, features, displayFormat, currentDenomValue, currencySymbol, recordInteraction]);

  const handlePreviewCashout = useCallback(() => {
    recordInteraction();
    const isSbcoEnabled = sbcoFeature?.enabled && sbcoFeature?.selectedOption === 'ON';
    if (isSbcoEnabled && !hasSpun) {
      setVfdMessage('SPIN BEFORE CASHOUT!');
      setIsVfdPulsing(true);
      setTimeout(() => setVfdMessage('PLAY 1 SPIN TO CASH OUT'), 2500);
      return;
    }
    if (balanceCents <= 0) { setVfdMessage('NO ZERO BALANCE CASHOUT'); return; }
    const isLimitEnabled = features.find(f => f.id === 'CashoutLimit')?.selectedOption === 'ON';
    const limitAmount = parseCurrency(features.find(f => f.id === 'CashoutLimitAmount')?.selectedOption || '10') * 100;
    if (isLimitEnabled && balanceCents > limitAmount) {
      setVfdMessage('LIMIT EXCEEDED: CALL ATTENDANT');
      addNotification('觸發出金上限提示：請呼叫服務人員處理溢出金額。');
      return;
    }
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
  }, [sbcoFeature, hasSpun, balanceCents, features, addNotification, recordInteraction]);

  return {
    balanceCents, setBalanceCents, lastWinCents, currentBetCredits, setCurrentBetCredits,
    isSpinning, notifications, activeVoucher, setActiveVoucher,
    hasSpun, vfdMessage, isVfdPulsing, showDenomPanel, setShowDenomPanel,
    previewScale, setPreviewScale,
    sbcoFeature, currentDenomValue, displayFormat, credits, winCredits,
    totalBetAmount, maxPlayAmount, minPlayAmount, isTiltMismatch,
    isGrandEligible, grandJackpotDisplayValue, majorJackpotDisplayValue,
    miniJackpotValue, minorJackpotValue, minPlayForGrand,
    formatBalance, formatRawAmount, addNotification, recordInteraction,
    handlePreviewSpin, handlePreviewCashout,
  };
}
