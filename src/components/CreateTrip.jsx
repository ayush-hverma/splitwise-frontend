import React, { useState } from 'react'
import { api } from '../api'

export default function CreateTrip({ onCreated }) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [budget, setBudget] = useState('')
  const [people, setPeople] = useState([])
  const [personName, setPersonName] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e){
    e.preventDefault()
    setBusy(true)
    try{
      await api.createTrip({ name: name.trim(), currency, budget: Number(budget||0), people: people.map(n=>({name:n})) })
      setName(''); setBudget(''); setPeople([])
      if (onCreated) onCreated()
      if (typeof location !== 'undefined') location.hash = '#/budget'
    }catch(err){ alert('Create failed') }
    setBusy(false)
  }

  return (
    <div className="max-w-2xl">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
        <div>
          <h1 style={{margin:0, fontSize:22, fontWeight:700}}>Create Trip</h1>
          <div className="small muted">Quickly create a trip and invite members</div>
        </div>
      </div>

      <form onSubmit={submit} className="card" aria-label="Create trip form">
        <div style={{display:'grid', gridTemplateColumns:'1fr 160px', gap:12, alignItems:'start'}}>
          <div>
            <label className="small">Trip name</label>
            <input aria-label="Trip name" required placeholder="Add a trip name..." value={name} onChange={e=>setName(e.target.value)} style={{width:'100%', marginTop:6, padding:10, borderRadius:8, border:'1px solid #e6edf8'}} />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <div>
              <label className="small">Currency</label>
              <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{width:'100%', marginTop:6, padding:10, borderRadius:8, border:'1px solid #e6edf8'}}>
                <option>USD</option>
                <option>EUR</option>
                <option>INR</option>
              </select>
            </div>
            <div>
              <label className="small">Budget</label>
              <input type="number" placeholder="0" value={budget} onChange={e=>setBudget(e.target.value)} style={{width:'100%', marginTop:6, padding:10, borderRadius:8, border:'1px solid #e6edf8'}} />
            </div>
          </div>
        </div>

        <div style={{marginTop:12}}>
          <label className="small">Add people</label>
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <input aria-label="Member name" value={personName} onChange={e=>setPersonName(e.target.value)} placeholder="Type a name and press Add" style={{flex:1,padding:10,borderRadius:8,border:'1px solid #e6edf8'}} />
            <button type="button" className="btn-compact" onClick={()=>{ if(!personName.trim()) return; setPeople(p=>[...p, personName.trim()]); setPersonName('') }} style={{background:'#eef6ff',color:'#2563eb'}}>Add</button>
          </div>

          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:12}}>
            {people.length === 0 && <div className="small muted">No people added yet</div>}
            {people.map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'#fff',padding:'6px 10px',borderRadius:999,boxShadow:'0 4px 12px rgba(2,6,23,0.04)'}}>
                <div style={{width:28,height:28,borderRadius:14,background:'#eef6ff',color:'#2563eb,',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{p.charAt(0).toUpperCase()}</div>
                <div style={{fontSize:14}}>{p}</div>
                <button type="button" aria-label={`Remove ${p}`} onClick={()=>setPeople(ps=>ps.filter((_,idx)=>idx!==i))} style={{background:'transparent',border:0,color:'#ef4444',cursor:'pointer'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:16}}>
          <button type="button" className="btn-compact" onClick={()=>{ setName(''); setBudget(''); setPeople([]); setPersonName('') }} style={{background:'transparent'}}>Clear</button>
          <button type="submit" className="btn-compact" style={{background:'#2563eb',color:'#fff',padding:'10px 14px',borderRadius:8}} disabled={busy}>{busy ? 'Creating…' : 'Create Trip'}</button>
        </div>
      </form>
    </div>
  )
}
