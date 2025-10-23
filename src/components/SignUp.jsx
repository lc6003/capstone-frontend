import React, { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "../firebase"

export default function SignUp({ setCurrentPage }) {
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

    if (!email || !password || !confirm) {
      setError("Please fill in all required fields.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    try {
      setLoading(true)
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() })
      }
      // Navigate to questionnaire after successful signup
      setCurrentPage('questionnaire')
    } catch (err) {
      const msg =
        err?.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : err?.code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : err?.code === "auth/weak-password"
          ? "Your password is too weak."
          : err?.message || "Something went wrong. Please try again."
      setError(msg)
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
