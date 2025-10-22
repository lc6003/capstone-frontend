import React, { useState, useEffect } from "react"
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth"
import { auth, googleProvider } from "../firebase"

const API_URL = "http://localhost:3000/api"

export default function Login({ setCurrentPage }) {
  const [showPassword, setShowPassword] = useState(false)
  const [values, setValues] = useState({ email: "", password: "", remember: true })
  const [errors, setErrors] = useState({})
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // Handle Google redirect result when coming back from auth
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Signed in (redirect):", result.user)
          localStorage.setItem('authMethod', 'google')
          localStorage.setItem('user', JSON.stringify({
            id: result.user.uid,
            email: result.user.email,
            username: result.user.displayName
          }))
          setCurrentPage?.("home")
        }
      })
      .catch((err) => {
        console.error("Redirect sign-in error:", err)
      })
  }, [setCurrentPage])

  function onChange(e) {
    const { name, value, type, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }))

    if(errors[name]){
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
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

    if(Object.keys(next).length === 0){
      try{
        setLoginLoading(true)
        setErrors({})

        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: values.email.trim(),
            password: values.password
          })
        })

        const data = await response.json()

        if(response.ok){
          localStorage.setItem('authMethod', 'express')
          localStorage.setItem('authToken', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))

          console.log("Logged in successfully:", data.user)
          setCurrentPage?.("home")
        } else {
          setErrors({ email: data.error || "Login failed" })
        }

      } catch (err) {
        console.error("Login error:", err)
        setErrors({ email: "Unable to connect to server. Please try again." })
      } finally {
        setLoginLoading(false)
      }
    }
  }

async function handleGoogle() {
    try {
      setGoogleError("")
      setGoogleLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      console.log("Signed in (popup):", result.user)
      
      // Store Google user info
      localStorage.setItem('authMethod', 'google')
      localStorage.setItem('user', JSON.stringify({
        id: result.user.uid,
        email: result.user.email,
        username: result.user.displayName
      }))
      
      setCurrentPage?.("home")
    } catch (err) {
      const code = err?.code || ""
      if (code === "auth/popup-blocked") {
        // Fallback to redirect if popup is blocked
        await signInWithRedirect(auth, googleProvider)
      } else if (code === "auth/popup-closed-by-user"){
        setGoogleError("Sign-in was cancelled - try again or use a different method")
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

          <div className="row">
            <label className="checkbox">
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
              onClick={(e) => {
                e.preventDefault()
                setCurrentPage("forgot-password")
              }}
            >
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn">Log in</button>

          <div className="divider" aria-hidden="true">
            <div className="line"></div>
            <span>or</span>
            <div className="line"></div>
          </div>

          <div className="social">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? "Connecting…" : "Continue with Google"}
            </button>
            <button type="button" disabled>
              Continue with GitHub
            </button>
          </div>

          {googleError && (
            <p
              className="subtitle"
              role="alert"
              style={{ color: "#dc2626", marginTop: 12 }}
            >
              {googleError}
            </p>
          )}
        </form>

        <p className="center subtitle" style={{ marginTop: 16 }}>
          New here? <a className="link" href="#">Create an account</a>
        </p>
      </div>
    </div>
  )
}
