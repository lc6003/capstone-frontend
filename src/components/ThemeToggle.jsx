import { useEffect, useState } from "react";

function applyTheme(dark) {
  const root = document.documentElement;
  if (dark) root.classList.add("dark");
  else root.classList.remove("dark");
}

export default function ThemeToggle(){
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("cashvelo_theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    applyTheme(dark);
    localStorage.setItem("cashvelo_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark(d => !d)}
      className="btn secondary"
      aria-pressed={dark}
      title={dark ? "Switch to light" : "Switch to dark"}
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}