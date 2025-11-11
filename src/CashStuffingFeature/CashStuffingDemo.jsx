import { useState } from "react";
import Binder from "./components/Binder";
import Wallet from "./components/Wallet";
import "../styles/CashStuffing.css";

export default function CashStuffingDemo() {
  const sampleEnvelopes = [
    { id: 1, label: "Groceries", amount: 120 },
    { id: 2, label: "Gas", amount: 60 },
    { id: 3, label: "Savings", amount: 200 },
    { id: 4, label: "Other", amount: 100 },
  ];

  const [binders, setBinders] = useState([
    { id: 1, name: "Recurring Expenses" },
    { id: 2, name: "Variable Expenses" },
  ]);

  const [addingBinder, setAddingBinder] = useState(false);
  const [newBinderName, setNewBinderName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");

  // Save new binder
  function handleSaveBinder() {
    if (!newBinderName.trim()) return;
    setBinders([...binders, { id: Date.now(), name: newBinderName.trim() }]);
    setNewBinderName("");
    setAddingBinder(false);
  }

  // Delete binder after confirmation
  function handleConfirmDelete(id) {
    setBinders(binders.filter((b) => b.id !== id));
    setEditingId(null);
  }

  // Start rename mode
  function handleStartRename(id, currentName) {
    setEditingId(id);
    setEditedName(currentName);
  }

  // Save renamed binder
  function handleSaveRename(id) {
    if (!editedName.trim()) return;
    setBinders(
      binders.map((b) => (b.id === id ? { ...b, name: editedName.trim() } : b))
    );
    setEditingId(null);
    setEditedName("");
  }

  // Start delete confirmation
  function handleDeleteRequest(id) {
    setEditingId(`confirm-${id}`);
  }

  return (
    <div className="cash-container">
      <h1 className="title">Your Wallet and Binders</h1>

      <p
        className="subtitle"
        style={{
          maxWidth: "550px",
          margin: "0 auto 1.5rem",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        You can manage your main wallet and add binders for specific budgeting
        categories.
      </p>

      {/* Daily Wallet */}
      <section className="wallets-section">
        <h3 className="section-title">Daily Wallet</h3>
        <div className="wallets-grid">
          <Wallet name="Daily Wallet" envelopes={sampleEnvelopes} />
        </div>
      </section>

      {/* Binders Section */}
      <section className="binder-section">
        <h3 className="section-title">Binders</h3>

        <div className="binder-grid">
          {binders.map((b) => (
            <div key={b.id} className="binder-wrapper">
              <Binder name={b.name} envelopes={sampleEnvelopes} />

              {/* Editing or delete confirmation */}
              {editingId === b.id ? (
                <div className="binder-edit">
                  <input
                    className="input"
                    style={{ width: "80%", marginBottom: "0.5rem" }}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <button className="btn" onClick={() => handleSaveRename(b.id)}>
                      Save
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : editingId === `confirm-${b.id}` ? (
                <div className="binder-confirm">
                  <p style={{ color: "#555", marginBottom: "0.5rem" }}>
                    Delete <strong>{b.name}</strong>?
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      className="btn danger"
                      onClick={() => handleConfirmDelete(b.id)}
                    >
                      Yes
                    </button>
                    <button className="btn" onClick={() => setEditingId(null)}>
                      No
                    </button>
                  </div>
                </div>
              ) : (
                <div className="binder-actions">
                  <button
                    className="btn"
                    onClick={() => handleStartRename(b.id, b.name)}
                  >
                    Rename
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => handleDeleteRequest(b.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* + Add Binder */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          {!addingBinder ? (
            <button
              className="btn"
              onClick={() => setAddingBinder(true)}
              style={{
                width: "auto",
                padding: "0.5rem 1rem",
                fontSize: "0.95rem",
                borderRadius: "10px",
              }}
            >
              + Add Binder
            </button>
          ) : (
            <div
              className="binder-placeholder active"
              style={{
                margin: "1rem auto",
                maxWidth: "260px",
              }}
            >
              <input
                type="text"
                className="input"
                placeholder="Binder name"
                value={newBinderName}
                onChange={(e) => setNewBinderName(e.target.value)}
              />
              <div
                style={{
                  marginTop: "0.75rem",
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
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
