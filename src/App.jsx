import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Expenses from './pages/Expenses.jsx'
import Budget from './pages/Budget.jsx'
import Insights from './pages/Insights.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'

export default function App(){
  return (
    <div className="container">
      <nav className="nav" style={{justifyContent:'space-between'}}>
        <div className="row" style={{alignItems:'center', gap:12}}>
          <img src="/cat-envelope.jpg" width="32" height="32" alt="Cashvelo logo" />
          <NavLink to="/dashboard" className={({isActive})=> isActive? 'active':''}>Dashboard</NavLink>
          <NavLink to="/budget" className={({isActive})=> isActive? 'active':''}>Budget</NavLink>
          <NavLink to="/expenses" className={({isActive})=> isActive? 'active':''}>Spending</NavLink>   {/* Update route to /spending or rename back to 'Expenses' */}      
          <NavLink to="/insights" className={({isActive})=> isActive? 'active':''}>Insights</NavLink>
        </div>
        <ThemeToggle/>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/expenses" element={<Expenses/>} />
        <Route path="/budget" element={<Budget/>} />
        <Route path="/insights" element={<Insights/>} />
        <Route path="*" element={<Navigate to="/dashboard" replace/>} />
      </Routes>
    </div>
  )
}
