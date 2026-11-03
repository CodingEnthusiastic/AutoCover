import React from 'react';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Server, Zap, ShieldX } from 'lucide-react';
import { ProviderStatus } from '../types';

interface ProviderProgressProps {
  providers: ProviderStatus[];
  isLoading: boolean;
  onRetryProviderD: () => void;
  simulateFailD: boolean;
  setSimulateFailD: (fail: boolean) => void;
}

export const ProviderProgress: React.FC<ProviderProgressProps> = ({
  providers,
  isLoading,
  onRetryProviderD,
  simulateFailD,
  setSimulateFailD,
}) => {
  const getProviderMeta = (name: string) => {
    switch (name) {
      case 'Provider A':
        return {
          format: 'REST API (JSON)',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          desc: 'Fast JSON quote response',
        };
      case 'Provider B':
        return {
          format: 'HTML + JS Hydration',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          desc: 'Simulated slow provider (1.5s latency)',
        };
      case 'Provider C':
        return {
          format: 'PDF Rate Card Engine',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          desc: 'India Motor Tariff formula & model group rules',
        };
      case 'Provider D':
        return {
          format: 'CSV Quote Export',
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          desc: 'Deduplicated CSV with 503 fault tolerance',
        };
      default:
        return { format: 'Unknown', badgeColor: 'bg-slate-50 text-slate-700 border-slate-200', desc: '' };
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <span>Multi-Provider Collection Status</span>
          </h3>
          <p className="text-xs text-slate-500">
            AutoCover queries independent provider services concurrently and isolates slow or failing endpoints.
          </p>
        </div>

        {/* Fault Tolerance Simulation Switch */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-semibold text-slate-700">Simulate Provider D 503 Outage:</span>
          <button
            type="button"
            onClick={() => setSimulateFailD(!simulateFailD)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              simulateFailD ? 'bg-red-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                simulateFailD ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4 Provider Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {providers.map((p) => {
          const meta = getProviderMeta(p.provider);
          return (
            <div
              key={p.provider}
              className={`p-3.5 rounded-xl border transition-all ${
                p.status === 'success'
                  ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  : p.status === 'failed' || p.status === 'timeout'
                  ? 'bg-red-50/50 border-red-200'
                  : p.status === 'declined'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-900">{p.provider}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}>
                  {meta.format}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 mb-2.5 truncate">{meta.desc}</p>

              {/* Status pill & latency */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                {isLoading ? (
                  <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                    <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span>Collecting...</span>
                  </div>
                ) : p.status === 'success' ? (
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{p.plan_count} {p.plan_count === 1 ? 'plan' : 'plans'} found</span>
                  </div>
                ) : p.status === 'declined' ? (
                  <div className="flex items-center gap-1 text-amber-700 font-semibold text-xs">
                    <ShieldX className="w-3.5 h-3.5" />
                    <span>Declined (criteria)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Failed / Outage</span>
                  </div>
                )}

                {p.latency_ms > 0 && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {p.latency_ms}ms
                  </span>
                )}
              </div>

              {/* Failure Error / Retry */}
              {(p.status === 'failed' || p.status === 'timeout') && !isLoading && (
                <div className="mt-2 pt-2 border-t border-red-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-red-700 truncate max-w-[140px]" title={p.error_message || ''}>
                    {p.error_message || 'Service down'}
                  </span>
                  {p.provider === 'Provider D' && (
                    <button
                      type="button"
                      onClick={onRetryProviderD}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
