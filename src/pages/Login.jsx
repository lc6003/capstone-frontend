import React, { useState, useEffect } from "react"
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth"
import { useNavigate, Link } from "react-router-dom"
import { auth, googleProvider } from "../firebase"
const API_URL = "/api"

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [values, setValues] = useState({ email: "", password: "", remember: true })
  const [errors, setErrors] = useState({})
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          localStorage.setItem("authMethod", "google")
          localStorage.setItem("user", JSON.stringify({
            id: result.user.uid,
            email: result.user.email,
            username: result.user.displayName
          }))
          navigate("/dashboard", { replace: true })
        }
      })
      .catch(console.error)
  }, [navigate])

  function onChange(e) {
    const { name, value, type, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }))
  }

  function validate() {
    const next = {}
    if (!values.email.trim()) next.email = "Email is required."
    else if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = "Enter a valid email."
    if (!values.password) next.password = "Password is required."
    return next
  }

  async function onSubmit(e){
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) return

    try{
      setLoginLoading(true)
      setErrors({})
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim(),
          password: values.password
        })
      })
      const data = await response.json()
      if (response.ok){
        localStorage.setItem("authMethod", "express")
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        window.location.href = "/dashboard"   
      } 
     else {
        setErrors({ email: data.error || "Login failed" })
      }
    } catch {
      setErrors({ email: "Unable to connect to server. Please try again." })
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      setGoogleError("")
      setGoogleLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      localStorage.setItem("authMethod", "google")
      localStorage.setItem("user", JSON.stringify({
        id: result.user.uid,
        email: result.user.email,
        username: result.user.displayName
      }))
      navigate("/dashboard", { replace: true })
    } catch (err) {
      const code = err?.code || ""
      if (code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider)
      } else {
        setGoogleError(err?.message || "Google sign-in failed")
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
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
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn" disabled={loginLoading}>
              {loginLoading ? "Signing in…" : "Log in"}
            </button>

            <p className="center subtitle" style={{ marginTop: 16 }}>
              New here? <Link className="link" to="/signup">Create an account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
