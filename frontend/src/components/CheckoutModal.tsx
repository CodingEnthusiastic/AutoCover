import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle, Car, User, Phone, Calendar, ArrowRight } from 'lucide-react';
import { InsurancePlan, Vehicle } from '../types';

interface CheckoutModalProps {
  plan: InsurancePlan;
  vehicle: Vehicle;
  onClose: () => void;
  onConfirm: (policyData: any) => Promise<void>;
  isSubmitting: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  plan,
  vehicle,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const [customerName, setCustomerName] = useState('Rahul Sen');
  const [customerPhone, setCustomerPhone] = useState('+91 98300 11111');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    await onConfirm({
      plan_id: plan.id,
      registration_number: vehicle.registration_number,
      customer_name: customerName,
      customer_phone: customerPhone,
      provider: plan.provider,
      plan_name: plan.plan_name,
      coverage_type: plan.coverage_type,
      idv: plan.idv,
      base_premium: plan.base_premium,
      gst_amount: plan.gst_amount,
      total_premium: plan.total_premium,
      addons: plan.addons.map((a) => a.name),
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      fuel_type: vehicle.fuel_type,
      start_date: '2026-11-10',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
              Step 4 · Confirmation
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Review & Issue Policy
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  {plan.provider}
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {plan.plan_name}
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-blue-800 border border-blue-200">
                {plan.coverage_type}
              </span>
            </div>

            <div className="text-xs text-slate-600 flex items-center gap-2 pt-2 border-t border-blue-200/50">
              <Car className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>
                <strong>{vehicle.registration_number}</strong> · {vehicle.make} {vehicle.model} ({vehicle.variant || 'Standard'})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/50 text-xs">
              <div>
                <span className="text-slate-500 block">Cover (IDV):</span>
                <span className="font-bold text-slate-900 font-mono">
                  {plan.idv > 0 ? formatCurrency(plan.idv) : 'Third Party'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Premium:</span>
                <span className="font-bold text-blue-700 font-mono text-sm">
                  {formatCurrency(plan.total_premium)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Details Inputs */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Policyholder Details
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number (for simulated renewal reminders)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 98300 11111"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Policy Start Date */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              Policy duration: <strong>10 Nov 2026</strong> to <strong>09 Nov 2027</strong> (1 Year Comprehensive).
            </span>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 mt-0.5"
            />
            <span>
              I confirm the vehicle details and understand this is a mock insurance platform submission.
            </span>
          </label>

          {/* Footer CTAs */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !agreeTerms}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Confirm & Save Policy</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
