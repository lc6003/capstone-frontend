import React, { useState, useEffect } from "react"

const API_URL = "http://localhost:3000/api"

export default function ResetPassword({ token, setCurrentPage }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_URL}/verify-reset-token/${token}`)
        const data = await response.json()

        if (data.valid) {
          setTokenValid(true)
        } else {
          setError(data.error || "Invalid or expired reset link")
        }
      } catch (err) {
        console.error("Token verification error:", err)
        setError("Unable to verify reset link")
      } finally {
        setVerifying(false)
      }
    }

    if (token) {
      verifyToken()
    } else {
      setError("No reset token provided")
      setVerifying(false)
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Failed to reset password")
      }

    } catch (err) {
      console.error("Reset password error:", err)
      setError("Unable to connect to server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="card" role="region" aria-label="Verifying reset link">
        <div className="card-body">
          <div className="center">
            <div className="illustration" aria-hidden="true">
              <img
                src="/cat-envelope.jpg"
                alt="Cat placing cash into an envelope"
                className="cat-hero"
              />
            </div>
            <p className="subtitle">Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenValid && !success) {
    return (
      <div className="card" role="region" aria-label="Invalid reset link">
        <div className="card-body">
          <div className="center">
            <div className="illustration" aria-hidden="true">
              <img
                src="/cat-envelope.jpg"
                alt="Cat placing cash into an envelope"
                className="cat-hero"
              />
            </div>
            <h1>Invalid Reset Link 🐱</h1>
            <p className="subtitle" style={{ color: '#dc2626' }}>
              {error || "This password reset link is invalid or has expired."}
            </p>
            <button 
              className="btn" 
              onClick={() => setCurrentPage?.("forgot-password")}
              style={{ marginTop: 20 }}
            >
              Request new reset link
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card" role="region" aria-label="Reset password card">
      <div className="card-body">
        <div className="center">
          <div className="illustration" aria-hidden="true">
            <img
              src="/cat-envelope.jpg"
              alt="Cat placing cash into an envelope"
              className="cat-hero"
            />
          </div>
          <h1>Reset your password 🐱</h1>
          <p className="subtitle">
            {success ? "Your password has been reset!" : "Enter your new password below"}
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="password" className="label">New password</label>
              <div className="password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
            </div>

            <div className="form-group">
              <label htmlFor="confirm" className="label">Confirm new password</label>
              <input
                id="confirm"
                name="confirm"
                type={showPassword ? "text" : "password"}
                className="input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="subtitle" role="alert" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Resetting password..." : "Reset password"}
            </button>
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
                Your password has been reset successfully!
              </p>
            </div>

            <button 
              className="btn" 
              onClick={() => setCurrentPage?.("login")}
            >
              Go to login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}