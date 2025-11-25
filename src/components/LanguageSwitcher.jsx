import React from "react"
import { useTranslation } from "react-i18next"

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        onClick={() => changeLanguage("en")}
        disabled={i18n.language === "en"}
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => changeLanguage("es")}
        disabled={i18n.language === "es"}
      >
        ES
      </button>
    </div>
  )
}