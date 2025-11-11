import Binder from "./components/Binder";
import Wallet from "./components/Wallet";
import "./cashStuffing.css";

export default function CashStuffingDemo() {
  // Temporary demo data — later we’ll pull this from storage.js
  const sampleEnvelopes = [
    { id: 1, label: "Groceries", amount: 120 },
    { id: 2, label: "Gas", amount: 60 },
    { id: 3, label: "Savings", amount: 200 },
    { id: 4, label: "Other", amount: 100 },
  ];

  return (
    <div className="cash-container">
        <h1 className="title">Your Wallet and Binders</h1>

        <p className="subtitle" style={{ maxWidth: "550px", margin: "0 auto", marginBottom: "0.25rem", textAlign: "center",lineHeight: 1.6, }}>
        You can create wallets and binders, label envelopes, and allocate amounts — just like stuffing cash into real envelopes.
        </p>

      <div className="wallet-section">
        <Wallet name="Daily Wallet" envelopes={sampleEnvelopes} />
      </div>

      <div className="binder-grid">
        <Binder name="Bills Binder" envelopes={sampleEnvelopes} />
        <Binder name="Subscriptions Binder" envelopes={sampleEnvelopes} />
        <Binder name="Gift Binder" envelopes={sampleEnvelopes} />
        <Binder name="Gift Binder" envelopes={sampleEnvelopes} />
      </div>
    </div>
  );
}
