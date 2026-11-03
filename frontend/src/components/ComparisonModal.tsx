import React from 'react';
import { X, Check, Minus, Sparkles, ArrowRight } from 'lucide-react';
import { InsurancePlan } from '../types';

interface ComparisonModalProps {
  plans: InsurancePlan[];
  onClose: () => void;
  onRemovePlan: (planId: string) => void;
  onSelectPlan: (plan: InsurancePlan) => void;
}

const COMPARISON_ADDONS = [
  { code: 'ZERO_DEP', label: 'Zero Depreciation' },
  { code: 'RSA', label: 'Roadside Assistance' },
  { code: 'ENGINE_PROTECT', label: 'Engine & Gearbox Protection' },
  { code: 'CONSUMABLES', label: 'Consumables Cover' },
  { code: 'RETURN_TO_INVOICE', label: 'Return to Invoice' },
  { code: 'KEY_REPLACEMENT', label: 'Key Replacement' },
];

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  plans,
  onClose,
  onRemovePlan,
  onSelectPlan,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (plans.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Side-by-Side Plan Comparison</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing {plans.length} selected insurance plans across price, coverage, and add-on protection.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="p-5 sm:p-6 overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-1/4">
                  Feature / Attribute
                </th>
                {plans.map((p) => (
                  <th key={p.id} className="py-3 px-4 w-1/4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                          {p.provider}
                        </span>
                        <span className="text-base font-extrabold text-slate-900 block">
                          {p.plan_name}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemovePlan(p.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {/* Total Premium */}
              <tr className="bg-blue-50/40">
                <td className="py-3.5 px-4 font-bold text-slate-800">
                  Total Premium (incl. GST)
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 font-black text-slate-900 font-mono text-base">
                    {formatCurrency(p.total_premium)}
                  </td>
                ))}
              </tr>

              {/* IDV */}
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-700">
                  Insured Declared Value (IDV)
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-bold font-mono text-slate-800">
                    {p.idv > 0 ? formatCurrency(p.idv) : 'Third Party Only'}
                  </td>
                ))}
              </tr>

              {/* Value Score */}
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-700">
                  AutoCover Value Score
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3 px-4">
                    <span className="font-extrabold text-blue-700 font-mono text-sm">
                      {p.value_score} / 100
                    </span>
                    {p.badge && (
                      <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {p.badge}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Coverage Type */}
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-700">
                  Coverage Type
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-medium text-slate-800">
                    {p.coverage_type}
                  </td>
                ))}
              </tr>

              {/* Add-ons Matrix */}
              <tr className="bg-slate-50 font-bold text-slate-900 text-xs uppercase tracking-wider">
                <td colSpan={plans.length + 1} className="py-2.5 px-4">
                  Add-on Protection Breakdown
                </td>
              </tr>

              {COMPARISON_ADDONS.map((addon) => (
                <tr key={addon.code}>
                  <td className="py-2.5 px-4 font-medium text-slate-700">
                    {addon.label}
                  </td>
                  {plans.map((p) => {
                    const hasAddon = p.addons.some((a) => a.code === addon.code);
                    return (
                      <td key={p.id} className="py-2.5 px-4">
                        {hasAddon ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <Check className="w-4 h-4" /> Included
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Minus className="w-4 h-4" /> Not Included
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Quote Validity */}
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-700">
                  Quote Validity
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3 px-4">
                    {p.is_expired ? (
                      <span className="text-rose-600 font-bold">Expired ({p.valid_until})</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Valid till {p.valid_until}</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Selection CTAs */}
              <tr className="bg-slate-50/50">
                <td className="py-4 px-4 font-bold text-slate-800">Select Plan</td>
                {plans.map((p) => (
                  <td key={p.id} className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => onSelectPlan(p)}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                    >
                      <span>Choose Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
