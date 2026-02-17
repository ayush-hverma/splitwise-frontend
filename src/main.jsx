import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const root = document.getElementById('root') || document.createElement('div')
if (!root.id) document.body.appendChild(root)
createRoot(root).render(<App />)
