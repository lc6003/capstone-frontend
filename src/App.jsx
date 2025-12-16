import React, { useEffect, useState } from "react"
import { Routes, Route, Navigate, NavLink } from "react-router-dom"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "./firebase"
import { useTranslation } from "react-i18next"
import { FiSettings } from "react-icons/fi"

import ThemeToggle from "./components/ThemeToggle.jsx"
import LanguageSwitcher from "./components/LanguageSwitcher.jsx"
import HomePage from "./pages/HomePage.jsx"
import Login from "./pages/Login.jsx"
import SignUp from "./pages/SignUp.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Expenses from "./pages/Expenses.jsx"
import Budget from "./pages/Budget.jsx"
import Insights from "./pages/Insights.jsx"
import Settings from "./pages/Settings.jsx"  
import CashStuffing from "./pages/CashStuffing.jsx";
import EnvelopePage from "./pages/EnvelopePage.jsx";import React, { useEffect, useState } from "react"
import { Routes, Route, Navigate, NavLink } from "react-router-dom"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "./firebase"
import { useTranslation } from "react-i18next"
import { FiSettings } from "react-icons/fi"

import ThemeToggle from "./components/ThemeToggle.jsx"
import LanguageSwitcher from "./components/LanguageSwitcher.jsx"
import HomePage from "./pages/HomePage.jsx"
import Login from "./pages/Login.jsx"
import SignUp from "./pages/SignUp.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Expenses from "./pages/Expenses.jsx"
import Budget from "./pages/Budget.jsx"
import Insights from "./pages/Insights.jsx"
import Settings from "./pages/Settings.jsx"  
import CashStuffing from "./pages/CashStuffing.jsx";
import EnvelopePage from "./pages/EnvelopePage.jsx";


function Protected({ user, children }) {
  return user ? children : <Navigate to="/login" replace />
}
function PublicOnly({ user, children }) {
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const { t } = useTranslation("common")
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
    const theme = localStorage.getItem("cashvelo_theme")
    await signOut(auth)
    localStorage.clear()
    sessionStorage.clear()
    if(theme){
      localStorage.setItem("cashvelo_theme", theme)
    }
    window.location.href = "/"  
  }

  return user ? (
    <div className="container">
      <nav className="nav">
        <div className="left">
          <img src="/cat-envelope.jpg" className="logo-img" alt="Cashvelo" />
          <NavLink to="/dashboard" end>
            {t("nav.dashboard", "Dashboard")}
          </NavLink>
          <NavLink to="/budget">
            {t("nav.budget", "Budget")}
          </NavLink>
          <NavLink to="/cash-stuffing">
            {t("nav.cashStuffing", "Cash Stuffing")}
          </NavLink>
          <NavLink to="/expenses">
            {t("nav.spending", "Spending")}
          </NavLink>
          <NavLink to="/insights">
            {t("nav.insights", "Insights")}
          </NavLink>
        </div>
        <div className="right">
          <LanguageSwitcher />
          <ThemeToggle />
          <NavLink to="/settings" className="btn ghost icon-btn">
            <FiSettings size={20} />
          </NavLink>
          <button onClick={handleLogout} className="btn ghost logout">
            {t("nav.logout", "Logout")}
          </button>
        </div>
      </nav>



      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Protected user={user}><Dashboard/></Protected>} />
        <Route path="/budget" element={<Protected user={user}><Budget/></Protected>} />
        <Route path="/expenses" element={<Protected user={user}><Expenses/></Protected>} />
        <Route path="/insights" element={<Protected user={user}><Insights/></Protected>} />
        <Route path="/cash-stuffing" element={<Protected user={user}><CashStuffing/></Protected>} />
        <Route path="/:type/:name"element={<Protected user={user}><EnvelopePage /></Protected>} />
        <Route path="/settings" element={<Protected user={user}><Settings/></Protected>} />
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


function Protected({ user, children }) {
  return user ? children : <Navigate to="/login" replace />
}
function PublicOnly({ user, children }) {
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const { t } = useTranslation("common")
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
    const theme = localStorage.getItem("cashvelo_theme")
    await signOut(auth)
    localStorage.clear()
    sessionStorage.clear()
    if(theme){
      localStorage.setItem("cashvelo_theme", theme)
    }
    window.location.href = "/"  
  }

  return user ? (
    <div className="container">
      <nav className="nav">
        <div className="left">
          <img src="/cat-envelope.jpg" className="logo-img" alt="Cashvelo" />
          <NavLink to="/dashboard" end>
            {t("nav.dashboard", "Dashboard")}
          </NavLink>
          <NavLink to="/budget">
            {t("nav.budget", "Budget")}
          </NavLink>
          <NavLink to="/cash-stuffing">
            {t("nav.cashStuffing", "Cash Stuffing")}
          </NavLink>
          <NavLink to="/expenses">
            {t("nav.spending", "Spending")}
          </NavLink>
          <NavLink to="/insights">
            {t("nav.insights", "Insights")}
          </NavLink>
        </div>
        <div className="right">
          <LanguageSwitcher />
          <ThemeToggle />
          <NavLink to="/settings" className="btn ghost icon-btn">
            <FiSettings size={20} />
          </NavLink>
          <button onClick={handleLogout} className="btn ghost logout">
            {t("nav.logout", "Logout")}
          </button>
        </div>
      </nav>



      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Protected user={user}><Dashboard/></Protected>} />
        <Route path="/budget" element={<Protected user={user}><Budget/></Protected>} />
        <Route path="/expenses" element={<Protected user={user}><Expenses/></Protected>} />
        <Route path="/insights" element={<Protected user={user}><Insights/></Protected>} />
        <Route path="/cash-stuffing" element={<Protected user={user}><CashStuffing/></Protected>} />
        <Route path="/:type/:name"element={<Protected user={user}><EnvelopePage /></Protected>} />
        <Route path="/settings" element={<Protected user={user}><Settings/></Protected>} />
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
