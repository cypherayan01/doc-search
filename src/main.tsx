import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Page from "./app/dashboard/page"
import Sqlreader from "./app/dashboard/SqlReader"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/page" element={<Page />} />
        <Route path="/sqlreader" element={<Sqlreader />} /> 
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
