import { useState } from "react";
import Binder from "./components/Binder";
import Wallet from "./components/Wallet";
import { getBudgetTotalsByType, getExpenses, getBudgets } from "../lib/storage.js";
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
  getAllocations,
  saveAllocation
} from "../lib/storage.js";

export default function CashStuffingDemo() {
  /* -------------------------------
     LOAD ALLOCATIONS + SPENDING
  --------------------------------*/
  const [allocations, _setAllocLocal] = useState(() => getAllocations());
  const expenses = getExpenses();

  function updateAllocation(category, delta) {
    const current = allocations[category] || 0;
    const updated = saveAllocation(category, current + delta);
    _setAllocLocal({ ...updated });
  }

  function amountAvailableFor(category) {
    const allocated = allocations[category] || 0;

    const spent = expenses
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const value = allocated - spent;
    return value > 0 ? value : 0;
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
    // ⭐ FIXED: This allows dark mode to work
    <div className="page-container cash-container">
      <h1 className="title" style={{ color: "var(--text)" }}>
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
        These envelopes reflect your real Budget categories.
        Cash = Allocated − Spent.  
        Use the green and red buttons to adjust your allocation.
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
              amount: amountAvailableFor(env.name),
            }))}
            onAdjust={(category, delta) => updateAllocation(category, delta)}
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
              amount: amountAvailableFor(env.name),
            }));

            return (
              <div key={b.id} className="binder-wrapper">
                <Binder
                  name={b.name}
                  envelopes={envs}
                  onAdjust={(category, delta) => updateAllocation(category, delta)}
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
                  <div className="binder-actions">
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
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
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
