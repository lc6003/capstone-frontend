import { useTranslation } from "react-i18next"

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const current = (i18n.resolvedLanguage || i18n.language || "en")
    .toLowerCase()
    .startsWith("es")
    ? "es"
    : "en"

  return (
    <div className="lang-switch">
      <button
        type="button"
        className={`nav-link pill lang-pill ${current === "en" ? "active" : ""}`}
        onClick={() => i18n.changeLanguage("en")}
      >
        EN
      </button>

      <button
        type="button"
        className={`nav-link pill lang-pill ${current === "es" ? "active" : ""}`}
        onClick={() => i18n.changeLanguage("es")}
      >
        ES
      </button>
    </div>
  )
}

