import React, { useState } from 'react';
import { Calculator, FileText, ArrowLeft, ShieldCheck } from 'lucide-react';

interface StealthDecoyViewProps {
  onExitStealth: () => void;
}

export function StealthDecoyView({ onExitStealth }: StealthDecoyViewProps) {
  const [activeTab, setActiveTab] = useState<'calc' | 'notes'>('calc');
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcFormula, setCalcFormula] = useState('');
  const [notes, setNotes] = useState(
    'Meeting Agenda - Q3 Logistics\n- Review hardware budget\n- Server migration checklist\n- Update operational timeline'
  );

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcFormula('');
      return;
    }
    if (val === '=') {
      try {
        // Safe standard arithmetic calculation
        const sanitized = (calcFormula + calcDisplay).replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        setCalcDisplay(String(res));
        setCalcFormula('');
      } catch {
        setCalcDisplay('Error');
      }
      return;
    }
    if (['+', '-', '*', '/'].includes(val)) {
      setCalcFormula(calcFormula + calcDisplay + ' ' + val + ' ');
      setCalcDisplay('0');
      return;
    }
    if (calcDisplay === '0') {
      setCalcDisplay(val);
    } else {
      setCalcDisplay(calcDisplay + val);
    }
  };

  return (
    <div
      id="stealth-decoy-screen"
      className="fixed inset-0 z-50 bg-zinc-100 text-zinc-800 flex flex-col font-sans select-none"
    >
      {/* Decoy Top Bar */}
      <div className="bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-700 font-semibold text-sm">
            {activeTab === 'calc' ? (
              <Calculator className="w-4 h-4 text-zinc-500" />
            ) : (
              <FileText className="w-4 h-4 text-zinc-500" />
            )}
            <span>Standard Office Utilities</span>
          </div>

          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
            <button
              id="decoy-tab-calc"
              onClick={() => setActiveTab('calc')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'calc'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Calculator
            </button>
            <button
              id="decoy-tab-notes"
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'notes'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Scratchpad
            </button>
          </div>
        </div>

        {/* Discreet Return Trigger */}
        <button
          id="exit-stealth-btn"
          onClick={onExitStealth}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition-colors"
          title="Return to Secure Vault"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Decoy</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50">
        {activeTab === 'calc' ? (
          <div
            id="decoy-calculator-app"
            className="w-full max-w-xs bg-white rounded-2xl border border-zinc-200 shadow-sm p-4"
          >
            <div className="text-right px-2 py-4 border-b border-zinc-100 mb-3 min-h-[80px] flex flex-col justify-end">
              <div className="text-xs text-zinc-400 font-mono h-4">{calcFormula}</div>
              <div className="text-3xl font-mono font-semibold text-zinc-900 tracking-tight overflow-hidden text-ellipsis">
                {calcDisplay}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm font-medium">
              {['C', '(', ')', '/'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleCalcClick(k)}
                  className="h-12 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                >
                  {k}
                </button>
              ))}
              {['7', '8', '9', '*'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleCalcClick(k)}
                  className={`h-12 rounded-xl transition-colors ${
                    k === '*'
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-900'
                  }`}
                >
                  {k}
                </button>
              ))}
              {['4', '5', '6', '-'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleCalcClick(k)}
                  className={`h-12 rounded-xl transition-colors ${
                    k === '-'
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-900'
                  }`}
                >
                  {k}
                </button>
              ))}
              {['1', '2', '3', '+'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleCalcClick(k)}
                  className={`h-12 rounded-xl transition-colors ${
                    k === '+'
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-900'
                  }`}
                >
                  {k}
                </button>
              ))}
              <button
                onClick={() => handleCalcClick('0')}
                className="col-span-2 h-12 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 transition-colors"
              >
                0
              </button>
              <button
                onClick={() => handleCalcClick('.')}
                className="h-12 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 transition-colors"
              >
                .
              </button>
              <button
                onClick={() => handleCalcClick('=')}
                className="h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
              >
                =
              </button>
            </div>
          </div>
        ) : (
          <div
            id="decoy-notepad-app"
            className="w-full max-w-xl h-[420px] bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 flex flex-col"
          >
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Personal Notes
            </div>
            <textarea
              id="decoy-notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full flex-1 resize-none border-none outline-none text-sm text-zinc-800 leading-relaxed font-mono"
            />
          </div>
        )}
      </div>

      {/* Decoy Status Bar */}
      <div className="bg-white border-t border-zinc-200 px-6 py-2 text-[11px] text-zinc-400 flex items-center justify-between">
        <span>Ready • Memory Usage: 14.2 MB</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          System Operational
        </span>
      </div>
    </div>
  );
}
