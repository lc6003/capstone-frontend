import { useNavigate } from "react-router-dom";

export default function Wallet({ name, envelopes }) {
  const navigate = useNavigate();

  {/* Update this path when open wallet is ready */}
  function handleClick() {
    navigate(`/wallets/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`);
  }

  return (
    <div
      onClick={handleClick}
      style={{
        background: "#fff",
        borderRadius: "20px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        padding: "1rem",
        textAlign: "center",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        width: "280px",
        margin: "1rem auto",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
          color: "#333",
        }}
      >
        {name}
      </h3>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Envelopes: {envelopes.length}
      </p>
    </div>
  );
}
