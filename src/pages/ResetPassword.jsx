// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"

const API_URL = "/api"

export default function ResetPassword({ token: tokenProp }) {
  const navigate = useNavigate()
  const { token: tokenFromRoute } = useParams()
  const token = tokenProp ?? tokenFromRoute

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
        const res = await fetch(`${API_URL}/verify-reset-token/${token}`)
        const data = await res.json()
        if (data.valid) setTokenValid(true)
        else setError(data.error || "Invalid or expired reset link")
      } catch (err) {
        console.error("Token verification error:", err)
        setError("Unable to verify reset link")
      } finally {
        setVerifying(false)
      }
    }

    if (token) verifyToken()
    else {
      setError("No reset token provided")
      setVerifying(false)
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) return setError("Please fill in all fields")
    if (password.length < 6) return setError("Password must be at least 6 characters")
    if (password !== confirmPassword) return setError("Passwords do not match")

    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (res.ok) setSuccess(true)
      else setError(data.error || "Failed to reset password")
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
              <img src="/cat-envelope.jpg" alt="Cat placing cash into an envelope" className="cat-hero" />
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
              <img src="/cat-envelope.jpg" alt="Cat placing cash into an envelope" className="cat-hero" />
            </div>
            <h1>Invalid Reset Link 🐱</h1>
            <p className="subtitle" style={{ color: "#dc2626" }}>
              {error || "This password reset link is invalid or has expired."}
            </p>
            <Link className="btn" to="/forgot-password" style={{ marginTop: 20 }}>
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    )
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
      <div className="card" role="region" aria-label="Reset password card">
        <div className="card-body">
          <div className="center">
            <div className="illustration" aria-hidden="true">
              <img src="/cat-envelope.jpg" alt="Cat placing cash into an envelope" className="cat-hero" />
            </div>
            <h1>Reset your password 🐱</h1>
            <p className="subtitle">
              {success ? "Your password has been reset!" : "Enter your new password below"}
            </p>
          </div>
  
          {!success ? (
            <form onSubmit={handleSubmit} noValidate>
              {/* (form stays EXACTLY the same as your code) */}
              ...
            </form>
          ) : (
            <div>
              <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <p style={{ color: "#065f46", margin: 0, fontSize: 14 }}>
                  Your password has been reset successfully!
                </p>
              </div>
  
              <button className="btn" onClick={() => navigate("/login")}>
                Go to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
  
}
