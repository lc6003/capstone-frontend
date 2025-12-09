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
import QuestionnairePage from "./pages/QuestionnairePage.jsx"
import Settings from "./pages/Settings.jsx"
import LanguageSwitcher from "./components/LanguageSwitcher.jsx"
import { useTranslation } from "react-i18next"

function Protected({ user, children }) {
  return user ? children : <Navigate to="/login" replace />
}

function PublicOnly({ user, children }) {
  return user ? <Navigate to="/dashboard" replace /> : children
}

const getInitialUser = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null")
    const hasToken = !!localStorage.getItem("authToken")
    if (storedUser && hasToken) {
      return storedUser
    }
  } catch (e) {
    console.error("Error reading user from localStorage:", e)
  }
  return undefined
}

export default function App() {
  const [user, setUser] = useState(getInitialUser)
  const { t } = useTranslation()
  console.log("APP USER = ", user)

  useEffect(() => {
    const checkLocalStorage = () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null")
      const hasToken = !!localStorage.getItem("authToken")
      if (storedUser && hasToken) {
        setUser(storedUser)
        return true
      }
      return false
    }

    if (!user) {
      checkLocalStorage()
    }

    const handleAuthChange = () => {
      checkLocalStorage()
    }
    window.addEventListener("authStateChanged", handleAuthChange)

    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === "authToken") {
        checkLocalStorage()
      }
    }
    window.addEventListener("storage", handleStorageChange)

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
    
    return () => {
      unsub()
      window.removeEventListener("authStateChanged", handleAuthChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  async function handleLogout() {
    // preserve theme like in their file
    const theme = localStorage.getItem("cashvelo_theme")
    await signOut(auth)
    localStorage.clear()
    sessionStorage.clear()
    if (theme) {
      localStorage.setItem("cashvelo_theme", theme)
    }
    window.location.href = "/"
  }

  return user ? (
    <div className="container">
      <nav className="nav">
        <div className="left">
          <img
            src="/cat-envelope.jpg"
            className="logo-img"
            alt={t("app.logoAlt", "Cashvelo")}
          />
          <NavLink to="/dashboard" end>
            {t("dashboard.nav.dashboard", "Dashboard")}
          </NavLink>
          <NavLink to="/budget">
            {t("dashboard.nav.budget", "Budget")}
          </NavLink>
          <NavLink to="/expenses">
            {t("dashboard.nav.expenses", "Spending")}
          </NavLink>
          <NavLink to="/insights">
            {t("dashboard.nav.insights", "Insights")}
          </NavLink>
        </div>
        <div className="right">
          <ThemeToggle />
          {/* settings button from their file */}
          <NavLink to="/settings" className="btn ghost">
            ⚙️
          </NavLink>
          <LanguageSwitcher />
          <button onClick={handleLogout} className="btn ghost logout">
            {t("dashboard.nav.logout", "Logout")}
          </button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/questionnaire"
          element={
            <Protected user={user}>
              <QuestionnairePage />
            </Protected>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Protected user={user}>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/budget"
          element={
            <Protected user={user}>
              <Budget />
            </Protected>
          }
        />
        <Route
          path="/expenses"
          element={
            <Protected user={user}>
              <Expenses />
            </Protected>
          }
        />
        <Route
          path="/insights"
          element={
            <Protected user={user}>
              <Insights />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected user={user}>
              <Settings />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  ) : (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px" }}>
        <LanguageSwitcher />
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <PublicOnly user={user}>
              <HomePage />
            </PublicOnly>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnly user={user}>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly user={user}>
              <SignUp />
            </PublicOnly>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnly user={user}>
              <ForgotPassword />
            </PublicOnly>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicOnly user={user}>
              <ResetPassword />
            </PublicOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
