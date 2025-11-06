import React, { useEffect, useState } from "react"
import { FiSun, FiMoon } from "react-icons/fi"

function applyTheme(dark) {
  const root = document.documentElement
  if (dark) root.classList.add("dark")
  else root.classList.remove("dark")
}

export default function ThemeToggle(){
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("cashvelo_theme")
    if (saved === "dark") return true
    if (saved === "light") return false
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  })

  useEffect(() => {
    applyTheme(dark)
    localStorage.setItem("cashvelo_theme", dark ? "dark" : "light")
  }, [dark])

  return (
    <button
      type="button"
      onClick={() => setDark(d => !d)}
      className="theme-toggle-btn"
      aria-pressed={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
    >
      {dark ? <FiMoon size={20} /> : <FiSun size={20} />}
    </button>
  )
}
