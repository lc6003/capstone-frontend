import React, { useState } from "react"

const API_URL = "http://localhost:3000/api"

export default function ForgotPassword({ setCurrentPage }) {
    const [step, setStep] = useState(1)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleUsernameSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if(!username.trim()){
            setError("Please enter your username")
            return
        }

        try {
            setLoading(true)

            const response = await fetch(`${API_URL}/verify-username`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username.trim() })
            })

            const data = await response.json()

            if(response.ok){
                setStep(2)
            }
            else{
                setError(data.error || "Username not found")
            }
        }   catch (err) {
            console.error("Username verification error:", err)
            setError("Unable to connect to server. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if(!password || !confirmPassword) {
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

            const response = await fetch (`${API_URL}/forgot-password-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password 
                })
            })

            const data = await response.json()

            if(response.ok){
                alert("Password reset successful! You can now log in with your new password.")
                setCurrentPage?.("login")
            }
            else{
                setError(data.error || "Failed to reset password")
            }
        }   catch (err){
            console.error("Reset password error:", err)
            setError("Unable to connect to server. Please try again.")
        }   finally {
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
            {step === 1 
              ? "Enter your username to reset your password" 
              : `Hi ${username}! Enter your new password`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleUsernameSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username" className="label">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            {error && (
              <p className="subtitle" role="alert" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Verifying..." : "Continue"}
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
          <form onSubmit={handlePasswordSubmit} noValidate>
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

            <p className="center subtitle" style={{ marginTop: 16 }}>
              Wrong username?{" "}
              <a 
                className="link" 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setStep(1)
                  setPassword("")
                  setConfirmPassword("")
                  setError("")
                }}
              >
                Go back
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}