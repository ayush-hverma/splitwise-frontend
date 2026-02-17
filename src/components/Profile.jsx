import React, { useEffect, useState } from 'react'
import { api } from '../api'

function formatMoney(n, cur=''){
  return `${cur} ${Math.round(n*100)/100}`
}

export default function Profile(){
  const [name, setName] = useState(localStorage.getItem('profileName') || 'You')
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(()=>{ load() }, [])
  async function load(){ setLoading(true); try{ const list = await api.listTrips(); setTrips(list || []) }catch(e){ console.error(e) } setLoading(false) }

  const planned = trips.filter(t => !(t.expenses && t.expenses.length))
  const userTrips = trips.filter(t => (t.people||[]).some(p=>p.name === name))

  // collect spend history for this user across trips
  const spendHistory = []
  trips.forEach(t => {
    (t.expenses||[]).forEach(exp => {
      if (exp.payer === name) spendHistory.push({ ...exp, tripName: t.name, currency: t.currency })
    })
  })

  const totalSpend = spendHistory.reduce((s,e)=>s + (Number(e.amount)||0), 0)

  // loyalty score heuristic:
  // - 10 points per trip (up to 50)
  // - 1 point per $100 spent (up to 30)
  // - 20 point recency bonus if last spend within 30 days
  let score = 0
  score += Math.min(50, userTrips.length * 10)
  score += Math.min(30, Math.floor(totalSpend/100))
  const lastSpend = spendHistory.slice().sort((a,b)=>new Date(b.createdAt) - new Date(a.createdAt))[0]
  if (lastSpend){ const days = (Date.now() - new Date(lastSpend.createdAt))/ (1000*60*60*24); if (days <= 30) score += 20 }
  score = Math.max(0, Math.min(100, Math.round(score)))

  function saveName(){ localStorage.setItem('profileName', name); load() }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <div className="text-sm text-gray-600">Loyalty Score: <span className="font-bold">{score}</span></div>
      </div>

      <div className="mt-4 bg-white p-4 rounded shadow">
        <label className="block">
          <div className="text-sm font-medium text-gray-700">Your name</div>
          <div className="flex gap-2 mt-1">
            <input value={name} onChange={e=>setName(e.target.value)} className="flex-1 rounded border-gray-200" />
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={saveName}>Save</button>
          </div>
        </label>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Trips (you are in)</div>
            <div className="text-xl font-bold">{userTrips.length}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Planned trips</div>
            <div className="text-xl font-bold">{planned.length}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Total spend</div>
            <div className="text-xl font-bold">{formatMoney(totalSpend)}</div>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="font-semibold">Your trips</h2>
          <div className="mt-2 space-y-2">
            {userTrips.length === 0 && <div className="text-gray-500">No trips found</div>}
            {userTrips.map(t=> (
              <div key={t._id} className="p-3 bg-white border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.currency} {t.budget} — {t.people.length} people</div>
                </div>
                <div className="text-sm text-gray-700">Expenses: {(t.expenses||[]).length}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h2 className="font-semibold">Spend history</h2>
          <div className="mt-2 space-y-2">
            {spendHistory.length === 0 && <div className="text-gray-500">No expenses found for {name}</div>}
            {spendHistory.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map((s,i)=> (
              <div key={i} className="p-2 bg-white border rounded flex items-center justify-between">
                <div>
                  <div className="text-sm">{s.description || 'Expense'} — <span className="text-gray-500">{s.tripName}</span></div>
                  <div className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</div>
                </div>
                <div className="font-medium">{formatMoney(s.amount, s.currency)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat widget: small icon that expands to a mock human-agent conversation */}
      <div style={{position: 'fixed', right: 20, bottom: 20, zIndex: 50}}>
        {!chatOpen && (
          <button onClick={()=>setChatOpen(true)} aria-label="Open chat"
            className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.906L3 20l1.104-3.516A7.972 7.972 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}

        {chatOpen && (
          <div className="w-80 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-blue-600 text-white">
              <div className="font-medium">Human Agent</div>
              <div className="flex items-center gap-2">
                {/* <button className="text-sm opacity-90" onClick={()=>setChatOpen(false)}>Minimize</button> */}
                <button className="text-sm opacity-90" onClick={()=>setChatOpen(false)}>Close</button>
              </div>
            </div>

            <div className="p-3 h-56 overflow-auto" style={{background: '#f7f7fb'}}>
              {/* Mock conversation only */}
              <div className="space-y-3">
                <div className="text-sm text-right">
                  <div className="inline-block bg-white px-3 py-2 rounded-lg shadow-sm">Hi, I need help splitting a bill from my recent trip.</div>
                  <div className="text-xs text-gray-400 mt-1">You</div>
                </div>

                <div className="text-sm text-left">
                  <div className="inline-block bg-blue-50 px-3 py-2 rounded-lg border">Hi, I can help. Which trip and how much was the total?</div>
                  <div className="text-xs text-gray-400 mt-1">Agent</div>
                </div>

                <div className="text-sm text-right">
                  <div className="inline-block bg-white px-3 py-2 rounded-lg shadow-sm">The "Alps Trip", total was $420 split between 3 people.</div>
                  <div className="text-xs text-gray-400 mt-1">You</div>
                </div>

                <div className="text-sm text-left">
                  <div className="inline-block bg-blue-50 px-3 py-2 rounded-lg border">Got it. I suggest splitting equally — each pays $140. Want me to create the expenses?</div>
                  <div className="text-xs text-gray-400 mt-1">Agent</div>
                </div>
              </div>
            </div>

            <div className="p-2 border-t bg-white">
              <input readOnly value="This is a mock chat." className="w-full rounded border-gray-200 p-2 text-sm bg-gray-50" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
