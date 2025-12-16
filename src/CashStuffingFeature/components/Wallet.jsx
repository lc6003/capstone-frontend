import { useNavigate } from "react-router-dom";

export default function Wallet({ name, envelopes }) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(
      `/wallets/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`
    );
  }

  return (
    <div
      onClick={handleClick}
      style={{
        background: "var(--card)",          // CHANGED
        border: "1px solid var(--border)", // ADDED
        borderRadius: "20px",
        boxShadow: "var(--shadow)",        // CHANGED
        padding: "1rem",
        textAlign: "center",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        width: "280px",
        margin: "1rem auto",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.03)";
        e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "var(--shadow)";
      }}
    >
      <img
        src="/wallet-1-clear.png"
        alt={name}
        style={{
          width: "220px",
          height: "150px",
          objectFit: "contain",
          marginBottom: "1rem",
        }}
      />

      <h3
        style={{
          fontWeight: "600",
          fontSize: "1.1rem",
          marginBottom: "0.25rem",
          color: "var(--text)",            // CHANGED
        }}
      >
        {name}
      </h3>

      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>  {/* CHANGED */}
        Envelopes: {envelopes.length}
      </p>
    </div>
  );
}