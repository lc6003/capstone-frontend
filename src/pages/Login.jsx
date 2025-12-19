import React, { useState, useEffect } from "react"
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth"
import { useNavigate, Link } from "react-router-dom"
import { auth, googleProvider } from "../firebase"
const API_URL = "/api"

import { useTranslation } from "react-i18next"

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [values, setValues] = useState({ email: "", password: "", remember: true })
  const [errors, setErrors] = useState({})
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          localStorage.setItem("authMethod", "google")
          localStorage.setItem("user", JSON.stringify({
            id: result.user.uid,
            email: result.user.email,
            username: result.user.displayName
          }))
          navigate("/dashboard", { replace: true })
        }
      })
      .catch(console.error)
  }, [navigate])

  function onChange(e) {
    const { name, value, type, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }))
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }))
  }

  //validate email and password
  function validate() {
    const next = {}
    if (!values.email.trim()) next.email = t("login.emailRequired")
    else if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = t("login.emailInvalid")
    if (!values.password) next.password = t("login.passwordRequired")
    return next
  }

  async function onSubmit(e){
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) return

    try{
      setLoginLoading(true)
      setErrors({})//send login request to backend
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim(),
          password: values.password
        })
      })
      const data = await response.json()
      if (response.ok){
        localStorage.setItem("authMethod", "express")
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        window.location.href = "/dashboard"   
      } 
      else {
        setErrors({ email: data.error || t("login.loginFailed") })
      }
    } catch {
      setErrors({ email: t("login.serverError") })
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      setGoogleError("")
      setGoogleLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      localStorage.setItem("authMethod", "google")
      localStorage.setItem("user", JSON.stringify({
        id: result.user.uid,
        email: result.user.email,
        username: result.user.displayName
      }))
      navigate("/dashboard", { replace: true })
    } catch (err) {
      const code = err?.code || ""
      if (code === "auth/popup-blocked") {
        await signInWithRedirect(auth, googleProvider)
      } else {
        setGoogleError(err?.message || t("login.loginFailed"))
      }
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
      <div className="card" role="region" aria-label="Login card">
        <div className="card-body">
          <div className="center">
            <div className="illustration" aria-hidden="true">
              <img
                src="/cat-envelope.jpg"
                alt="Cat placing cash into an envelope"
                className="cat-hero"
              />
            </div>
            <h1>{t("login.title")}</h1>
            <p className="subtitle">
              {t("login.subtitle")}
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email" className="label">{t("login.emailLabel")}</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder={t("login.emailPlaceholder")}
                value={values.email}
                onChange={onChange}
                autoComplete="email"
              />
              {errors.email && (
                <p className="subtitle" role="alert" style={{ color: "#dc2626" }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">{t("login.passwordLabel")}</label>
              <div className="password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder={t("login.passwordPlaceholder")}
                  value={values.password}
                  onChange={onChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="row" style={{ justifyContent:"space-between", marginTop:10 }}>
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="remember"
                  checked={values.remember}
                  onChange={onChange}
                />
                {t("login.rememberMe")}
              </label>
              <Link className="link" to="/forgot-password">{t("login.forgotPassword")}</Link>
            </div>

            <button type="submit" className="btn" disabled={loginLoading}>
              {loginLoading ? t("login.submitLoading") : t("login.submit")}
            </button>
          </form>

          {googleError && (
            <div style={{ color: "crimson", marginTop: 10, fontSize: 14 }}>{googleError}</div>
          )}

          <div className="divider" aria-hidden="true">
            <span className="line" /><span>{t("login.or")}</span><span className="line" />
          </div>

          <div className="social">
            <button type="button" onClick={handleGoogle} disabled={googleLoading}>
              {googleLoading ? t("login.googleLoading") : t("login.google")}
            </button>
            <button type="button">{t("login.microsoft")}</button>
          </div>

          <p className="center subtitle" style={{ marginTop: 16 }}>
            {t("login.newHere")} <Link className="link" to="/signup">{t("login.createAccount")}</Link>
          </p>
        </div>
      </div>
    </div>
  )
} 
