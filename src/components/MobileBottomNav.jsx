import React from "react"
import { NavLink, useLocation } from "react-router-dom"
import { FiHome, FiDollarSign, FiTrendingUp, FiPieChart } from "react-icons/fi"

export default function MobileBottomNav() {
  const location = useLocation()

  const navItems = [
    { to: "/dashboard", icon: FiHome, label: "Dashboard" },
    { to: "/budget", icon: FiDollarSign, label: "Budget" },
    { to: "/expenses", icon: FiTrendingUp, label: "Spending" },
    { to: "/insights", icon: FiPieChart, label: "Insights" },
  ]

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.to || 
          (item.to === "/dashboard" && location.pathname === "/")
        
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`mobile-nav-item ${isActive ? "active" : ""}`}
            aria-label={item.label}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <Icon size={20} />
              <span className="mobile-nav-label">{item.label}</span>
            </div>
          </NavLink>
        )
      })}
    </nav>
  )
}

