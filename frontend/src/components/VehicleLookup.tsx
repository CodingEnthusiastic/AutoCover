import React, { useState } from 'react';
import { Search, Car, Calendar, Fuel, MapPin, ShieldAlert, CheckCircle2, Edit3, ArrowRight, AlertTriangle } from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleLookupProps {
  onSearch: (regNo: string) => Promise<void>;
  vehicle: Vehicle | null;
  onUpdateVehicle: (updated: Partial<Vehicle>) => Promise<void>;
  onProceedToQuotes: () => void;
  isLoading: boolean;
}

const TEST_CUSTOMERS = [
  { name: 'Rahul Sen', reg: 'WB 02 AB 1234', desc: 'Swift VXi (Valid)' },
  { name: 'Priya Nair', reg: 'kl-07-de-3030', desc: 'Swift ZXi' },
  { name: 'Arjun Mehta', reg: 'MH12 EF 4321', desc: 'Nexon Diesel' },
  { name: 'Sanjay Gupta', reg: 'wb06cd5678', desc: 'i20 (>10 yrs)' },
  { name: 'Fatima Khan', reg: 'DL 3C AB 0042', desc: 'Creta (1 Claim)' },
  { name: 'Unregistered', reg: 'WB02AB9999', desc: 'Custom Car' },
];

export const VehicleLookup: React.FC<VehicleLookupProps> = ({
  onSearch,
  vehicle,
  onUpdateVehicle,
  onProceedToQuotes,
  isLoading,
}) => {
  const [regInput, setRegInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Vehicle>>({});

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (regInput.trim()) {
      onSearch(regInput.trim());
    }
  };

  const handleQuickPick = (reg: string) => {
    setRegInput(reg);
    onSearch(reg);
  };

  const startEdit = () => {
    if (!vehicle) return;
    setEditForm({
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      fuel_type: vehicle.fuel_type,
      engine_cc: vehicle.engine_cc,
      rto: vehicle.rto,
      ncb_percent: vehicle.ncb_percent,
      ex_showroom_price: vehicle.ex_showroom_price,
      registration_date: vehicle.registration_date,
    });
    setIsEditing(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateVehicle(editForm);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Input Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
            <Car className="w-3.5 h-3.5" /> Fast 1-Click Aggregation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Compare Car Insurance from 4 Top Providers
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
            Enter your vehicle registration number once. AutoCover extracts live quotes, normalizes complex add-ons, and scores every plan to find your best value.
          </p>

          {/* Form */}
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={regInput}
                onChange={(e) => setRegInput(e.target.value.toUpperCase())}
                placeholder="Enter Reg No. e.g. WB 02 AB 1234 or DL 3C AB 0042"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !regInput.trim()}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Lookup Vehicle</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Pick Test Cases */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <span>Try sample test customers:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEST_CUSTOMERS.map((tc) => (
                <button
                  key={tc.reg}
                  type="button"
                  onClick={() => handleQuickPick(tc.reg)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <span className="text-blue-400 font-sans font-semibold">{tc.name}:</span>
                  <span>{tc.reg}</span>
                  <span className="text-[10px] text-slate-400 font-sans">({tc.desc})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verified Vehicle Details Card */}
      {vehicle && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-4">
              {/* Indian License Plate Display */}
              <div className="ind-number-plate px-3 py-1.5 bg-amber-50/50">
                <div className="ind-tag mr-2">
                  <span>🇮🇳</span>
                  <span>IND</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-wider">
                  {vehicle.registration_number}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {vehicle.make} {vehicle.model}
                  <span className="text-sm font-semibold text-slate-500 font-sans">
                    {vehicle.variant}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {vehicle.is_registered ? 'Verified from Vehicle Registry' : 'Unregistered vehicle (custom draft)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startEdit}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Details</span>
              </button>

              <button
                type="button"
                onClick={onProceedToQuotes}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
              >
                <span>Proceed to Quotes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Vehicle Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Fuel className="w-3.5 h-3.5 text-blue-600" />
                <span>Fuel & Engine</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {vehicle.fuel_type || 'Petrol'} · {vehicle.engine_cc || 1197} cc
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Registered RTO</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {vehicle.rto || 'Regional Office'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Registration Date</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {vehicle.registration_date || 'N/A'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>NCB / Claims</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {vehicle.ncb_percent}% NCB · {vehicle.claims_last_year} claims
              </div>
            </div>
          </div>

          {/* Expiry Warning Alert Banner */}
          {vehicle.current_policy_expiry && (
            <div className="mt-4 pt-3">
              {vehicle.expiry_status === 'EXPIRED' && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>
                      Existing policy expired on <strong>{vehicle.current_policy_expiry}</strong>. Renew immediately to prevent break-in penalty and loss of NCB.
                    </span>
                  </div>
                  <span className="font-bold px-2 py-0.5 rounded bg-red-200 text-red-900 text-xs uppercase">
                    Expired
                  </span>
                </div>
              )}

              {vehicle.expiry_status === 'EXPIRING_SOON' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      Policy expiring soon on <strong>{vehicle.current_policy_expiry}</strong> ({vehicle.days_to_expiry} days remaining). Compare renewal plans below.
                    </span>
                  </div>
                  <span className="font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-950 text-xs">
                    Expiring in {vehicle.days_to_expiry}d
                  </span>
                </div>
              )}

              {vehicle.expiry_status === 'ACTIVE' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Current policy is active until <strong>{vehicle.current_policy_expiry}</strong> ({vehicle.days_to_expiry} days left).
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Verify & Correct Vehicle Details</h3>
            <p className="text-xs text-slate-500 mb-4">
              Update any information that differs from your RC document. This affects your IDV and calculated premiums.
            </p>

            <form onSubmit={saveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Make</label>
                  <input
                    type="text"
                    value={editForm.make || ''}
                    onChange={(e) => setEditForm({ ...editForm, make: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={editForm.model || ''}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Variant</label>
                  <input
                    type="text"
                    value={editForm.variant || ''}
                    onChange={(e) => setEditForm({ ...editForm, variant: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type</label>
                  <select
                    value={editForm.fuel_type || 'Petrol'}
                    onChange={(e) => setEditForm({ ...editForm, fuel_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Engine CC</label>
                  <input
                    type="number"
                    value={editForm.engine_cc || 1197}
                    onChange={(e) => setEditForm({ ...editForm, engine_cc: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No Claim Bonus (NCB %)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="5"
                    value={editForm.ncb_percent || 0}
                    onChange={(e) => setEditForm({ ...editForm, ncb_percent: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Date</label>
                  <input
                    type="date"
                    value={editForm.registration_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, registration_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ex-Showroom Price (₹)</label>
                  <input
                    type="number"
                    value={editForm.ex_showroom_price || 650000}
                    onChange={(e) => setEditForm({ ...editForm, ex_showroom_price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20"
                >
                  Save & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
