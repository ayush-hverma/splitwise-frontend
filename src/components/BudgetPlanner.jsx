import React, { useEffect, useState } from 'react'
import { api } from '../api'
import Modal from './Modal'
import LocationRecommendations from './LocationRecommendations'

function TripCard({ trip, onPlan, onDelete }){
  return (
    <div className="bg-white p-4 rounded shadow-sm flex items-center justify-between">
      <div className="text-sm text-gray-800"><strong>{trip.name}</strong> — {trip.currency} {trip.budget} — {trip.people.length} people</div>
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=>onPlan(trip)}>Plan</button>
        <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={()=>onDelete(trip)}>Delete</button>
      </div>
    </div>
  )
}

export default function BudgetPlanner(){
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalTrip, setModalTrip] = useState(undefined)


  useEffect(()=>{ load() }, [])
  
  async function load(){ setLoading(true); try{ const list = await api.listTrips(); setTrips(list || []); }catch(e){ console.error(e) } setLoading(false) }

  async function handleDelete(trip){
    if (!window.confirm(`Delete trip "${trip.name}"? This cannot be undone.`)) return;
    try{
      await api.deleteTrip(trip._id);
      await load();
    }catch(err){
      console.error(err);
      alert('Delete failed')
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Trips</h1>
        <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={()=>{ if(typeof location !== 'undefined') location.hash = '#/create' }}>Create New Trip</button>
      </div>
      <div className="mt-4 space-y-3">
        {loading ? <div className="text-gray-500">Loading...</div> : trips.map(t=> <TripCard key={t._id} trip={t} onPlan={(trip)=>setModalTrip(trip)} onDelete={handleDelete} />)}
      </div>

      {modalTrip && (
        <Modal title={modalTrip ? `Plan ${modalTrip.name}` : 'Create & Plan Trip'} onClose={()=>setModalTrip(undefined)}>
          <PlanForm trip={modalTrip} onClose={()=>{ setModalTrip(undefined); load(); }} />
        </Modal>
      )}
    </div>
  )
}

