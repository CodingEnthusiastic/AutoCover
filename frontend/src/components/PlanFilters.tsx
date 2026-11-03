import React from 'react';
import { Filter, ArrowUpDown, CheckSquare, Square, X } from 'lucide-react';

interface FiltersState {
  provider: string;
  coverageType: string;
  requiredAddons: string[];
  hideExpired: boolean;
  sortBy: 'smart' | 'price_asc' | 'price_desc' | 'idv_desc';
}

interface PlanFiltersProps {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  totalPlans: number;
  availablePlansCount: number;
}

const ADDON_OPTIONS = [
  { code: 'ZERO_DEP', label: 'Zero Depreciation' },
  { code: 'RSA', label: 'Roadside Assistance' },
  { code: 'ENGINE_PROTECT', label: 'Engine Protection' },
  { code: 'CONSUMABLES', label: 'Consumables Cover' },
  { code: 'RETURN_TO_INVOICE', label: 'Return to Invoice' },
  { code: 'KEY_REPLACEMENT', label: 'Key Replacement' },
];

export const PlanFilters: React.FC<PlanFiltersProps> = ({
  filters,
  setFilters,
  totalPlans,
  availablePlansCount,
}) => {
  const toggleAddon = (code: string) => {
    setFilters((prev) => {
      const exists = prev.requiredAddons.includes(code);
      return {
        ...prev,
        requiredAddons: exists
          ? prev.requiredAddons.filter((c) => c !== code)
          : [...prev.requiredAddons, code],
      };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      provider: 'ALL',
      coverageType: 'ALL',
      requiredAddons: [],
      hideExpired: true,
      sortBy: 'smart',
    });
  };

  const hasActiveFilters =
    filters.provider !== 'ALL' ||
    filters.coverageType !== 'ALL' ||
    filters.requiredAddons.length > 0 ||
    !filters.hideExpired ||
    filters.sortBy !== 'smart';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900">
            Filters & Sorting
          </h4>
          <span className="text-xs text-slate-500 font-medium">
            (Showing {availablePlansCount} of {totalPlans} plans)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">Sort By:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="smart">Value Score (Smart Pick)</option>
              <option value="price_asc">Price: Lowest to Highest</option>
              <option value="price_desc">Price: Highest to Lowest</option>
              <option value="idv_desc">IDV: Highest to Lowest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Provider Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Insurance Provider
          </label>
          <select
            value={filters.provider}
            onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Providers (A, B, C, D)</option>
            <option value="Provider A">Provider A</option>
            <option value="Provider B">Provider B</option>
            <option value="Provider C">Provider C</option>
            <option value="Provider D">Provider D</option>
          </select>
        </div>

        {/* Coverage Type Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Coverage Type
          </label>
          <select
            value={filters.coverageType}
            onChange={(e) => setFilters({ ...filters, coverageType: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Coverage Types</option>
            <option value="ZERO_DEP">Zero Depreciation / Nil Dep</option>
            <option value="COMPREHENSIVE">Comprehensive</option>
            <option value="THIRD_PARTY">Third Party Only</option>
          </select>
        </div>

        {/* Expired Toggle */}
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all">
            <input
              type="checkbox"
              checked={filters.hideExpired}
              onChange={(e) => setFilters({ ...filters, hideExpired: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-800">
              Hide Expired Quotes (relative to 10 Nov 2026)
            </span>
          </label>
        </div>
      </div>

      {/* Must-Have Add-on Quick Toggles */}
      <div className="pt-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Filter by Must-Have Add-on Covers:
        </label>
        <div className="flex flex-wrap gap-2">
          {ADDON_OPTIONS.map((addon) => {
            const isSelected = filters.requiredAddons.includes(addon.code);
            return (
              <button
                key={addon.code}
                type="button"
                onClick={() => toggleAddon(addon.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                <span>{addon.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
