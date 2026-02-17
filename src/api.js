const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = {
  async listTrips() {
    const r = await fetch(`${API_URL}/api/trips`);
    if (!r.ok) throw new Error('Failed to load trips');
    return r.json();
  },
  async createTrip(body) {
    const r = await fetch(`${API_URL}/api/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Create trip failed');
    return r.json();
  },
  async planTrip(id, body) {
    const r = await fetch(`${API_URL}/api/trips/${id}/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Plan failed'); }
    return r.json();
  }
  ,
  async chatTrip(id, body) {
    const r = await fetch(`${API_URL}/api/trips/${id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Chat failed'); }
    return r.json();
  }
  ,
  async deleteTrip(id) {
    const r = await fetch(`${API_URL}/api/trips/${id}`, { method: 'DELETE' });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Delete failed'); }
    return r.json();
  }
  ,
  async updateTrip(id, body) {
    const r = await fetch(`${API_URL}/api/trips/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Update failed'); }
    return r.json();
  }
  ,
  async planPreview(body) {
    const r = await fetch(`${API_URL}/api/trips/plan-preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Plan preview failed'); }
    return r.json();
  }
  ,
  async searchLocations(params) {
    const qs = new URLSearchParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null && params[k] !== '') qs.set(k, String(params[k])) });
    const url = `${API_URL}/api/locations` + (qs.toString() ? '?' + qs.toString() : '');
    const r = await fetch(url);
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Locations search failed'); }
    return r.json();
  }
  ,
  async addExpense(tripId, body) {
    const r = await fetch(`${API_URL}/api/trips/${tripId}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Add expense failed'); }
    return r.json();
  }
  ,
  async deleteExpense(tripId, expenseId) {
    const path = `/api/trips/${tripId}/expenses/${expenseId}`
    let r = await fetch(`${API_URL}${path}`, { method: 'DELETE' });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Delete expense failed'); }
    return r.json();
  }
};
