import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function EnvelopePage() {
  const { type, name } = useParams(); // "wallets" | "binders" and "daily-wallet" | "savings-binder"
  const [envelopes, setEnvelopes] = useState([]);

  // Construct the storage key
  const storageKey = `${type}:${name}`;

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setEnvelopes(saved);
  }, [storageKey]);

  const imageSrc =
    type === "wallets"
      ? "/open-wallet-clear.png"
      : "/open-binder-clear.png";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#fdf8f3",
        gap: "3rem",
        padding: "2rem",
      }}
    >
      {/* Left side: Cash placeholder */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "180px",
            height: "250px",
            border: "2px dashed #d6b58d",
            borderRadius: "12px",
            backgroundColor: "#fffaf3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ color: "#a77a3b", fontWeight: "500" }}>Cash Placeholder</p>
        </div>
      </div>

      {/* Center: Open wallet/binder with data */}
      <div style={{ position: "relative", textAlign: "center" }}>
        <img
          src={imageSrc}
          alt={type}
          style={{
            width: "480px",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.15))",
            transform: "rotate(-90deg)", 
            transition: "transform 0.3s ease",
          }}
        />
        <h2
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "1.4rem",
            fontWeight: "600",
            color: "#5a3e1b",
          }}
        >
          {name?.replace(/-/g, " ")}
        </h2>

        {/* Display Envelopes Below */}
        <div style={{ marginTop: "2rem" }}>
          {envelopes.length > 0 ? (
            envelopes.map((e, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  border: "1px solid #e0c9a6",
                  borderRadius: "10px",
                  padding: "0.5rem 1rem",
                  margin: "0.5rem auto",
                  width: "60%",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                }}
              >
                <strong>{e.name}</strong>: ${e.amount}
              </div>
            ))
          ) : (
            <p style={{ color: "#666" }}>No envelopes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
