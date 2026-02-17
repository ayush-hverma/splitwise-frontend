import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function Recommendations(){
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState([])
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(()=>{ load() }, [])

  async function load(){
    setLoading(true); setError(null)
    try{
      const res = await api.searchLocations({ limit: 100 })
      setLocations(res || [])
    }catch(err){ setError(String(err)) }
    setLoading(false)
  }

  async function createFromLocation(loc){
    if (!window.confirm(`Create a trip from location "${loc.name}"?`)) return;
    setCreating(true)
    try{
      const body = { name: loc.name, currency: 'USD', budget: loc.avgCost || 0, people: [], categories: (loc.categories||[]).map(c=>({ name: c })) }
      const created = await api.createTrip(body)
      alert(`Created trip ${created.name}`)
      // navigate to budget planner
      if (typeof location !== 'undefined') location.hash = '#/budget'
    }catch(err){
      console.error(err)
      alert('Create failed: '+String(err))
    }
    setCreating(false)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recommendations</h1>
        {/* <div className="text-sm text-gray-500">Browse suggested locations</div> */}
      </div>

      <div className="mt-4">
        {loading && <div className="text-gray-500">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        <div className="mt-3 space-y-3">
          {locations.map(loc => (
            <div key={loc._id} className="p-3 bg-white rounded shadow flex items-start justify-between">
              <div>
                <div className="font-medium">{loc.name} <span className="text-sm text-gray-500">{loc.country}</span></div>
                <div className="text-sm text-gray-600">{(loc.categories||[]).join(', ')} • Avg ${loc.avgCost || 'N/A'}</div>
                <div className="mt-1 text-sm text-gray-700">{(loc.attractions||[]).slice(0,3).map(a=>a.name).join(' · ')}</div>
                <div className="mt-1 text-xs text-gray-400">{loc.seasonalNotes ? Object.entries(loc.seasonalNotes).map(([k,v])=>`${k}: ${v}`).slice(0,2).join(' | ') : ''}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>createFromLocation(loc)} disabled={creating}>Create Trip</button>
                {/* <a className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700" href={`#/profile`}>Profile</a> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
