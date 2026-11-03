import React from 'react';
import { ShieldCheck, Check, Sparkles, AlertTriangle, ShieldX, Info } from 'lucide-react';
import { InsurancePlan } from '../types';

interface PlanCardProps {
  plan: InsurancePlan;
  onSelect: (plan: InsurancePlan) => void;
  onToggleCompare: (plan: InsurancePlan) => void;
  isCompared: boolean;
  canCompareMore: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onSelect,
  onToggleCompare,
  isCompared,
  canCompareMore,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const isDeclined = plan.status === 'DECLINED';
  const isExpired = plan.is_expired || plan.status === 'EXPIRED';

  if (isDeclined) {
    return (
      <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 opacity-75 relative">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm text-slate-700">{plan.provider}</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            Declined
          </span>
        </div>
        <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-200">
          <ShieldX className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 block mb-0.5">Underwriting Criteria Not Met</span>
            <p>{plan.decline_reason || 'Provider does not offer coverage for this vehicle specification or age.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all duration-200 flex flex-col justify-between relative shadow-sm hover:shadow-md ${
        isExpired
          ? 'border-amber-200 bg-amber-50/15'
          : plan.badge?.includes('Best Value')
          ? 'border-blue-400 ring-2 ring-blue-500/10'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Header: Provider & Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                {plan.provider}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {plan.coverage_type}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {plan.plan_name}
            </h3>
          </div>

          {/* Badges */}
          {plan.badge && (
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm ${
                plan.badge.includes('Best Value')
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : plan.badge.includes('Lowest Price')
                  ? 'bg-emerald-600 text-white'
                  : 'bg-purple-600 text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {plan.badge}
            </span>
          )}
        </div>

        {/* Value Score Meter & IDV */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Insured Value (IDV)</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              {plan.idv > 0 ? formatCurrency(plan.idv) : 'Third Party Only'}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-500">Value Score</span>
              <span className="text-xs font-bold text-blue-700">{plan.value_score}/100</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  plan.value_score >= 80
                    ? 'bg-blue-600'
                    : plan.value_score >= 60
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, plan.value_score))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(plan.total_premium)}
            </span>
            <span className="text-xs font-medium text-slate-500">incl. 18% GST</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Net Premium: {formatCurrency(plan.base_premium)} + GST: {formatCurrency(plan.gst_amount)}
          </p>
        </div>

        {/* Included Add-ons */}
        <div className="space-y-1.5 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Add-ons Included ({plan.addons.length}):
          </span>
          {plan.addons.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {plan.addons.map((a) => (
                <span
                  key={a.code}
                  title={`${a.description} (Provider term: "${a.raw_name}")`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200/60"
                >
                  <Check className="w-3 h-3 text-blue-600" />
                  <span>{a.name}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No add-ons included in this basic tier.</p>
          )}
        </div>

        {/* Key Plan Benefits */}
        {plan.benefits.length > 0 && (
          <ul className="space-y-1 text-xs text-slate-600 mb-4 pt-3 border-t border-slate-100">
            {plan.benefits.slice(0, 3).map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Validity Warning if Expired */}
        {isExpired && (
          <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-medium flex items-center gap-1.5 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Quote expired on {plan.valid_until || 'prior date'} (Reference date: 10 Nov 2026).
            </span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <label
          className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none ${
            !isCompared && !canCompareMore ? 'opacity-40 cursor-not-allowed text-slate-400' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <input
            type="checkbox"
            checked={isCompared}
            disabled={!isCompared && !canCompareMore}
            onChange={() => onToggleCompare(plan)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <span>Compare</span>
        </label>

        <button
          type="button"
          onClick={() => onSelect(plan)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
            isExpired
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:translate-y-[-1px]'
          }`}
        >
          <span>Choose Plan</span>
        </button>
      </div>
    </div>
  );
};
