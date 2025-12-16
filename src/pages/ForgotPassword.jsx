import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

const API_URL = "/api"

export default function ForgotPassword() {
  const { t } = useTranslation("common")
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
      setError(t("forgot.errors.enterEmail"))
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t("forgot.errors.validEmail"))
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
      else setError(data.error || t("forgot.errors.generic"))
    } catch (err) {
      console.error("Forgot password error:", err)
      setError(t("forgot.errors.server"))
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
      <div className="card" role="region" aria-label={t("forgot.aria.card")}>
        <div className="card-body">
          <div className="center">
            <div className="illustration" aria-hidden="true">
              <img src="/cat-envelope.jpg" alt={t("forgot.aria.imageAlt")} className="cat-hero" />
            </div>
            <h1>{t("forgot.title")}</h1>
            <p className="subtitle">
              {success ? t("forgot.subtitle.success") : t("forgot.subtitle.default")}
            </p>
          </div>
  
          {!success ? (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email" className="label">{t("forgot.form.emailLabel")}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  placeholder={t("forgot.form.emailPlaceholder")}
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
                {loading ? t("forgot.actions.sending") : t("forgot.actions.sendLink")}
              </button>
  
              <p className="center subtitle" style={{ marginTop: 16 }}>
                {t("forgot.footer.remember")}{" "}
                <Link className="link" to="/login">{t("forgot.footer.backToLogin")}</Link>
              </p>
            </form>
          ) : (
            <div>
              <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <p style={{ color: "#065f46", margin: 0, fontSize: 14 }}>
                  ✅ {t("forgot.success.banner")}
                </p>
              </div>
  
              <p className="subtitle" style={{ textAlign: "center", marginBottom: 16 }}>
                {t("forgot.success.instructions")}
              </p>
  
              <button className="btn" onClick={() => navigate("/login")}>
                {t("forgot.footer.backToLogin")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}  