function PlanForm({ trip, onClose }){
  const [name, setName] = useState(trip ? trip.name : '')
  const [currency, setCurrency] = useState(trip ? trip.currency : 'USD')
  const [startDate, setStartDate] = useState(trip ? (trip.startDate ? new Date(trip.startDate).toISOString().slice(0,10) : '') : '')
  const [endDate, setEndDate] = useState(trip ? (trip.endDate ? new Date(trip.endDate).toISOString().slice(0,10) : '') : '')
  const [people, setPeople] = useState(trip ? trip.people.map(p=>p.name) : [])
  const [personName, setPersonName] = useState('')
  const [total, setTotal] = useState(trip ? trip.budget : '')
  const [cats, setCats] = useState([])
  const [expenses, setExpenses] = useState(trip ? (trip.expenses || []) : [])
  const [expensePayer, setExpensePayer] = useState( (trip && trip.people && trip.people[0]) ? trip.people[0].name : '' )
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')
  // initialize cats from trip when modal opens
  useEffect(()=>{
    if (trip && Array.isArray(trip.categories)){
      setCats(trip.categories.map(c=>({ name: c.name || '', val: (c.amount != null ? c.amount : '') })))
    } else {
      setCats([])
    }
    // initialize expenses and default payer
    if (trip && Array.isArray(trip.expenses)){
      setExpenses(trip.expenses)
    } else {
      setExpenses([])
    }
    if (trip && Array.isArray(trip.people) && trip.people.length){ setExpensePayer(trip.people[0].name) }
  }, [trip])
  const [working, setWorking] = useState(false)
  const [result, setResult] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null)

  // auto-dismiss save status after a few seconds
  useEffect(()=>{
    if (!saveStatus) return
    const t = setTimeout(()=> setSaveStatus(null), 4000)
    return () => clearTimeout(t)
  }, [saveStatus])
  const [tripId, setTripId] = useState(trip ? trip._id : null)
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: "Hi, I'm TripChat. I can help with budgets and settlements." },
    { from: 'user', text: "Great! Can you give a quick summary of our trip budget?" },
    { from: 'bot', text: "Sure, save your trip and click 'Plan' to generate a mock budget. If you provide dates I'll include a per-day budget." },
    { from: 'user', text: "Who currently owes money?" },
    { from: 'bot', text: "After you add expenses, ask 'who owes' or click 'Plan' for suggested settlements." }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [showRecs, setShowRecs] = useState(false)

  function addCat(){ setCats(c=>[...c, {name:'', val:''}]) }
  async function removeCat(i){
    // confirm before deleting category
    if (!window.confirm('Delete this category? This will remove it from the trip.')) return
    // remove locally first
    const newCats = (c=>{ const copy = [...c]; copy.splice(i,1); return copy })(cats)
    setCats(newCats)
    // if trip saved, persist change
    if (tripId){
      try{
        const payload = { name: name.trim(), currency, budget: Number(total||0), startDate: startDate || '', endDate: endDate || '', people: people.map(n=>({ name: n })), categories: newCats.map(c=>({ name: c.name, amount: Number(c.val || 0) })) }
        const updated = await api.updateTrip(tripId, payload)
        // reflect any saved categories/expenses from server
        setCats((updated.categories || []).map(c=>({ name: c.name || '', val: (c.amount != null ? c.amount : '') })))
        setExpenses(updated.expenses || [])
        setSaveStatus('Saved')
      }catch(err){ console.error('Failed to persist category delete', err); setErrorMsg('Failed to update categories') }
    }
  }

  // initialize cats from trip when modal opens
  useEffect(()=>{
    if (trip && Array.isArray(trip.categories)){
      setCats(trip.categories.map(c=>({ name: c.name || '', val: (c.amount != null ? c.amount : '') })))
      setStartDate(trip.startDate ? new Date(trip.startDate).toISOString().slice(0,10) : '')
      setEndDate(trip.endDate ? new Date(trip.endDate).toISOString().slice(0,10) : '')
    } else {
      setCats([])
    }
  }, [trip])

  async function handleSave(){
    setWorking(true)
    setErrorMsg(null)
    try{
      if (!name || !name.trim()) { setErrorMsg('Trip name is required'); setWorking(false); return }
      if (!currency || !currency.trim()) { setErrorMsg('Currency is required'); setWorking(false); return }
      const budgetNum = Number(total)
      if (isNaN(budgetNum) || budgetNum < 0) { setErrorMsg('Please enter a valid total budget'); setWorking(false); return }

      let saved = null
      if (!tripId){
        saved = await api.createTrip({ name: name.trim(), currency, budget: budgetNum, startDate: startDate || '', endDate: endDate || '', people: people.map(n=>({name:n})), categories: cats.map(c=>({ name: c.name, amount: Number(c.val || 0) })) })
        setTripId(saved._id)
        // reflect saved categories and expenses from DB
        setCats((saved.categories || []).map(c=>({ name: c.name || '', val: (c.amount != null ? c.amount : '') })))
        setExpenses(saved.expenses || [])
        setSaveStatus('Saved successfully')
      } else {
        const payload = { name: name.trim(), currency, budget: budgetNum, startDate: startDate || '', endDate: endDate || '', people: people.map(n=>({ name: n })), categories: cats.map(c=>({ name: c.name, amount: Number(c.val || 0) })) }
        const updated = await api.updateTrip(tripId, payload)
        // reflect saved categories and expenses from DB
        setCats((updated.categories || []).map(c=>({ name: c.name || '', val: (c.amount != null ? c.amount : '') })))
        setExpenses(updated.expenses || [])
        setSaveStatus('Saved successfully')
      }
      setResult(null)
    }catch(err){ setResult({ error: String(err) }) }
    setWorking(false)
  }

  async function handleAddExpense(){
    if (!tripId){ alert('Please save the trip before adding expenses'); return }
    if (!expensePayer) { alert('Select payer'); return }
    const amt = Number(expenseAmount)
    if (isNaN(amt) || amt <= 0) { alert('Enter valid amount'); return }
    try{
      const r = await api.addExpense(tripId, { payer: expensePayer, amount: amt, description: expenseDesc })
      // r should have { success: true, expense }
      const newExp = r.expense || r
      setExpenses(e=>[...e, newExp])
      setExpenseAmount('')
      setExpenseDesc('')
    }catch(err){ alert('Add expense failed: '+String(err)) }
  }

  async function handleDeleteExpense(expId, idx){
    // confirm before deleting expense
    if (!window.confirm('Delete this expense? This action cannot be undone.')) return
    // if expense not saved to server yet (no _id), just remove locally
    if (!expId){ setExpenses(es=>es.filter((_,i)=>i!==idx)); return }
    if (!tripId){ alert('Please save trip first'); return }
    try{
      const r = await api.deleteExpense(tripId, expId)
      if (r && r.updated){
        setExpenses(r.updated.expenses || [])
        setSaveStatus('Expense deleted')
      } else if (r && r.success){
        // fallback: fetch updated trip via updateTrip with same data
        const updated = await api.updateTrip(tripId, { name: name.trim(), currency, budget: Number(total||0), startDate: startDate || '', endDate: endDate || '', people: people.map(n=>({ name: n })), categories: cats.map(c=>({ name: c.name, amount: Number(c.val || 0) })) })
        setExpenses(updated.expenses || [])
        setSaveStatus('Expense deleted')
      }
    }catch(err){ console.error(err); alert('Delete failed: '+String(err)) }
  }

  // Generate a realistic mock plan without calling external APIs.
  function generateMockPlan(payload){
    const total = Number(payload.totalBudget || 0)
    const ppl = (payload.people || []).map(p=>p.name)
    const n = Math.max(1, ppl.length)

    // compute per-day budget if dates provided
    let days = 0
    let perDay = 0
    if (payload.startDate && payload.endDate){
      try{
        const s = new Date(payload.startDate)
        const e = new Date(payload.endDate)
        const diff = Math.ceil((e - s) / (1000*60*60*24))
        days = diff > 0 ? diff : 0
      }catch(e){ days = 0 }
    }
    if (days > 0) perDay = +(total / days).toFixed(2)

    // Build categories: if none provided, use defaults
    let categories = payload.categories && payload.categories.length ?
      payload.categories.map(c=>({ name: c.name || 'Other', amount: Number(c.amount || 0) })) :
      [ { name: 'Accommodation', amount: Math.round(total * 0.45) }, { name: 'Food', amount: Math.round(total * 0.25) }, { name: 'Transport', amount: Math.round(total * 0.15) }, { name: 'Activities', amount: Math.round(total * 0.15) } ]

    // If categories provided but amounts are zero, distribute by default percentages
    const catsHaveAmounts = categories.some(c=>c.amount && Number(c.amount) > 0)
    if (!catsHaveAmounts){
      const weights = [0.45,0.25,0.15,0.15]
      categories = categories.map((c,i)=>({ name: c.name || `Category ${i+1}`, amount: Math.round(total * (weights[i] || 0.1)) }))
    }

    // Normalize to total (adjust last category)
    const sumCats = categories.reduce((s,c)=>s + (Number(c.amount)||0), 0)
    if (sumCats !== total){
      const diff = total - sumCats
      categories[categories.length-1].amount = (Number(categories[categories.length-1].amount)||0) + diff
    }

    // Per-person share per category and totals
    const perPerson = ppl.map(name => ({ name, share: 0 }))
    categories.forEach(c => {
      const each = +(Number(c.amount||0) / n).toFixed(2)
      perPerson.forEach(p => p.share = +(p.share + each).toFixed(2))
    })

    // Use existing expenses to compute balances (mock realistic payer totals)
    const payerTotals = {}
    if (Array.isArray(expenses) && expenses.length){
      expenses.forEach(ex => { payerTotals[ex.payer] = (payerTotals[ex.payer]||0) + Number(ex.amount||0) })
    } else {
      // create a believable distribution of pre-paid amounts
      ppl.forEach((p,i)=>{ payerTotals[p] = Math.round((total / n) * (0.4 + (i*0.1))) })
    }

    // Calculate net owed: person_paid - person_share
    const settlements = []
    const balances = {}
    perPerson.forEach(p => { balances[p.name] = +( (payerTotals[p.name] || 0) - p.share ).toFixed(2) })

    // Create simple settlement suggestions: people with negative balances pay those with positive
    const creditors = Object.entries(balances).filter(([,b])=>b>0).map(([name,b])=>({name, amt:b})).sort((a,b)=>b.amt-a.amt)
    const debtors = Object.entries(balances).filter(([,b])=>b<0).map(([name,b])=>({name, amt:-b})).sort((a,b)=>b.amt-a.amt)
    let ci = 0, di = 0
    while(ci < creditors.length && di < debtors.length){
      const c = creditors[ci]
      const d = debtors[di]
      const x = Math.min(c.amt, d.amt)
      settlements.push({ from: d.name, to: c.name, amount: +x.toFixed(2) })
      c.amt = +(c.amt - x).toFixed(2)
      d.amt = +(d.amt - x).toFixed(2)
      if (c.amt <= 0.01) ci++
      if (d.amt <= 0.01) di++
    }

    return {
      summary: `${payload.name || 'Trip'} — Total ${payload.currency || 'USD'} ${total} — ${n} people`,
      days,
      perDayBudget: perDay,
      total,
      currency: payload.currency || 'USD',
      categories,
      perPerson,
      payerTotals,
      balances,
      settlements,
      generatedAt: new Date().toISOString()
    }
  }

  async function handlePlan(){
    setWorking(true)
    setErrorMsg(null)
    try{
      if (!name || !name.trim()) { setErrorMsg('Trip name is required'); setWorking(false); return }
      if (!currency || !currency.trim()) { setErrorMsg('Currency is required'); setWorking(false); return }
      const budgetNum = Number(total)
      if (isNaN(budgetNum) || budgetNum < 0) { setErrorMsg('Please enter a valid total budget'); setWorking(false); return }

      const payloadAI = { totalBudget: Number(total||0), startDate: startDate || '', endDate: endDate || '', categories: cats.map(c=>({ name: c.name, amount: Number(c.val || 0) })), name: name.trim(), currency, people: people.map(n=>({ name: n })) }

      // Use mock generator instead of calling external API
      const plan = generateMockPlan(payloadAI)
      setResult(plan)

      // add a friendly mock bot message summarizing the result
      setChatMessages(m=>[...m, { from: 'bot', text: `AI Plan ready: ${plan.summary}. Per-day: ${plan.currency} ${plan.perDayBudget || 0} (${plan.days || 0} days). Suggested per-person share: ${plan.perPerson.map(p=>`${p.name} ${plan.currency} ${p.share}`).join(', ')}.` }])
    }catch(err){ setResult({ error: String(err) }) }
    setWorking(false)
  }

  // Mock chat: respond locally with realistic answers based on plan/result
  function sendChat(){
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatMessages(m=>[...m, { from: 'user', text: userText }]);
    setChatInput('');

    // simple intent detection
    const t = userText.toLowerCase()
    let reply = "Sorry, I don't understand. Try: 'summary', 'who owes', or 'settle up'."

    if (t.includes('summary') || t.includes('overview')){
      if (result && !result.error){
        reply = `Summary: ${result.summary}. Categories: ${result.categories.map(c=>`${c.name} ${result.currency} ${c.amount}`).join('; ')}.`
      } else {
        reply = `No plan yet. Click 'Plan with AI' to generate a mock budget summary.`
      }
    } else if (t.includes('who') && t.includes('owe')){
      if (result && result.balances){
        const oweLines = Object.entries(result.balances).map(([n,b])=>`${n}: ${result.currency} ${ (b<0 ? ('owes '+Math.abs(b).toFixed(2)) : (b>0 ? 'is owed '+b.toFixed(2) : 'settled')) }`)
        reply = `Balances — ${oweLines.join('; ')}`
      } else reply = 'No balance data available. Generate AI plan first.'
    } else if (t.includes('settle') || t.includes('transfer')){
      if (result && result.settlements && result.settlements.length){
        reply = 'Suggested transfers: ' + result.settlements.map(s=>`${s.from} → ${s.to} ${result.currency} ${s.amount}`).join('; ')
      } else reply = 'No settlement suggestions available.'
    } else if (t.match(/\d+/) && t.includes('split')){
      // try to detect a number and compute simple split
      const m = t.match(/(\d+)/)
      const parts = Number(m ? m[1] : 2)
      const amtMatch = t.match(/\$?(\d+(?:\.\d+)?)/)
      if (amtMatch){
        const amt = Number(amtMatch[1])
        const each = +(amt / parts).toFixed(2)
        reply = `Split ${result ? result.currency : ''} ${amt} between ${parts}: each pays ${result ? result.currency : ''} ${each}`
      } else reply = 'Specify an amount to split, e.g. "split $120 between 3".'
    } else {
      // default helpful reply using plan if available
      if (result && result.perPerson){
        reply = `You can ask for 'summary', 'who owes', or 'settle'. Current suggested per-person share example: ${result.perPerson.slice(0,3).map(p=>`${p.name} ${result.currency} ${p.share}`).join(', ')}.`
      }
    }

    // small delay to simulate thinking
    setTimeout(()=> setChatMessages(m=>[...m, { from: 'bot', text: reply }]), 600)
  }

  // Helper: simple stacked bar for categories
  function CategoryStack({cats, total, currency}){
    if (!cats || !cats.length) return <div className="small muted">No categories</div>
    return (
      <div style={{borderRadius:8,overflow:'hidden',background:'#f3f4f6',height:18,display:'flex'}}>
        {cats.map((c,i)=>{
          const w = total ? Math.max(0.5, (Number(c.amount||0) / total) * 100) : 0
          const colors = ['#60a5fa','#34d399','#fbbf24','#f87171','#c4b5fd']
          return <div key={i} title={`${c.name} ${currency} ${c.amount}`} style={{width:`${w}%`, background: colors[i % colors.length]}} />
        })}
      </div>
    )
  }

  // Helper: balances bar chart
  function BalancesChart({balances, currency}){
    const entries = Object.entries(balances || {})
    if (!entries.length) return <div className="small muted">No balances</div>
    const maxAbs = Math.max(...entries.map(([,b])=>Math.abs(Number(b)||0)), 1)
    return (
      <div style={{display:'grid',gap:8}}>
        {entries.map(([n,b],i)=>{
          const val = Number(b||0)
          const width = Math.min(100, Math.round((Math.abs(val) / maxAbs) * 100))
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:96}} className="small">{n}</div>
              <div style={{flex:1,display:'flex',alignItems:'center',gap:8}}>
                {val < 0 ? (
                  <div style={{height:12,background:'#fee2e2',borderRadius:6,flex:`0 0 ${width}%`}} />
                ) : (
                  <div style={{height:12,background:'#ecfdf5',borderRadius:6,flex:`0 0 ${width}%`}} />
                )}
                <div className="small muted" style={{width:110,textAlign:'right'}}>{val < 0 ? `owes ${currency} ${Math.abs(val).toFixed(2)}` : (val>0? `is owed ${currency} ${val.toFixed(2)}` : 'settled')}</div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Helper: simple SVG pie chart
  function PieChart({cats, total, size = 120, currency}){
    if (!cats || !cats.length) return <div className="small muted">No data</div>
    const colors = ['#60a5fa','#34d399','#fbbf24','#f87171','#c4b5fd']
    let acc = 0
    const radius = size/2 - 2
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size/2}, ${size/2})`}>
          {cats.map((c,i)=>{
            const v = Number(c.amount || 0)
            const start = (acc/total) * Math.PI * 2
            const end = ((acc + v)/total) * Math.PI * 2
            const x1 = Math.cos(start) * radius
            const y1 = Math.sin(start) * radius
            const x2 = Math.cos(end) * radius
            const y2 = Math.sin(end) * radius
            const large = end - start > Math.PI ? 1 : 0
            const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`
            acc += v
            return <path key={i} d={path} fill={colors[i % colors.length]} stroke="#ffffff" strokeWidth="0.5"><title>{`${c.name} ${currency} ${c.amount}`}</title></path>
          })}
          <circle cx="0" cy="0" r={radius*0.45} fill="#ffffff" />
        </g>
      </svg>
    )
  }

  return (
    <form onSubmit={(e)=>{ e.preventDefault(); handlePlan(); }} className="space-y-4">
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
        <div>
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:8}}>
            <input aria-label="Trip name" placeholder='Trip name' value={name} onChange={e=>setName(e.target.value)} style={{flex:1,padding:10,borderRadius:8,border:'1px solid #e6edf8'}} />
            <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{padding:10,borderRadius:8,border:'1px solid #e6edf8'}}>
              <option>USD</option><option>EUR</option><option>INR</option>
            </select>
          </div>

          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
            <div style={{display:'flex',flexDirection:'column'}}>
              <div className="small muted">Start date</div>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{padding:8,borderRadius:8,border:'1px solid #e6edf8'}} />
            </div>
            <div style={{display:'flex',flexDirection:'column'}}>
              <div className="small muted">End date</div>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{padding:8,borderRadius:8,border:'1px solid #e6edf8'}} />
            </div>
          </div>

          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
            <input value={personName} onChange={e=>setPersonName(e.target.value)} placeholder="Add person" style={{flex:1,padding:8,borderRadius:8,border:'1px solid #e6edf8'}} />
            <button type="button" className="btn-compact" onClick={()=>{ if(!personName.trim())return; setPeople(p=>[...p, personName.trim()]); setPersonName('') }} style={{background:'#eef6ff',color:'#2563eb'}}>Add</button>
          </div>

          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
            {people.length === 0 && <div className="small muted">No people added</div>}
            {people.map((p,i)=>(
              <div key={i} className="chip" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:999,background:'#fff'}}>
                <div style={{width:28,height:28,borderRadius:14,background:'#eef6ff',color:'#2563eb,',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{p.charAt(0).toUpperCase()}</div>
                <div style={{fontSize:13}}>{p}</div>
                <button type="button" aria-label={`Remove ${p}`} onClick={()=>setPeople(ps=>ps.filter((_,idx)=>idx!==i))} style={{background:'transparent',border:0,color:'#ef4444',cursor:'pointer'}}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gap:8}}>
            <div>
              <div className="small muted">Total budget</div>
              <input type="number" value={total} onChange={e=>setTotal(e.target.value)} placeholder="0" style={{width:160,padding:8,borderRadius:8,border:'1px solid #e6edf8'}} />
            </div>

            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontWeight:600}}>Categories</div>
                <button type="button" className="small" onClick={addCat} style={{color:'#2563eb'}}>Add</button>
              </div>
              <div style={{display:'grid',gap:8,marginTop:8}}>
                {cats.map((c,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 120px 40px',gap:8,alignItems:'center'}}>
                    <input value={c.name} onChange={e=>setCats(cs=>{ const copy=[...cs]; copy[i].name = e.target.value; return copy })} placeholder="Category" style={{padding:8,borderRadius:8,border:'1px solid #e6edf8'}} />
                    <input value={c.val} onChange={e=>setCats(cs=>{ const copy=[...cs]; copy[i].val = e.target.value; return copy })} placeholder="Amount" style={{padding:8,borderRadius:8,border:'1px solid #e6edf8'}} />
                    <button type="button" onClick={()=>removeCat(i)} style={{background:'transparent',border:0,color:'#ef4444'}}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontWeight:600}}>Expenses</div>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <select value={expensePayer} onChange={e=>setExpensePayer(e.target.value)} style={{padding:8,borderRadius:8,border:'1px solid #e6edf8'}}>
                  {(people||[]).map((p,i)=>(<option key={i} value={p}>{p}</option>))}
                </select>
                <input value={expenseAmount} onChange={e=>setExpenseAmount(e.target.value)} placeholder="Amount" style={{padding:8,borderRadius:8,border:'1px solid #e6edf8'}} />
                <input value={expenseDesc} onChange={e=>setExpenseDesc(e.target.value)} placeholder="Description" style={{padding:8,borderRadius:8,border:'1px solid #e6edf8'}} />
                <button type="button" className="btn-compact" onClick={handleAddExpense} style={{background:'#f3f4f6'}}>Add</button>
              </div>

              <div style={{marginTop:10,display:'grid',gap:8}}>
                {expenses.length === 0 && <div className="small muted">No expenses yet</div>}
                {expenses.map((ex,i)=> (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fff',padding:8,borderRadius:8,boxShadow:'0 6px 20px rgba(2,6,23,0.04)'}}>
                    <div>
                      <div style={{fontWeight:600}}>{ex.payer}</div>
                      <div className="small muted">{ex.description || 'Expense'}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{fontWeight:700}}>{ex.amount}</div>
                      <button type="button" onClick={()=>{
                        const id = ex._id || ex.id || null
                        handleDeleteExpense(id, i)
                      }} style={{background:'transparent',border:0,color:'#ef4444',cursor:'pointer'}}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:700}}>Plan Summary</div>
              <div className="small muted">Quick view</div>
            </div>
            <div style={{display:'grid',gap:8}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><div className="small muted">Total</div><div style={{fontWeight:700}}>{currency} {Number(total||0).toLocaleString()}</div></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><div className="small muted">People</div><div className="small">{people.length}</div></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><div className="small muted">Expenses</div><div className="small">{expenses.length}</div></div>
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button type="button" className="btn-compact" onClick={handleSave} style={{flex:1,background:'#059669',color:'#fff',padding:10}}>Save</button>
                <button type="button" className="btn-compact" onClick={handlePlan} style={{flex:1,background:'#2563eb',color:'#fff',padding:10}}>Plan</button>
              </div>
              <button type="button" className="btn-compact" onClick={onClose} style={{width:'100%',justifyContent:'center',marginTop:8}}>Close</button>
            </div>
          </div>
        </aside>
      </div>

      {saveStatus && (
        <div className="mt-2 text-sm text-green-600">{saveStatus}</div>
      )}

      {showRecs && (
        <LocationRecommendations onSelect={(loc)=>{
          if (!name) setName(loc.name || '')
          if (Array.isArray(loc.attractions) && loc.attractions.length) {
            setCats(loc.attractions.map(a=>({ name: a.name || '', val: '' })))
          } else if (Array.isArray(loc.categories) && loc.categories.length){
            setCats(loc.categories.map(c=>({ name: c, val: '' })))
          }
          setShowRecs(false)
        }} initialFilters={{ category: (trip && trip.categories && trip.categories[0]) || '' }} />
      )}

      {result && (
        <div className="mt-4 plan card">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div>
              <div style={{fontWeight:700}}>AI Plan</div>
              <div className="small muted">Generated: {new Date(result.generatedAt || Date.now()).toLocaleString()}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="small muted">{result.summary}</div>
              <div className="small muted">Per-day: {result.currency} {Number(result.perDayBudget||0).toFixed(2)} {result.days ? `(${result.days} days)` : ''}</div>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <div style={{fontWeight:600, marginBottom:6}}>Categories</div>
              <div style={{display:'grid',gap:8}}>
                {(result.categories||[]).map((c,i)=>{
                  const pct = result.total ? Math.round((Number(c.amount||0)/result.total)*100) : 0
                  return (
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                      <div className="small">{c.name}</div>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div className="small muted">{result.currency} {Number(c.amount||0).toLocaleString()}</div>
                        <div className="small muted">{pct}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <div style={{fontWeight:600, marginBottom:6}}>Per-person share</div>
              <div style={{display:'grid',gap:8}}>
                {(result.perPerson||[]).map((p,i)=> (
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontWeight:500}}>{p.name}</div>
                    <div className="small muted">{result.currency} {Number(p.share||0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div>
              <div style={{fontWeight:600, marginBottom:6}}>Balance Sheet</div>
              <div style={{background:'#fff',borderRadius:8,padding:8,boxShadow:'0 6px 20px rgba(2,6,23,0.04)'}}>
                <div style={{display:'flex',gap:8,fontWeight:600,padding:'6px 0',borderBottom:'1px solid #f1f5f9'}}>
                  <div style={{flex:1}}>Payer</div>
                  <div style={{width:80,textAlign:'right'}}>Amount</div>
                  <div style={{width:140,textAlign:'right'}}>Date</div>
                </div>
                <div style={{display:'grid',gap:6,marginTop:8,maxHeight:200,overflow:'auto'}}>
                  {(expenses && expenses.length) ? expenses.map((ex,i)=> (
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px dashed #f3f4f6'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600}}>{ex.payer}</div>
                        <div className="small muted">{ex.description || 'Expense'}</div>
                      </div>
                      <div style={{width:80,textAlign:'right',fontWeight:700}}>{result.currency} {Number(ex.amount||0).toFixed(2)}</div>
                      <div style={{width:140,textAlign:'right'}} className="small muted">{ex.createdAt ? new Date(ex.createdAt).toLocaleString() : ''}</div>
                      <div style={{marginLeft:10}}>
                        <button type="button" onClick={()=>{ const id = ex._id || ex.id || null; handleDeleteExpense(id, i) }} style={{background:'transparent',border:0,color:'#ef4444',cursor:'pointer'}}>Delete</button>
                      </div>
                    </div>
                  )) : <div className="small muted">No expenses recorded</div>}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontWeight:700}}>
                  <div>Total</div>
                  <div>{result.currency} {Number(result.total||0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{fontWeight:600, marginBottom:6}}>Balance per user</div>
              <div style={{display:'grid',gap:8}}>
                {Object.entries(result.balances || {}).map(([n,b],i)=> (
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:8,background:'#fff',borderRadius:8}}>
                    <div>
                      <div style={{fontWeight:700}}>{n}</div>
                      <div className="small muted">Paid: {result.currency} {(result.payerTotals && result.payerTotals[n]) ? Number(result.payerTotals[n]).toFixed(2) : '0.00'}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700,color: b < 0 ? '#ef4444' : (b>0? '#059669' : '#6b7280')}}>
                        {b < 0 ? `owes ${result.currency} ${Math.abs(b).toFixed(2)}` : (b>0 ? `is owed ${result.currency} ${b.toFixed(2)}` : 'settled')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{marginTop:12}}>
                <div style={{fontWeight:600, marginBottom:6}}>Minimal settlements</div>
                <div style={{display:'grid',gap:8}}>
                  {(result.settlements && result.settlements.length) ? result.settlements.map((s,i)=> (
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:8,background:'#fff',borderRadius:8}}>
                      <div className="small">{s.from} → {s.to}</div>
                      <div className="small muted">{result.currency} {Number(s.amount).toFixed(2)}</div>
                    </div>
                  )) : <div className="small muted">No suggested transfers</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div>
              <div style={{fontWeight:600, marginBottom:6}}>Category breakdown</div>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <div style={{flex:'0 0 120px'}}>
                  <PieChart cats={result.categories} total={result.total} size={120} currency={result.currency} />
                </div>
                <div style={{flex:1}}>
                  <CategoryStack cats={result.categories} total={result.total} currency={result.currency} />
                </div>
              </div>
              <div style={{marginTop:8, display:'grid', gap:6}}>
                {(result.categories||[]).map((c,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div className="small">{c.name}</div>
                    <div className="small muted">{result.currency} {Number(c.amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{fontWeight:600, marginBottom:6}}>Balances chart</div>
              <BalancesChart balances={result.balances} currency={result.currency} />
            </div>
          </div>
        </div>
      )}

      {tripId && (
        <>
          {/* Floating chat head (collapsed) */}
          {!chatOpen && (
            <div className="chat-head" onClick={()=>setChatOpen(true)}>
              <div className="chat-head-icon">💬</div>
              <div className="chat-head-preview">{chatMessages[chatMessages.length-1]?.text.slice(0,40)}</div>
            </div>
          )}

          {/* Chat panel (expanded) */}
          {chatOpen && (
            <div className="chat-panel">
              <div className="chat-panel-header">
                <div>Trip Chat</div>
                <div>
                  <button className="btn" type="button" onClick={()=>setChatOpen(false)}>Close</button>
                </div>
              </div>
              <div className="chat-panel-body">
                {chatMessages.map((m,i)=> (
                  <div key={i} className={`chat-msg ${m.from==='user' ? 'chat-user' : 'chat-bot'}`}>
                    <div className="avatar">{m.from==='user' ? 'U' : 'B'}</div>
                    <div className="bubble">{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="chat-panel-input">
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask about breakdown or settlements..." />
                <button className="px-3 py-2 bg-blue-600 text-white rounded" type="button" onClick={sendChat}>Send</button>
              </div>
            </div>
          )}
        </>
      )}
    </form>
  )
}
