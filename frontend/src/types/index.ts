export interface Vehicle {
  registration_number: string;
  make: string;
  model: string;
  variant?: string;
  fuel_type?: string;
  engine_cc?: number;
  registration_date?: string;
  rto?: string;
  ex_showroom_price?: number;
  current_policy_expiry?: string;
  claims_last_year: number;
  ncb_percent: number;
  is_registered: boolean;
  days_to_expiry?: number | null;
  expiry_status?: 'EXPIRED' | 'EXPIRING_SOON' | 'ACTIVE' | 'UNKNOWN';
}

export interface AddonItem {
  code: string;
  name: string;
  raw_name: string;
  description?: string;
}

export interface InsurancePlan {
  id: string;
  provider: string;
  plan_name: string;
  coverage_type: 'COMPREHENSIVE' | 'THIRD_PARTY' | 'ZERO_DEP' | string;
  idv: number;
  base_premium: number;
  gst_amount: number;
  total_premium: number;
  addons: AddonItem[];
  valid_until?: string | null;
  is_expired: boolean;
  benefits: string[];
  value_score: number;
  badge?: string | null;
  status: 'AVAILABLE' | 'EXPIRED' | 'DECLINED' | string;
  decline_reason?: string | null;
}

export interface ProviderStatus {
  provider: string;
  status: 'success' | 'failed' | 'timeout' | 'declined';
  latency_ms: number;
  plan_count: number;
  error_message?: string | null;
}

export interface QuoteComparisonResponse {
  registration_number: string;
  reference_date: string;
  vehicle: Vehicle;
  providers: ProviderStatus[];
  plans: InsurancePlan[];
  total_plans: number;
  cheapest_plan_id?: string | null;
  best_value_plan_id?: string | null;
}

export interface Policy {
  id: string;
  policy_number: string;
  registration_number: string;
  customer_name: string;
  customer_phone: string;
  provider: string;
  plan_name: string;
  coverage_type: string;
  idv: number;
  base_premium: number;
  gst_amount: number;
  total_premium: number;
  addons: string[];
  start_date: string;
  expiry_date: string;
  make?: string;
  model?: string;
  variant?: string;
  fuel_type?: string;
  days_to_expiry: number;
  is_expiring_soon: boolean;
  is_expired: boolean;
  reminder_sent: boolean;
  created_at: string;
}

export interface GlossarySource {
  insurer: string;
  url: string;
  retrieved_date: string;
  key_concepts_verified: string[];
}

export interface GlossaryItem {
  name: string;
  description: string;
  aliases: string[];
}

export interface GlossaryResponse {
  research_sources: GlossarySource[];
  canonical_glossary: Record<string, GlossaryItem>;
}
