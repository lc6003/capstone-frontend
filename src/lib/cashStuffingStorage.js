const KEY = "cv_cash_envelopes_v1";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

/**
 * Returns all envelope balances
 */
export function getCashEnvelopes() {
  return read();
}

/**
 * Ensures an envelope exists with a balance
 */
export function ensureEnvelope(name) {
  if (!name) return;

  const data = read();

  if (!data[name]) {
    data[name] = { balance: 0 };
    write(data);
  }

  return data[name];
}

/**
 * Adjusts an envelope balance by a delta
 * (we'll use this in the next step)
 */
export function adjustEnvelopeBalance(name, delta) {
  if (!name) return 0;

  const data = read();

  if (!data[name]) {
    data[name] = { balance: 0 };
  }

  data[name].balance = Math.max(
    0,
    (Number(data[name].balance) || 0) + (Number(delta) || 0)
  );

  write(data);
  return data[name].balance;
}

export function resetEnvelope(name) {
  if (!name) return;

  const data = read();

  if (data[name]) {
    data[name].balance = 0;
    write(data);
  }
}
