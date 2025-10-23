import React, { useState, useEffect } from "react"
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth"
import { auth, googleProvider } from "../firebase"

export default function Login({ setCurrentPage }) {
  const [showPassword, setShowPassword] = useState(false)
  const [values, setValues] = useState({ email: "", password: "", remember: true })
  const [errors, setErrors] = useState({})
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState("")

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) setCurrentPage?.("home")
      })
      .catch((err) => console.error("Redirect sign-in error:", err))
  }, [setCurrentPage])

  function onChange(e) {
    const { name, value, type, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }))
  }

  function validate() {
    const next = {}
    if (!values.email.trim()) next.email = "Email is required."
    else if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = "Enter a valid email."
    if (!values.password) next.password = "Password is required."
    return next
  }

  function onSubmit(e) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length === 0) {
      // TODO: plug in real auth
      alert(`😺 Logging in as ${values.email}${values.remember ? " (remembered)" : ""}`)
      setCurrentPage?.("home")
    }
  }

  async function handleGoogle() {
    try {
      setGoogleError("")
      setGoogleLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      if (result?.user) setCurrentPage?.("home")
    } catch (err) {
      const code = err?.code || ""
      if (code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider)
      } else if (code === "auth/popup-closed-by-user") {
        setGoogleError("Sign-in was cancelled try again or a different method")
      } else {
        setGoogleError(err?.message || "Google sign-in failed")
        console.error("Google sign-in error:", err)
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="card" role="region" aria-label="Login card">
      <div className="card-body">
        <div className="center">
          <div className="illustration" aria-hidden="true">
            <img
              src="/cat-envelope.jpg"
              alt="Cat placing cash into an envelope"
              className="cat-hero"
            />
          </div>
          <h1>Welcome back 🐱</h1>
          <p className="subtitle">
            Sign in to continue building strong financial habits with Cashvelo.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={values.email}
              onChange={onChange}
              autoComplete="email"
            />
            {errors.email && (
              <p className="subtitle" role="alert" style={{ color: "#dc2626" }}>
                {errors.email}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">Password</label>
            <div className="password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={values.password}
                onChange={onChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="subtitle" role="alert" style={{ color: "#dc2626" }}>
                {errors.password}
              </p>
            )}
          </div>

          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <label
              className="checkbox"
              style={{ color: "#E07A3F", fontWeight: 600, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                name="remember"
                checked={values.remember}
                onChange={onChange}
              />
              Remember me
            </label>

            <a
              className="link"
              href="#"
              style={{ color: "#F4A261", fontWeight: 700, textDecoration: "none" }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Forgot password?
            </a>
          </div>

          {/* Orange sign-in button */}
          <button
            type="submit"
            className="btn"
            style={{
              background: "linear-gradient(135deg,#F4A261,#E07A3F)",
              color: "#fff",
              width: "100%",
              fontWeight: 700,
              borderRadius: 10,
              border: "none",
              padding: "0.9rem 1.2rem",
              boxShadow: "0 8px 20px rgba(240,140,60,0.35)",
              transition: "filter 0.25s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1.0)")}
          >
            Sign in
          </button>

          <div className="divider" aria-hidden="true">
            <div className="line"></div>
            <span>or</span>
            <div className="line"></div>
          </div>

          <div className="social">
            <button type="button" onClick={handleGoogle} disabled={googleLoading}>
              {googleLoading ? "Connecting…" : "Continue with Google"}
            </button>
            <button type="button" disabled>Continue with GitHub</button>
          </div>

          {googleError && (
            <p className="subtitle" role="alert" style={{ color: "#dc2626", marginTop: 12 }}>
              {googleError}
            </p>
          )}
        </form>

        <p className="center subtitle" style={{ marginTop: 16 }}>
          New here?{" "}
          <button
            className="link"
            onClick={() => setCurrentPage('signup')}
            style={{ 
              color: "#F4A261", 
              fontWeight: 700, 
              textDecoration: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "inherit"
            }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  )
}
