import React from "react"
import { NavLink } from "react-router-dom"

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/dashboard" end className="mobile-nav-item">
        <span className="mobile-nav-label">Dashboard</span>
      </NavLink>
      <NavLink to="/budget" className="mobile-nav-item">
        <span className="mobile-nav-label">Budget</span>
      </NavLink>
      <NavLink to="/expenses" className="mobile-nav-item">
        <span className="mobile-nav-label">Spending</span>
      </NavLink>
      <NavLink to="/insights" className="mobile-nav-item">
        <span className="mobile-nav-label">Insights</span>
      </NavLink>
    </nav>
  )
}







