import { Vehicle, QuoteComparisonResponse, Policy, GlossaryResponse } from '../types';

const API_BASE = '/api';

export async function fetchVehicle(regNo: string): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${encodeURIComponent(regNo)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch vehicle information');
  }
  return res.json();
}

export async function updateVehicle(vehicle: Partial<Vehicle> & { registration_number: string }): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicle),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update vehicle details');
  }
  return res.json();
}

export async function compareQuotes(regNo: string, simulateFailD: boolean = false): Promise<QuoteComparisonResponse> {
  const url = `${API_BASE}/quotes/compare?reg=${encodeURIComponent(regNo)}&simulate_fail_d=${simulateFailD}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to collect and compare quotes');
  }
  return res.json();
}

export async function fetchGlossary(): Promise<GlossaryResponse> {
  const res = await fetch(`${API_BASE}/quotes/glossary`);
  if (!res.ok) throw new Error('Failed to load add-on glossary');
  return res.json();
}

export async function fetchPolicies(): Promise<Policy[]> {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error('Failed to load policies');
  return res.json();
}

export async function createPolicy(policyData: any): Promise<Policy> {
  const res = await fetch(`${API_BASE}/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policyData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to issue policy');
  }
  return res.json();
}

export async function sendRenewalReminder(policyId: string): Promise<{ message: string; status: string }> {
  const res = await fetch(`${API_BASE}/policies/${policyId}/send-reminder`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to send renewal reminder');
  }
  return res.json();
}
