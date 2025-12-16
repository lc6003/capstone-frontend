import "../../styles/Envelope.css";
import { FaMinusCircle, FaPlusCircle } from "react-icons/fa";

export default function Envelope({
  label = "Envelope",
  amount = 0,
  flipping = false,
  flipDirection = "next",
  flat = false,
  onOpenAdjust = () => {},
  onFlipComplete,
}) {
  /* -------- FLAT ENVELOPE MODE -------- */
  if (flat) {
    return (
      <div className="cv-envelope">
        <div className="envelope-controls">
          <button
            className="adjust-btn minus"
            onClick={(e) => onOpenAdjust("minus", e)}
          >
            <FaMinusCircle />
          </button>
          <button
            className="adjust-btn plus"
            onClick={(e) => onOpenAdjust("plus", e)}
          >
            <FaPlusCircle />
          </button>
        </div>

        <div className="cv-envelope-body">
          <span className="cv-envelope-label">{label}</span>
          <span className="cv-envelope-amount">${amount}</span>
        </div>

        <div className="cv-envelope-holes">
          <span /><span /><span /><span />
        </div>
      </div>
    );
  }

  /* -------- FLIPPING VERSION -------- */
  return (
    <div
      className={`flip-wrapper ${
        flipping ? (flipDirection === "next" ? "flip-next" : "flip-prev") : ""
      }`}
      onTransitionEnd={() => flipping && onFlipComplete?.()}
    >
      <div className="envelope-3d">

        {/* FRONT */}
        <div className="envelope-face envelope-front">
          <div className="cv-envelope">
            <div className="envelope-controls">
              <button
                className="adjust-btn minus"
                onClick={(e) => onOpenAdjust("minus", e)}
              >
                <FaMinusCircle />
              </button>
              <button
                className="adjust-btn plus"
                onClick={(e) => onOpenAdjust("plus", e)}
              >
                <FaPlusCircle />
              </button>
            </div>

            <div className="cv-envelope-body">
              <span className="cv-envelope-label">{label}</span>
              <span className="cv-envelope-amount">${amount}</span>
            </div>

            <div className="cv-envelope-holes">
              <span /><span /><span /><span />
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="envelope-face envelope-back">
          <div className="cv-envelope cv-envelope-back">
            <div className="cv-envelope-body-back" />
            <div className="cv-envelope-holes">
              <span /><span /><span /><span />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}