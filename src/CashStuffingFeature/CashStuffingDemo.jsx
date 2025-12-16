import { useState, useEffect } from "react";
import Binder from "./components/Binder";
import Wallet from "./components/Wallet";
import "../styles/CashStuffing.css";

import {
  getWalletEnvelopes,
  getVariableBinderEnvelopes,
  getBinders,
  addBinder,
  renameBinder,
  removeBinder,
} from "../lib/cashSync.js";

import {
  getCashEnvelopes,
  ensureEnvelope
} from "../lib/cashStuffingStorage.js";


export default function CashStuffingDemo() {
 
  function envelopeBalance(name) {
    const data = getCashEnvelopes();
    return data[name]?.balance ?? 0;
  }

  /* -------------------------------
     BINDER SYSTEM
  --------------------------------*/
  const [binders, setBinders] = useState(() => getBinders());
  const [addingBinder, setAddingBinder] = useState(false);
  const [newBinderName, setNewBinderName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");

  const walletEnvelopes = getWalletEnvelopes();
  const variableEnvelopes = getVariableBinderEnvelopes();

  // To prevent undefined balances in envelopes
useEffect(() => {
  [...walletEnvelopes, ...variableEnvelopes].forEach(env =>
    ensureEnvelope(env.name)
  );
}, [walletEnvelopes, variableEnvelopes]);

  function envelopesForBinder(binder) {
    const lower = binder.name.toLowerCase();

    if (lower.includes("recurring")) return walletEnvelopes;
    if (lower.includes("variable")) return variableEnvelopes;

    return [];
  }

  function handleSaveBinder() {
    if (!newBinderName.trim()) return;
    const updated = addBinder(newBinderName);
    setBinders(updated);
    setNewBinderName("");
    setAddingBinder(false);
  }

  function handleConfirmDelete(id) {
    const updated = removeBinder(id);
    setBinders(updated);
    setEditingId(null);
  }

  function handleStartRename(id, currentName) {
    setEditingId(id);
    setEditedName(currentName);
  }

  function handleSaveRename(id) {
    if (!editedName.trim()) return;
    const updated = renameBinder(id, editedName);
    setBinders(updated);
    setEditingId(null);
    setEditedName("");
  }

  function handleDeleteRequest(id) {
    setEditingId(`confirm-${id}`);
  }

  return (
    <div className="cash-demo">
      <h1 className="title" style={{ maxWidth: "1140px", margin: "0 auto", textAlign:"center", marginBottom: "1rem", color: "var(--text)" }}>
        Your Wallet and Binders
      </h1>

      <p
        className="subtitle"
        style={{
          maxWidth: "550px",
          margin: "0 auto 1.5rem",
          textAlign: "center",
          lineHeight: 1.6,
          color: "var(--muted)"
        }}
      >
        These envelopes reflect your Budget categories. 
        Track your cash manually using the envelope system.
      </p>

      {/* ===============================
          DAILY WALLET
      ===============================*/}
      <section className="wallets-section">
        <h3 className="section-title" style={{ color: "var(--text)" }}>
          Daily Wallet
        </h3>

        <div className="wallets-grid">
          <Wallet
            name="Daily Wallet"
            envelopes={walletEnvelopes.map((env) => ({
              ...env,
              amount: envelopeBalance(env.name),
            }))}
            onAdjust={() => {}}
          />
        </div>
      </section>

      {/* ===============================
          BINDERS
      ===============================*/}
      <section className="binder-section">
        <h3 className="section-title" style={{ color: "var(--text)" }}>
          Binders
        </h3>

        <div className="binder-grid">
          {binders.map((b) => {
            const envs = envelopesForBinder(b).map((env) => ({
              ...env,
              amount: envelopeBalance(env.name),
            }));

            return (
              <div key={b.id} className="binder-card">
                <Binder
                  name={b.name}
                  envelopes={envs}
                  onAdjust={() => {}}
                />

                {editingId === b.id ? (
                  <div className="binder-edit">
                    <input
                      className="input"
                      style={{
                        width: "80%",
                        marginBottom: "0.5rem",
                        background: "var(--panel)",
                        borderColor: "var(--border)",
                        color: "var(--text)"
                      }}
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                      <button className="btn" onClick={() => handleSaveRename(b.id)}>
                        Save
                      </button>
                      <button className="btn danger" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : editingId === `confirm-${b.id}` ? (
                  <div className="binder-confirm">
                    <p style={{ color: "var(--text)", marginBottom: "0.5rem" }}>
                      Delete <strong>{b.name}</strong>?
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                      <button className="btn danger" onClick={() => handleConfirmDelete(b.id)}>
                        Yes
                      </button>
                      <button className="btn" onClick={() => setEditingId(null)}>
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="binder-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button className="btn" onClick={() => handleStartRename(b.id, b.name)}>
                      Rename
                    </button>
                    <button className="btn danger" onClick={() => handleDeleteRequest(b.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ADD BINDER */}
        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          {!addingBinder ? (
            <button className="btn" onClick={() => setAddingBinder(true)} style={{ width: "fit-content" }} >
              + Add Binder
            </button>
          ) : (
            <div
              className="binder-placeholder active"
              style={{
                margin: "1rem auto",
                maxWidth: "260px",
                background: "var(--panel)",
                borderColor: "var(--border)"
              }}
            >
              <input
                type="text"
                className="input"
                placeholder="Binder name"
                value={newBinderName}
                onChange={(e) => setNewBinderName(e.target.value)}
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--border)",
                  color: "var(--text)"
                }}
              />
              <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                <button className="btn" onClick={handleSaveBinder}>
                  Save
                </button>
                <button
                  className="btn danger"
                  onClick={() => {
                    setAddingBinder(false);
                    setNewBinderName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}