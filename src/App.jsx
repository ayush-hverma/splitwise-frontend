import React, { useState, useEffect } from 'react'
import CreateTrip from './components/CreateTrip'
import BudgetPlanner from './components/BudgetPlanner'
import Profile from './components/Profile'
import Recommendations from './components/Recommendations'

function getViewFromHash(){
  const h = (typeof location !== 'undefined' && location.hash) ? location.hash : ''
  if (h === '#/budget' || h === '#budget' || h === '#/planner') return 'budget'
  if (h === '#/profile' || h === '#profile') return 'profile'
  if (h === '#/recommendations' || h === '#/recs') return 'recommendations'
  return 'create'
}

export default function App() {
  const [view, setView] = useState(getViewFromHash())

  useEffect(()=>{
    if (!location.hash) location.hash = '#/create'
    function onHash(){ setView(getViewFromHash()) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-extrabold text-blue-600">TripSplit</div>
          <div className="text-sm text-gray-500">Plan. Split. Travel.</div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 bg-white p-4 border-r">
          <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Tools</h3>
          <nav className="flex flex-col gap-2">
            <button className={`flex items-center gap-3 py-2 px-3 rounded ${view==='profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { location.hash = '#/profile' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A11.955 11.955 0 0112 15c2.485 0 4.785.771 6.879 2.104M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span className="text-sm font-medium">Profile</span>
            </button>

            <button className={`flex items-center gap-3 py-2 px-3 rounded ${view==='create' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { location.hash = '#/create' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8M8 12h8"/></svg>
              <span className="text-sm font-medium">Create Trip</span>
            </button>

            <button className={`flex items-center gap-3 py-2 px-3 rounded ${view==='budget' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { location.hash = '#/budget' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 6h10M5 14h14"/></svg>
              <span className="text-sm font-medium">My Trips</span>
            </button>

            <button className={`flex items-center gap-3 py-2 px-3 rounded ${view==='recommendations' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => { location.hash = '#/recommendations' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              <span className="text-sm font-medium">Recommendations</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {view === 'create' ? <CreateTrip /> : (view === 'budget' ? <BudgetPlanner /> : (view === 'recommendations' ? <Recommendations /> : <Profile />))}
        </main>
      </div>
    </div>
  )
}
