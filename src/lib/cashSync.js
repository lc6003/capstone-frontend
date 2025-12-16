import { getBudgets } from "./storage";

export const WALLET_ID = "wallet-recurring";
export const VARIABLE_BINDER_ID = "binder-variable";

export function getAllEnvelopes() {
  const budgets = getBudgets();

  return budgets.map((b) => ({
    id: b.id,
    name: b.name,
    type: b.type === "recurring" ? "recurring" : "variable",
  }));
}

export function getWalletEnvelopes() {
  return getAllEnvelopes().filter((env) => env.type === "recurring");
}

export function getVariableBinderEnvelopes() {
  return getAllEnvelopes().filter((env) => env.type !== "recurring");
}

export function getEnvelopesForRoute(type, name) {
  if (type === "wallets") return getWalletEnvelopes();
  if (type === "binders" && name === "variable-expenses")
    return getVariableBinderEnvelopes();
  return [];
}

const BINDER_KEY = "cv_binders_v1";

const DEFAULT_BINDERS = [
  { id: "variable-expenses", name: "Variable Expenses" },
];

function saveBinders(list) {
  localStorage.setItem(BINDER_KEY, JSON.stringify(list));
}

export function getBinders() {
  try {
    const raw = JSON.parse(localStorage.getItem(BINDER_KEY) || "null");
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      saveBinders(DEFAULT_BINDERS);
      return DEFAULT_BINDERS;
    }
    return raw;
  } catch {
    saveBinders(DEFAULT_BINDERS);
    return DEFAULT_BINDERS;
  }
}

export function addBinder(name) {
  const trimmed = name.trim();
  if (!trimmed) return getBinders();

  const list = getBinders();
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `binder-${Date.now()}`;

  const newBinder = { id, name: trimmed };
  const updated = [...list, newBinder];
  saveBinders(updated);
  return updated;
}

export function renameBinder(id, newName) {
  const trimmed = newName.trim();
  if (!trimmed) return getBinders();

  const list = getBinders().map((b) =>
    b.id === id ? { ...b, name: trimmed } : b
  );
  saveBinders(list);
  return list;
}

export function removeBinder(id) {
  const list = getBinders().filter((b) => b.id !== id);
  saveBinders(list);
  return list;
}
