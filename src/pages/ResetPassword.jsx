import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import { useTranslation } from "react-i18next"

const API_URL = "http://localhost:3000/api"

export default function ResetPassword() {
  const { t } = useTranslation()
  const { token } = useParams()
  const navigate = useNavigate()

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
      if (!token) {
        setError(t("reset.errors.noToken", "No reset token provided"))
        setVerifying(false)
        return
      }

      try {//Call backend to verify token validity
        const response = await fetch(`${API_URL}/verify-reset-token/${token}`)
        const data = await response.json()

        if (data.valid) {
          setTokenValid(true)
        } else {
          setError(
            data.error ||
              t("reset.errors.invalidOrExpired", "Invalid or expired reset link")
          )
        }
      } catch (err) {
        console.error("Token verification error:", err)
        setError(t("reset.errors.verifyFail", "Unable to verify reset link"))
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) {
      setError(t("reset.errors.fillAll", "Please fill in all fields"))
      return
    }

    if (password.length < 6) {//minimum password length
      setError(t("reset.errors.minLen", "Password must be at least 6 characters"))
      return
    }

    if (password !== confirmPassword) {//Password must match
      setError(t("reset.errors.noMatch", "Passwords do not match"))
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/reset-password/${token}`, {//Send password reset request with token
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || t("reset.errors.failed", "Failed to reset password"))
      }
    } catch (err) {
      console.error("Reset password error:", err)
      setError(t("reset.errors.server", "Unable to connect to server. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="logo">🐱</div>
            <div>Cashvelo</div>
          </div>
          <ThemeToggle />
        </header>

        <main className="main">
          <div className="card">
            <div className="card-body">
              <div className="center">
                <div className="illustration">
                  <img
                    src="/cat-envelope.jpg"
                    alt={t("reset.aria.logoAlt", "Cashvelo logo")}
                    className="cat-hero"
                  />
                </div>
                <p className="subtitle">
                  {t("reset.verifying", "Verifying reset link...")}
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="footer">© {new Date().getFullYear()} Cashvelo</footer>
      </div>
    )
  }

  if (!tokenValid && !success) {
    return (
      <div className="container">
        <header className="header">
          <div className="brand">
            <div className="logo">🐱</div>
            <div>Cashvelo</div>
          </div>
          <ThemeToggle />
        </header>

        <main className="main">
          <div className="card">
            <div className="card-body">
              <div className="center">
                <div className="illustration">
                  <img
                    src="/cat-envelope.jpg"
                    alt={t("reset.aria.logoAlt", "Cashvelo logo")}
                    className="cat-hero"
                  />
                </div>
                <h1>{t("reset.invalid.title", "Invalid Reset Link 🐱")}</h1>
                <p className="subtitle" style={{ color: "#dc2626" }}>
                  {error ||
                    t(
                      "reset.invalid.defaultError",
                      "This password reset link is invalid or has expired."
                    )}
                </p>
                <button
                  className="btn"
                  onClick={() => navigate("/forgot-password")}
                  style={{ marginTop: 20 }}
                >
                  {t("reset.invalid.requestNew", "Request new reset link")}
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="footer">© {new Date().getFullYear()} Cashvelo</footer>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo">🐱</div>
          <div>Cashvelo</div>
        </div>
        <ThemeToggle />
      </header>

      <main className="main">
        <div className="card">
          <div className="card-body">
            <div className="center">
              <div className="illustration">
                <img
                  src="/cat-envelope.jpg"
                  alt={t("reset.aria.logoAlt", "Cashvelo logo")}
                  className="cat-hero"
                />
              </div>
              <h1>{t("reset.title", "Reset your password 🐱")}</h1>
              <p className="subtitle">
                {success
                  ? t("reset.subtitle.success", "Your password has been reset!")
                  : t("reset.subtitle.default", "Enter your new password below")}
              </p>
            </div>

            {!success ? (
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="password" className="label">
                    {t("reset.form.newPassword", "New password")}
                  </label>
                  <div className="password-wrap">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="input"
                      placeholder={t("reset.form.minChars", "At least 6 characters")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-eye"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword
                          ? t("reset.form.hidePasswordAria", "Hide password")
                          : t("reset.form.showPasswordAria", "Show password")
                      }
                    >
                      {showPassword
                        ? t("reset.form.hide", "Hide")
                        : t("reset.form.show", "Show")}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirm" className="label">
                    {t("reset.form.confirmPassword", "Confirm new password")}
                  </label>
                  <input
                    id="confirm"
                    name="confirm"
                    type={showPassword ? "text" : "password"}
                    className="input"
                    placeholder={t("reset.form.reenter", "Re-enter password")}
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
                  {loading
                    ? t("reset.actions.resetting", "Resetting password...")
                    : t("reset.actions.reset", "Reset password")}
                </button>
              </form>
            ) : (
              <div>
                <div
                  style={{
                    background: "#d1fae5",
                    border: "1px solid #6ee7b7",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "20px"
                  }}
                >
                  <p style={{ color: "#065f46", margin: 0, fontSize: "14px" }}>
                    ✅{" "}
                    {t(
                      "reset.success.banner",
                      "Your password has been reset successfully!"
                    )}
                  </p>
                </div>

                <button className="btn" onClick={() => navigate("/login")}>
                  {t("reset.actions.goLogin", "Go to login")}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="footer">© {new Date().getFullYear()} Cashvelo</footer>
    </div>
  )
}
