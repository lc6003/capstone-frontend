import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

const API_URL = "/api"

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!email.trim()) {
      setError(t("forgot.errors.enterEmail", "Please enter your email address"))
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t("forgot.errors.validEmail", "Please enter a valid email address"))
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      })
      const data = await response.json()
      if (response.ok) setSuccess(true)
      else setError(data.error || t("forgot.errors.generic", "Something went wrong"))
    } catch (err) {
      console.error("Forgot password error:", err)
      setError(
        t(
          "forgot.errors.server",
          "Unable to connect to server. Please try again."
        )
      )
    } finally {
      setLoading(false)
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
      <div
        className="card"
        role="region"
        aria-label={t("forgot.aria.card", "Forgot password card")}
      >
        <div className="card-body">
          <div className="center">
            <div className="illustration" aria-hidden="true">
              <img
                src="/cat-envelope.jpg"
                alt={t(
                  "forgot.aria.imageAlt",
                  "Cat placing cash into an envelope"
                )}
                className="cat-hero"
              />
            </div>

            <h1>{t("forgot.title", "Forgot your password? 🐱")}</h1>

            <p className="subtitle">
              {success
                ? t("forgot.subtitle.success", "Check your email for the reset link")
                : t(
                    "forgot.subtitle.default",
                    "Enter your email and we'll send you a reset link"
                  )}
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email" className="label">
                  {t("forgot.form.emailLabel", "Email address")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  placeholder={t("forgot.form.emailPlaceholder", "you@example.com")}
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
                {loading
                  ? t("forgot.actions.sending", "Sending...")
                  : t("forgot.actions.sendLink", "Send reset link")}
              </button>

              <p className="center subtitle" style={{ marginTop: 16 }}>
                {t("forgot.footer.remember", "Remember your password?")}{" "}
                <Link className="link" to="/login">
                  {t("forgot.footer.backToLogin", "Back to login")}
                </Link>
              </p>
            </form>
          ) : (
            <div>
              <div
                style={{
                  background: "#d1fae5",
                  border: "1px solid #6ee7b7",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 20
                }}
              >
                <p style={{ color: "#065f46", margin: 0, fontSize: 14 }}>
                  ✅{" "}
                  {t(
                    "forgot.success.banner",
                    "If an account exists with this email, you will receive a password reset link shortly."
                  )}
                </p>
              </div>

              <p className="subtitle" style={{ textAlign: "center", marginBottom: 16 }}>
                {t(
                  "forgot.success.instructions",
                  "Check your email inbox and spam folder for the reset link."
                )}
              </p>

              <button className="btn" onClick={() => navigate("/login")}>
                {t("forgot.footer.backToLogin", "Back to login")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
