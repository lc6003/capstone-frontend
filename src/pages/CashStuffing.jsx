import { CashStuffingDemo } from "../CashStuffingFeature";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CashStuffing() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  return (
    <div className="page-container" 
      style={{
        padding: "2rem",
        color: "var(--text)",
        background: "var(--bg)",     // ← same background as the whole app
        minHeight: "100vh"
      }}
    >

      {/* BACK BUTTON */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem" }}>
        <button
          className="btn secondary"
          onClick={() => navigate("/budget")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
          }}
        >
          ← {t("cashStuffing.back", "Back to Budget")}
        </button>
      </div>

      {/* PAGE TITLE */}
      <h2 style={{ 
        textAlign: "left",
        marginBottom: "0.75rem",
        color: "var(--text)"
      }}>
        {t("cashStuffing.title", "Cash Stuffing")}
      </h2>

      {/* DESCRIPTION */}
      <p
        style={{
          maxWidth: "none",
          textAlign: "left",
          marginBottom: "2rem",
          lineHeight: 1.6,
          color: "var(--muted)"
        }}
      >
        {t(
          "cashStuffing.description",
          "Cash stuffing is a simple but powerful budgeting method where you divide your money into categories—like groceries, gas, and savings—and assign each category a specific amount of cash. It's a hands-on way to track spending and take control of your finances."
        )}
      </p>

      {/* MAIN FEATURE */}
      <CashStuffingDemo />
    </div>
  );
}