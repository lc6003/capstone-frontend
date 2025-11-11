export default function Wallet({ name, envelopes }) {
  return (
    <div className="wallet-placeholder">
      <h3>{name}</h3>
      <p>This will be the Wallet view</p>
      <p>Envelopes: {envelopes.length}</p>
    </div>
  );
}
