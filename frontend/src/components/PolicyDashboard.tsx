import React, { useState } from 'react';
import { FileCheck, ShieldAlert, Bell, CheckCircle2, Car, Calendar, ExternalLink } from 'lucide-react';
import { Policy } from '../types';

interface PolicyDashboardProps {
  policies: Policy[];
  onSendReminder: (policyId: string) => Promise<{ message: string }>;
  onGoToCompare: () => void;
}

export const PolicyDashboard: React.FC<PolicyDashboardProps> = ({
  policies,
  onSendReminder,
  onGoToCompare,
}) => {
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleTriggerReminder = async (id: string) => {
    setSendingId(id);
    try {
      const res = await onSendReminder(id);
      setNotificationMsg(res.message);
      setTimeout(() => setNotificationMsg(null), 8000);
    } catch (e: any) {
      alert(e.message || 'Failed to dispatch reminder');
    } finally {
      setSendingId(null);
    }
  };

  const expiringSoonCount = policies.filter((p) => p.is_expiring_soon).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-blue-600" />
            <span>Policy Dashboard & Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your active insurance policies, monitor upcoming expirations, and test automated renewal alerts.
          </p>
        </div>

        <button
          onClick={onGoToCompare}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 self-start sm:self-auto"
        >
          <span>Find Quotes for Another Car</span>
        </button>
      </div>

      {/* Simulated Notification Toast */}
      {notificationMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold block mb-0.5">Mock Notification Triggered:</span>
            <p className="font-mono text-xs text-emerald-800">{notificationMsg}</p>
          </div>
        </div>
      )}

      {/* Expiring Soon Warning Banner */}
      {expiringSoonCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              <strong>{expiringSoonCount} policy expiring within 15 days!</strong> Renew promptly to avoid vehicle inspection and loss of accumulated No Claim Bonus (NCB).
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-950 font-bold text-xs uppercase">
            Action Needed
          </span>
        </div>
      )}

      {/* Policies List */}
      {policies.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Policies Saved Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Enter a registration number on the comparison page and choose an insurance plan to save it to your portfolio.
          </p>
          <button
            onClick={onGoToCompare}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Start Comparison
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((policy) => {
            return (
              <div
                key={policy.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-sm ${
                  policy.is_expiring_soon
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Policy Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                      {policy.policy_number}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
                      {policy.provider} · {policy.plan_name}
                    </h3>
                  </div>

                  {policy.is_expiring_soon ? (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      Expires in {policy.days_to_expiry}d
                    </span>
                  ) : policy.is_expired ? (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-red-100 text-red-900 border border-red-300">
                      Expired
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  )}
                </div>

                {/* Vehicle & Customer Info */}
                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Insured Vehicle:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {policy.registration_number} {policy.make && `(${policy.make} ${policy.model})`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Policyholder:</span>
                    <span className="font-medium text-slate-800">
                      {policy.customer_name} ({policy.customer_phone})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Coverage (IDV):</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {policy.idv > 0 ? formatCurrency(policy.idv) : 'Third Party'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total Premium:</span>
                    <span className="font-extrabold text-blue-700 font-mono text-sm">
                      {formatCurrency(policy.total_premium)} (incl. GST)
                    </span>
                  </div>
                </div>

                {/* Validity Dates */}
                <div className="flex items-center justify-between py-2.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Valid: {policy.start_date} to {policy.expiry_date}</span>
                  </div>
                </div>

                {/* Renewal Reminder CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    {policy.reminder_sent ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Reminder Alert Sent
                      </span>
                    ) : (
                      <span>No renewal alert sent yet</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={sendingId === policy.id}
                    onClick={() => handleTriggerReminder(policy.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    <span>{sendingId === policy.id ? 'Sending...' : 'Send Mock Reminder'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
