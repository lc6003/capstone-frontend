import React, { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "../firebase"

const API_URL = "http://localhost:3000/api"

export default function SignUp({ onSuccess }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    setError("")

    if(!email || !password || !confirm){
      setError("Please fill in all required fields.")
      return
    }
    if(password.length < 6){
      setError("Password must be at least 6 characters")
      return
    }
    if(password != confirm){
      setError("Password do not match.")
      return
    }
    try {
      setLoading(true)
      
      // Call your Express backend
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: name.trim() || email.split('@')[0], // Use name or email prefix as username
          email: email.trim(), 
          password 
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Store authentication info
        localStorage.setItem('authMethod', 'express')
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        console.log("Signed up successfully:", data.user)
        
        // Call success callback
        if (typeof onSuccess === "function") {
          onSuccess(data.user)
        }
      } else {
        // Handle backend errors
        setError(data.error || "Something went wrong. Please try again.")
      }
      
    } catch (err) {
      console.error("Signup error:", err)
      setError("Unable to connect to server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="center">
          <div className="illustration">
            {/* swapped the dark svg for the colorful jpg logo */}
            <img src="/cat-envelope.jpg" alt="Cashvelo logo" className="cat-hero" />
          </div>
          <h1>Create your account</h1>
          <p className="subtitle">Join Cashvelo to budget smarter.</p>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="form-group">
            <label className="label" htmlFor="name">Full name (optional)</label>
            <input
              id="name"
              className="input"
              type="text"
              placeholder="e.g., Alex Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group password-wrap">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type={showPwd ? "text" : "password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="toggle-eye"
              onClick={() => setShowPwd((s) => !s)}
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              className="input"
              type={showPwd ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error ? (
            <div style={{ color: "crimson", marginTop: 10, fontSize: 14 }}>{error}</div>
          ) : null}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="divider">
          <span className="line" />
          <span>or</span>
          <span className="line" />
        </div>

        <div className="social">
          <button type="button">Continue with Google</button>
          <button type="button">Continue with Apple</button>
        </div>
      </div>
    </div>
  )
}
