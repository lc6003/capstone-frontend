import React, { useState } from "react"

const API_URL = "http://localhost:3000/api"

export default function ForgotPassword({ setCurrentPage }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Something went wrong")
      }

    } catch (err) {
      console.error("Forgot password error:", err)
      setError("Unable to connect to server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" role="region" aria-label="Forgot password card">
      <div className="card-body">
        <div className="center">
          <div className="illustration" aria-hidden="true">
            <img
              src="/cat-envelope.jpg"
              alt="Cat placing cash into an envelope"
              className="cat-hero"
            />
          </div>
          <h1>Forgot your password? 🐱</h1>
          <p className="subtitle">
            {success 
              ? "Check your email for the reset link" 
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {error && (
              <p className="subtitle" role="alert" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <p className="center subtitle" style={{ marginTop: 16 }}>
              Remember your password?{" "}
              <a 
                className="link" 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage?.("login")
                }}
              >
                Back to login
              </a>
            </p>
          </form>
        ) : (
          <div>
            <div style={{
              background: '#d1fae5',
              border: '1px solid #6ee7b7',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#065f46', margin: 0, fontSize: '14px' }}>
                ✅ If an account exists with this email, you will receive a password reset link shortly.
              </p>
            </div>

            <p className="subtitle" style={{ textAlign: 'center', marginBottom: 16 }}>
              Check your email inbox and spam folder for the reset link.
            </p>

            <button 
              className="btn" 
              onClick={() => setCurrentPage?.("login")}
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}