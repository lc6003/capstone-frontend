export default function Binder({ name, envelopes }) {
  return (
    <div className="binder-placeholder">
      <h3>{name}</h3>
      <p>This will be the Binder view</p>
      <p>Envelopes: {envelopes.length}</p>
    </div>
  );
}
