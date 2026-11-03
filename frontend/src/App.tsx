import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VehicleLookup } from './components/VehicleLookup';
import { ProviderProgress } from './components/ProviderProgress';
import { PlanFilters } from './components/PlanFilters';
import { PlanCard } from './components/PlanCard';
import { ComparisonModal } from './components/ComparisonModal';
import { CheckoutModal } from './components/CheckoutModal';
import { PolicyDashboard } from './components/PolicyDashboard';
import { GlossaryView } from './components/GlossaryModal';
import {
  fetchVehicle,
  updateVehicle,
  compareQuotes,
  fetchPolicies,
  createPolicy,
  sendRenewalReminder,
  fetchGlossary,
} from './services/api';
import { Vehicle, InsurancePlan, ProviderStatus, Policy, GlossaryResponse } from './types';
import { Shield, Sparkles, Scale, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'compare' | 'policies' | 'glossary'>('compare');
  
  // State
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([
    { provider: 'Provider A', status: 'success', latency_ms: 0, plan_count: 0 },
    { provider: 'Provider B', status: 'success', latency_ms: 0, plan_count: 0 },
    { provider: 'Provider C', status: 'success', latency_ms: 0, plan_count: 0 },
    { provider: 'Provider D', status: 'success', latency_ms: 0, plan_count: 0 },
  ]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [glossaryData, setGlossaryData] = useState<GlossaryResponse | null>(null);

  // Loading & Action states
  const [isSearchingVehicle, setIsSearchingVehicle] = useState(false);
  const [isCollectingQuotes, setIsCollectingQuotes] = useState(false);
  const [isSubmittingPolicy, setIsSubmittingPolicy] = useState(false);
  const [simulateFailD, setSimulateFailD] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Selection
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<InsurancePlan | null>(null);
  const [comparedPlanIds, setComparedPlanIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<{
    provider: string;
    coverageType: string;
    requiredAddons: string[];
    hideExpired: boolean;
    sortBy: 'smart' | 'price_asc' | 'price_desc' | 'idv_desc';
  }>({
    provider: 'ALL',
    coverageType: 'ALL',
    requiredAddons: [],
    hideExpired: true,
    sortBy: 'smart',
  });

  // Initial Load: Fetch policies and glossary
  useEffect(() => {
    loadPolicies();
    loadGlossary();
  }, []);

  const loadPolicies = async () => {
    try {
      const data = await fetchPolicies();
      setPolicies(data);
    } catch (e) {
      console.warn('Failed to fetch policies:', e);
    }
  };

  const loadGlossary = async () => {
    try {
      const data = await fetchGlossary();
      setGlossaryData(data);
    } catch (e) {
      console.warn('Failed to load glossary:', e);
    }
  };

  // Search vehicle by registration number
  const handleSearchVehicle = async (regNo: string) => {
    setIsSearchingVehicle(true);
    setErrorMessage(null);
    try {
      const v = await fetchVehicle(regNo);
      setVehicle(v);
      // Immediately start quote aggregation for user convenience
      await handleCollectQuotes(v, simulateFailD);
    } catch (err: any) {
      setErrorMessage(err.message || 'Vehicle not found');
    } finally {
      setIsSearchingVehicle(false);
    }
  };

  // Update vehicle details
  const handleUpdateVehicle = async (updated: Partial<Vehicle>) => {
    if (!vehicle) return;
    try {
      const newV = await updateVehicle({
        ...updated,
        registration_number: vehicle.registration_number,
      });
      setVehicle(newV);
      // Re-trigger quote collection with updated vehicle specifications
      await handleCollectQuotes(newV, simulateFailD);
    } catch (err: any) {
      alert(err.message || 'Failed to update vehicle');
    }
  };

  // Collect quotes from the 4 providers
  const handleCollectQuotes = async (v: Vehicle, failD: boolean = false) => {
    setIsCollectingQuotes(true);
    setErrorMessage(null);
    try {
      const res = await compareQuotes(v.registration_number, failD);
      setPlans(res.plans);
      setProviders(res.providers);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to collect quotes from providers');
    } finally {
      setIsCollectingQuotes(false);
    }
  };

  const handleRetryProviderD = () => {
    if (!vehicle) return;
    setSimulateFailD(false);
    handleCollectQuotes(vehicle, false);
  };

  // Toggle comparison for a plan
  const handleToggleCompare = (plan: InsurancePlan) => {
    setComparedPlanIds((prev) => {
      if (prev.includes(plan.id)) {
        return prev.filter((id) => id !== plan.id);
      } else {
        if (prev.length >= 3) {
          alert('You can compare a maximum of 3 plans simultaneously.');
          return prev;
        }
        return [...prev, plan.id];
      }
    });
  };

  const handleRemoveComparedPlan = (id: string) => {
    setComparedPlanIds((prev) => prev.filter((pId) => pId !== id));
  };

  // Policy Checkout Confirmation
  const handleConfirmPolicy = async (policyData: any) => {
    setIsSubmittingPolicy(true);
    try {
      const created = await createPolicy(policyData);
      setSelectedPlanForCheckout(null);
      await loadPolicies();
      setActiveTab('policies');
      alert(`Success! Policy ${created.policy_number} has been issued and saved to your dashboard.`);
    } catch (err: any) {
      alert(err.message || 'Failed to save policy');
    } finally {
      setIsSubmittingPolicy(false);
    }
  };

  // Filter & Sort Logic
  const filteredPlans = plans.filter((plan) => {
    // 1. Hide expired filter
    if (filters.hideExpired && (plan.is_expired || plan.status === 'EXPIRED')) {
      return false;
    }
    // 2. Provider filter
    if (filters.provider !== 'ALL' && plan.provider !== filters.provider) {
      return false;
    }
    // 3. Coverage Type filter
    if (filters.coverageType !== 'ALL' && plan.coverage_type !== filters.coverageType) {
      return false;
    }
    // 4. Must-have add-on filters
    if (filters.requiredAddons.length > 0) {
      const planCodes = new Set(plan.addons.map((a) => a.code));
      for (const req of filters.requiredAddons) {
        if (!planCodes.has(req)) return false;
      }
    }
    return true;
  });

  // Sort
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    // Keep declined at the bottom
    if (a.status === 'DECLINED' && b.status !== 'DECLINED') return 1;
    if (b.status === 'DECLINED' && a.status !== 'DECLINED') return -1;

    switch (filters.sortBy) {
      case 'price_asc':
        return a.total_premium - b.total_premium;
      case 'price_desc':
        return b.total_premium - a.total_premium;
      case 'idv_desc':
        return b.idv - a.idv;
      case 'smart':
      default:
        return b.value_score - a.value_score;
    }
  });

  const comparedPlans = plans.filter((p) => comparedPlanIds.includes(p.id));
  const expiringCount = policies.filter((p) => p.is_expiring_soon).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedPolicyCount={policies.length}
        expiringCount={expiringCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Error message banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: COMPARE QUOTES */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <VehicleLookup
              onSearch={handleSearchVehicle}
              vehicle={vehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onProceedToQuotes={() => vehicle && handleCollectQuotes(vehicle, simulateFailD)}
              isLoading={isSearchingVehicle}
            />

            {vehicle && (
              <>
                {/* Multi-provider collection status */}
                <ProviderProgress
                  providers={providers}
                  isLoading={isCollectingQuotes}
                  onRetryProviderD={handleRetryProviderD}
                  simulateFailD={simulateFailD}
                  setSimulateFailD={(fail) => {
                    setSimulateFailD(fail);
                    if (vehicle) handleCollectQuotes(vehicle, fail);
                  }}
                />

                {/* Filters & Sorting */}
                <PlanFilters
                  filters={filters}
                  setFilters={setFilters}
                  totalPlans={plans.length}
                  availablePlansCount={filteredPlans.length}
                />

                {/* Plans Grid */}
                {isCollectingQuotes ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <h4 className="text-base font-bold text-slate-800">Collecting Quotes...</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Querying Provider A, Provider B (simulating latency), Provider C (Rate Card), and Provider D.
                    </p>
                  </div>
                ) : sortedPlans.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-base font-bold text-slate-800">No matching plans found</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Try clearing some filters (like required add-ons or "Hide Expired Quotes") to see more options.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sortedPlans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        onSelect={(p) => setSelectedPlanForCheckout(p)}
                        onToggleCompare={handleToggleCompare}
                        isCompared={comparedPlanIds.includes(plan.id)}
                        canCompareMore={comparedPlanIds.length < 3}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: MY POLICIES */}
        {activeTab === 'policies' && (
          <PolicyDashboard
            policies={policies}
            onSendReminder={sendRenewalReminder}
            onGoToCompare={() => setActiveTab('compare')}
          />
        )}

        {/* TAB 3: ADD-ON GLOSSARY */}
        {activeTab === 'glossary' && (
          <GlossaryView glossaryData={glossaryData} />
        )}
      </main>

      {/* Floating Comparison Tray */}
      {comparedPlanIds.length > 0 && activeTab === 'compare' && (
        <aside aria-label="Compare Tray" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white rounded-2xl px-5 py-3.5 shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center gap-4 max-w-2xl w-[90%]">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-400" />
            <span className="text-xs sm:text-sm font-bold">
              {comparedPlanIds.length} of 3 plans selected
            </span>
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {comparedPlans.map((p) => (
              <span
                key={p.id}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/10 truncate max-w-[120px]"
              >
                {p.provider} ({p.plan_name})
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setComparedPlanIds([])}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30"
            >
              Compare Side-by-Side
            </button>
          </div>
        </aside>
      )}

      {/* Modals */}
      {isCompareModalOpen && (
        <ComparisonModal
          plans={comparedPlans}
          onClose={() => setIsCompareModalOpen(false)}
          onRemovePlan={handleRemoveComparedPlan}
          onSelectPlan={(p) => {
            setIsCompareModalOpen(false);
            setSelectedPlanForCheckout(p);
          }}
        />
      )}

      {selectedPlanForCheckout && vehicle && (
        <CheckoutModal
          plan={selectedPlanForCheckout}
          vehicle={vehicle}
          onClose={() => setSelectedPlanForCheckout(null)}
          onConfirm={handleConfirmPolicy}
          isSubmitting={isSubmittingPolicy}
        />
      )}
    </div>
  );
}

export default App;
