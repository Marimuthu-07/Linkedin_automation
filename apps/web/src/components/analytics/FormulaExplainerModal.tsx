import React from 'react';
import { HelpCircle, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { OFFICIAL_METRIC_DEFINITIONS, MetricDefinition } from '@linkedin-growth/shared';

interface FormulaExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaExplainerModal: React.FC<FormulaExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Analytics Engine & Metric Definitions"
      description="Transparent, mathematical definitions for every metric and ratio used across the assistant."
    >
      <div className="space-y-6 text-xs text-slate-300 max-h-[70vh] overflow-y-auto pr-1">
        {/* Provenance Alert */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Zero-Scraping & Local Data Provenance</span>
          </div>
          <p className="leading-relaxed text-slate-300">
            All analytics in this dashboard are generated exclusively from your local PostgreSQL database (your manually recorded snapshots, published post metrics, and pipeline records). We strictly avoid unauthorized scraping, browser automation, or simulated AI scores.
          </p>
        </div>

        {/* Metric Cards List */}
        <div className="space-y-4">
          {Object.entries(OFFICIAL_METRIC_DEFINITIONS).map(([key, def]: [string, MetricDefinition]) => (
            <div key={key} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm font-heading">{def.name}</span>
                <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 font-mono text-[10px] text-indigo-300 uppercase">
                  {def.metricType}
                </span>
              </div>

              <div className="rounded-lg bg-slate-900 border border-slate-800 p-2.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Mathematical Formula:</span>
                <code className="text-indigo-300 font-mono text-xs block break-all">
                  {def.formula}
                </code>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 font-medium">Numerator: </span>
                  <span className="text-slate-200">{def.numerator}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Denominator: </span>
                  <span className="text-slate-200">{def.denominator}</span>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-400 flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-300">Division by Zero:</strong> {def.nullHandling}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 text-xs"
          >
            Close Definitions
          </button>
        </div>
      </div>
    </Modal>
  );
};
