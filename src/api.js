export const api = {
  async listTrips() {
    const r = await fetch('/api/trips');
    if (!r.ok) throw new Error('Failed to load trips');
    return r.json();
  },
  async createTrip(body) {
    const r = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Create trip failed');
    return r.json();
  },
  async planTrip(id, body) {
    const r = await fetch(`/api/trips/${id}/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Plan failed'); }
    return r.json();
  }
  ,
  async chatTrip(id, body) {
    const r = await fetch(`/api/trips/${id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Chat failed'); }
    return r.json();
  }
  ,
  async deleteTrip(id) {
    const r = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
    if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Delete failed'); }
    return r.json();
  }
  ,
  async updateTrip(id, body) {
    const r = await fetch(`/api/trips/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Update failed'); }
    return r.json();
  }
  ,
  async planPreview(body) {
    const r = await fetch('/api/trips/plan-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Plan preview failed'); }
    return r.json();
  }
  ,
  async searchLocations(params){
    const qs = new URLSearchParams();
    if (params) Object.keys(params).forEach(k=>{ if (params[k] != null && params[k] !== '') qs.set(k, String(params[k])) });
    const url = '/api/locations' + (qs.toString() ? '?'+qs.toString() : '');
    const r = await fetch(url);
    if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Locations search failed'); }
    return r.json();
  }
  ,
  async addExpense(tripId, body){
    const r = await fetch(`/api/trips/${tripId}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Add expense failed'); }
    return r.json();
  }
  ,
  async deleteExpense(tripId, expenseId){
    const path = `/api/trips/${tripId}/expenses/${expenseId}`
    let r = await fetch(path, { method: 'DELETE' });
    if (!r.ok){
      // retry directly to backend host for common dev setups where proxy isn't active
      try{
        const fallback = `http://localhost:5000${path}`
        r = await fetch(fallback, { method: 'DELETE' })
      }catch(e){ /* ignore */ }
    }
    if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Delete expense failed'); }
    return r.json();
  }
};
