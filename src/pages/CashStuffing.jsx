import { CashStuffingDemo } from "../CashStuffingFeature";
import { useNavigate } from "react-router-dom";

export default function CashStuffing() {
    const navigate = useNavigate();

  return (
    <div className="grid" style={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}>

          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1rem" }}>
    <button className="btn secondary" onClick={() => navigate("/budget")}style={{ backgroundColor: "#e5e7eb", color: "#111", padding: "0.5rem 1rem", borderRadius: "8px",cursor: "pointer", }}>
        ← Back to Budget
    </button>
    </div>

      <h2 style={{ textAlign: "left", marginBottom: "1rem" }}>Cash Stuffing</h2>
      <p style={{ color: "#555", lineHeight: 1.6, margin: "0 auto", textAlign: "left", marginBottom: "2rem" }}>
       
        Cash stuffing is a simple but powerful budgeting method where you divide
          your money into categories, like groceries, gas, and savings, and assign each category a
          specific amount of cash. It’s a hands on way to track spending and stay in control of your
          finances.
      </p>

      <CashStuffingDemo />
    </div>
  );
}
