export default function Envelope({ label, amount }) {
  return (
    <div className="envelope-placeholder">
      <p>{label}: ${amount}</p>
    </div>
  );
}
