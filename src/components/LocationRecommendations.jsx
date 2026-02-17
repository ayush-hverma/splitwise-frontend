import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function LocationRecommendations({ onSelect, initialFilters }){
  const [filters, setFilters] = useState(initialFilters || { q:'', category:'', season:'', minCost:'', maxCost:'' })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)

  useEffect(()=>{ fetchResults() }, [])

  async function fetchResults(){
    setLoading(true); setError(null)
    try{
      const res = await api.searchLocations(filters)
      setResults(res || [])
    }catch(err){ setError(String(err)) }
    setLoading(false)
  }

  function update(k,v){ setFilters(f=>({ ...f, [k]: v })) }

  return (
    <div className="mt-4 bg-white p-4 rounded shadow">
      <div className="flex gap-2 mb-3">
        <input placeholder="Search locations or attractions" value={filters.q} onChange={e=>update('q', e.target.value)} className="flex-1 rounded border-gray-200 p-2" />
        <input placeholder="Category" value={filters.category} onChange={e=>update('category', e.target.value)} className="w-40 rounded border-gray-200 p-2" />
        <input placeholder="Season (dry,summer)" value={filters.season} onChange={e=>update('season', e.target.value)} className="w-40 rounded border-gray-200 p-2" />
      </div>
      <div className="flex gap-2 mb-3">
        <input placeholder="min cost" value={filters.minCost} onChange={e=>update('minCost', e.target.value)} className="w-32 rounded border-gray-200 p-2" />
        <input placeholder="max cost" value={filters.maxCost} onChange={e=>update('maxCost', e.target.value)} className="w-32 rounded border-gray-200 p-2" />
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={fetchResults}>Search</button>
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      <div className="space-y-3">
        {results.length === 0 && !loading && <div className="text-gray-500">No locations found</div>}
        {results.map(loc => (
          <div key={loc._id} className="p-3 border rounded flex items-start justify-between">
            <div>
              <div className="font-medium">{loc.name} <span className="text-sm text-gray-500">{loc.country}</span></div>
              <div className="text-sm text-gray-600">{(loc.categories||[]).join(', ')} • Avg ${loc.avgCost || 'N/A'}</div>
              <div className="mt-1 text-sm text-gray-700">{(loc.attractions||[]).slice(0,2).map(a=>a.name).join(' · ')}</div>
              <div className="mt-1 text-xs text-gray-400">{loc.seasonalNotes ? Object.entries(loc.seasonalNotes).map(([k,v])=>`${k}: ${v}`).slice(0,2).join(' | ') : ''}</div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>{ if(onSelect) onSelect(loc) }}>Select</button>
              <a className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700" href={`#/profile`} onClick={(e)=>{ e.preventDefault(); if(onSelect) onSelect(loc) }}>Add to plan</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
