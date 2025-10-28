import React, { useEffect, useState } from "react"
import { Routes, Route, Navigate, NavLink } from "react-router-dom"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "./firebase"

import ThemeToggle from "./components/ThemeToggle.jsx"
import HomePage from "./pages/HomePage.jsx"
import Login from "./pages/Login.jsx"
import SignUp from "./pages/SignUp.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Expenses from "./pages/Expenses.jsx"
import Budget from "./pages/Budget.jsx"
import Insights from "./pages/Insights.jsx"


function Protected({ user, children }) {
  return user ? children : <Navigate to="/login" replace />
}
function PublicOnly({ user, children }) {
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  const [user, setUser] = useState(undefined)
  console.log("APP USER = ", user)


  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null")
    const hasToken = !!localStorage.getItem("authToken")
    if (storedUser && hasToken) setUser(storedUser)

    const unsub = onAuthStateChanged(auth, u => {
      if (u) {
        setUser({
          id: u.uid,
          email: u.email,
          username: u.displayName || u.email?.split("@")[0]
        })
      } else {
        const su = JSON.parse(localStorage.getItem("user") || "null")
        const tk = localStorage.getItem("authToken")
        setUser(su && tk ? su : null)
      }
    })
    return () => unsub()
  }, [])

  async function handleLogout() {
    await signOut(auth)
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = "/"  
  }

  return user ? (
    <div className="container">
      <nav className="nav" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ alignItems: "center", gap: 12 }}>
          <img src="/cat-envelope.jpg" width="32" height="32" alt="Cashvelo" />
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/budget">Budget</NavLink>
          <NavLink to="/expenses">Spending</NavLink>
          <NavLink to="/insights">Insights</NavLink>
        </div>
        <button onClick={handleLogout} className="btn secondary">Logout</button>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Protected user={user}><Dashboard/></Protected>} />
        <Route path="/budget" element={<Protected user={user}><Budget/></Protected>} />
        <Route path="/expenses" element={<Protected user={user}><Expenses/></Protected>} />
        <Route path="/insights" element={<Protected user={user}><Insights/></Protected>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  ) : (
    <Routes>
      <Route path="/" element={<PublicOnly user={user}><HomePage/></PublicOnly>} />
      <Route path="/login" element={<PublicOnly user={user}><Login/></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly user={user}><SignUp/></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly user={user}><ForgotPassword/></PublicOnly>} />
      <Route path="/reset-password/:token" element={<PublicOnly user={user}><ResetPassword/></PublicOnly>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
