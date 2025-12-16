import { useMemo, useState } from "react";
import {
  addExpense,
  getExpenses,
  removeExpense,
  getBudgets,
  getAllocations,
  saveAllocation,
} from "../lib/storage.js";
import { FiEdit2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Expenses() {
  const [_, force] = useState(0);
  const navigate = useNavigate();

  const budgets = getBudgets();
  const allocations = getAllocations();

  const [editingCategory, setEditingCategory] = useState(null);
  const [allocationInput, setAllocationInput] = useState("");

  const [form, setForm] = useState({
    amount: "",
    category: budgets[0]?.name || "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  const expenses = useMemo(
    () => getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date)),
    [_]
  );

  function submit(e) {
    e.preventDefault();
    if (!form.amount) return;

    addExpense({ ...form, amount: Number(form.amount) });
    setForm((f) => ({ ...f, amount: "", note: "" }));
    force((x) => x + 1);
  }

  function del(id) {
    removeExpense(id);
    force((x) => x + 1);
  }

  function startAllocationEdit(category) {
    setEditingCategory(category);
    setAllocationInput(allocations[category] ?? "");
  }

  function saveAllocationEdit() {
    saveAllocation(editingCategory, Number(allocationInput || 0));
    setEditingCategory(null);
    setAllocationInput("");
    force((x) => x + 1);
  }

  return (
    <div className="dashboard-container dash">
      <div className="grid">
        {/* ADD EXPENSE */}
        <section className="card col-12">
          <h2>Spending</h2>

          <form className="row" onSubmit={submit}>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
              }
              style={{ maxWidth: 160 }}
            />

            <select
              className="select"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              style={{ maxWidth: 220 }}
            >
              <option value="">Uncategorized</option>
              {budgets.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              style={{ maxWidth: 180 }}
            />

            <input
              className="input"
              type="text"
              placeholder="Note"
              value={form.note}
              onChange={(e) =>
                setForm({ ...form, note: e.target.value })
              }
            />

            <button className="btn" type="submit">
              Add
            </button>
          </form>
        </section>

        {/* RECENT EXPENSES */}
        <section className="card col-12">
          <h3>Recent</h3>

          {expenses.length === 0 ? (
            <p className="muted">No expenses yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Allocated</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((e) => {
                  const allocated = allocations[e.category] ?? 0;
                  const isEditing = editingCategory === e.category;

                  return (
                    <tr key={e.id}>
                      <td>
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                      <td>{e.category || "Uncategorized"}</td>
                      <td>${Number(e.amount).toFixed(2)}</td>

                      {/* Allocation column */}
                      <td>
                        {isEditing ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                            }}
                          >
                            <input
                              type="number"
                              className="input"
                              style={{ width: 90 }}
                              value={allocationInput}
                              onChange={(e) =>
                                setAllocationInput(e.target.value)
                              }
                            />
                            <button
                              className="btn"
                              onClick={saveAllocationEdit}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <>
                            ${allocated.toFixed(2)}
                            <button
                              className="alloc-edit-btn"
                              title="Edit Allocated"
                              onClick={() =>
                                startAllocationEdit(e.category)
                              }
                              style={{
                                marginLeft: "0.4rem",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <FiEdit2 size={14} />
                            </button>
                          </>
                        )}
                      </td>

                      <td>{e.note}</td>

                      <td>
                        <button
                          className="btn danger"
                          onClick={() => del(e.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}