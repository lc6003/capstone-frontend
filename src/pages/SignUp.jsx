import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth"
import { auth, googleProvider } from "../firebase"

import { useTranslation } from "react-i18next"

const API_URL = "/api"

export default function SignUp() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) return
        localStorage.setItem("authMethod", "google")
        localStorage.setItem("user", JSON.stringify({
          id: result.user.uid,
          email: result.user.email,
          username: result.user.displayName || (result.user.email?.split("@")[0] ?? "User")
        }))
        const token = await result.user.getIdToken()
        localStorage.setItem("authToken", token)
        window.location.href = "/questionnaire"
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 2000)
      })
      .catch((e) => setError(e?.message || t("signup.errorDefault")))
  }, [t])

  async function submit(e) {
    e.preventDefault()
    setError("")
    if (!email || !password || !confirm) return setError(t("signup.errorRequired"))
    if (password.length < 6) return setError(t("signup.errorShortPassword"))
    if (password !== confirm) return setError(t("signup.errorMismatch"))
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: (name || email.split("@")[0]).trim(),
          email: email.trim(),
          password
        })
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem("authMethod", "express")
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        window.location.href = "/questionnaire"
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 2000)
      } else {
        setError(data.error || t("signup.errorDefault"))
      }
    } catch {
      setError(t("signup.serverError"))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    try {
      setError("")
      setGoogleLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      localStorage.setItem("authMethod", "google")
      localStorage.setItem("user", JSON.stringify({
        id: result.user.uid,
        email: result.user.email,
        username: result.user.displayName || (result.user.email?.split("@")[0] ?? "User")
      }))
      const token = await result.user.getIdToken()
      localStorage.setItem("authToken", token)
      window.location.href = "/questionnaire"
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2000)
    } catch (err) {
      const code = err?.code || ""
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, googleProvider)
        return
      }
      setError(err?.message || t("signup.errorDefault"))
    } finally {
      setGoogleLoading(false)
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
      <div className="card" role="region" aria-label="Signup card">
        <div className="card-body">
          <div className="center">
            <div className="illustration">
              <img src="/cat-envelope.jpg" alt="Cashvelo logo" className="cat-hero" />
            </div>
            <h1>{t("signup.title")}</h1>
            <p className="subtitle">{t("signup.subtitle")}</p>
          </div>

          <form onSubmit={submit} noValidate>
            <div className="form-group">
              <label className="label" htmlFor="name">{t("signup.nameLabel")}</label>
              <input
                id="name"
                className="input"
                type="text"
                placeholder={t("signup.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="email">{t("signup.emailLabel")}</label>
              <input
                id="email"
                className="input"
                type="email"
                placeholder={t("signup.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group password-wrap">
              <label className="label" htmlFor="password">{t("signup.passwordLabel")}</label>
              <input
                id="password"
                className="input"
                type={showPwd ? "text" : "password"}
                placeholder={t("signup.passwordPlaceholder")}
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
              <label className="label" htmlFor="confirm">{t("signup.confirmLabel")}</label>
              <input
                id="confirm"
                className="input"
                type={showPwd ? "text" : "password"}
                placeholder={t("signup.confirmPlaceholder")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div style={{ color: "crimson", marginTop: 10, fontSize: 14 }}>{error}</div>
            )}

            <button className="btn" type="submit" disabled={loading}>
              {loading ? t("signup.submitLoading") : t("signup.submit")}
            </button>
          </form>

          <div className="divider" aria-hidden="true">
            <span className="line" /><span>{t("signup.or")}</span><span className="line" />
          </div>

          <div className="social">
            <button type="button" onClick={handleGoogleSignup} disabled={googleLoading}>
              {googleLoading ? t("signup.googleLoading") : t("signup.google")}
            </button>
            <button type="button">{t("signup.microsoft")}</button>
          </div>

          <p className="center subtitle" style={{ marginTop: 16 }}>
            {t("signup.alreadyHaveAccount")}{" "}
            <Link className="link" to="/login">{t("signup.login")}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
